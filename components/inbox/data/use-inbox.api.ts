/**
 * Live backend implementation of the Inbox data contract.
 *
 * Talks to the brand-scoped inbox API (functions/trendly_v2 → /api/v2):
 *   GET    /brands/:brandId/inbox
 *   POST   /brands/:brandId/inbox/conversations/:id/reply
 *   POST   /brands/:brandId/inbox/conversations/:id/hide
 *   DELETE /brands/:brandId/inbox/conversations/:id
 *   POST   /brands/:brandId/inbox/conversations/:id/read
 *
 * The backend returns objects already shaped to this module's types, so the
 * JSON is consumed directly. Mutations are optimistic, then reconciled by a
 * background refetch.
 */
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import {
    ConnectedInboxAccount,
    InboxConversation,
    InboxMessage,
    UseInboxResult,
} from "../types";

/**
 * Maps raw `brands/{brandId}/socialAccounts` Firestore documents to the inbox's
 * `ConnectedInboxAccount` shape. Mirrors the backend's `ListAccounts`
 * (internal/trendlyapis/inbox/service.go): only Meta channels participate, and a
 * Facebook Page with a linked IG Business Account also surfaces an Instagram
 * entry so the UI shows IG as connected.
 */
function mapConnectedAccounts(docs: any[]): ConnectedInboxAccount[] {
    const out: ConnectedInboxAccount[] = [];
    for (const s of docs) {
        const channel = s?.platform;
        if (channel !== "instagram" && channel !== "facebook") continue;
        out.push({
            id: s.id,
            channel,
            name: s.displayName ?? "",
            handle: s.username ?? "",
            avatarUrl: s.profileImageURL,
        });
        if (channel === "facebook" && s.instagramBusinessId) {
            out.push({
                id: s.id,
                channel: "instagram",
                name: s.displayName ?? "",
                handle: "",
                avatarUrl: s.profileImageURL,
            });
        }
    }
    return out;
}

export function useInboxApi(): UseInboxResult {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [loading, setLoading] = useState(true);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedInboxAccount[]>([]);
    const [conversations, setConversations] = useState<InboxConversation[]>([]);

    // True once the backend GET has applied authoritative state for the current
    // brand. Guards the instant Firestore paint from clobbering fresher data if
    // the (parallel) backend call wins the race.
    const backendSettledRef = useRef(false);

    const fetchInbox = useCallback(async () => {
        if (!brandId) {
            setConnectedAccounts([]);
            setConversations([]);
            setLoading(false);
            return;
        }
        try {
            const res = await HttpWrapper.fetch(`/api/v2/brands/${brandId}/inbox`);
            const data = await res.json();
            backendSettledRef.current = true;
            setConnectedAccounts(data.connectedAccounts ?? []);
            setConversations(data.conversations ?? []);
        } catch (e) {
            // Leave whatever we have; surface nothing destructive to the UI.
            console.warn("inbox: failed to load", e);
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    useEffect(() => {
        if (!brandId) {
            setConnectedAccounts([]);
            setConversations([]);
            setLoading(false);
            return;
        }

        backendSettledRef.current = false;
        setLoading(true);
        let cancelled = false;

        // Instant paint: the backend already persists the inbox to Firestore
        // (brands/{brandId}/inbox + socialAccounts), so read it directly instead
        // of waiting on the Lambda round-trip + Meta sync. Only flips the spinner
        // off when there is meaningful cached content (≥1 connected account) — a
        // cold cache falls through to the backend response, so no regression.
        (async () => {
            try {
                const [convSnap, accSnap] = await Promise.all([
                    getDocs(collection(FirestoreDB, "brands", brandId, "inbox")),
                    getDocs(collection(FirestoreDB, "brands", brandId, "socialAccounts")),
                ]);
                if (cancelled || backendSettledRef.current) return;
                const accounts = mapConnectedAccounts(accSnap.docs.map((d) => d.data()));
                if (accounts.length === 0) return;
                setConnectedAccounts(accounts);
                setConversations(
                    convSnap.docs.map((d) => d.data() as InboxConversation)
                );
                setLoading(false);
            } catch (e) {
                // Best-effort cache read; the backend GET will still populate.
                console.warn("inbox: firestore cache read failed", e);
            }
        })();

        // Authoritative refresh in the background (also triggers the server-side
        // Meta sync on a cold cache). Reconciles whatever the cache painted.
        fetchInbox();

        return () => {
            cancelled = true;
        };
    }, [brandId, fetchInbox]);

    const sendReply = useCallback(
        async (conversationId: string, text: string) => {
            if (!brandId) return;
            const reply: InboxMessage = {
                id: `local_${Date.now()}`,
                author: "business",
                text,
                sentAt: Date.now(),
            };
            // Optimistic update.
            setConversations((prev) =>
                prev.map((c) => {
                    if (c.id !== conversationId) return c;
                    if (c.kind === "dm") {
                        return {
                            ...c,
                            messages: [...(c.messages ?? []), reply],
                            preview: text,
                            lastActivityAt: reply.sentAt,
                            unread: false,
                        };
                    }
                    return {
                        ...c,
                        comment: c.comment
                            ? { ...c.comment, replies: [...c.comment.replies, reply] }
                            : c.comment,
                        lastActivityAt: reply.sentAt,
                        unread: false,
                    };
                })
            );
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/conversations/${conversationId}/reply`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text }),
                    }
                );
            } catch (e) {
                console.warn("inbox: reply failed", e);
            } finally {
                fetchInbox();
            }
        },
        [brandId, fetchInbox]
    );

    const setCommentHidden = useCallback(
        async (conversationId: string, hidden: boolean) => {
            if (!brandId) return;
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === conversationId && c.comment
                        ? { ...c, comment: { ...c.comment, hidden } }
                        : c
                )
            );
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/conversations/${conversationId}/hide`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ hidden }),
                    }
                );
            } catch (e) {
                console.warn("inbox: hide failed", e);
                fetchInbox();
            }
        },
        [brandId, fetchInbox]
    );

    const deleteComment = useCallback(
        async (conversationId: string) => {
            if (!brandId) return;
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/conversations/${conversationId}`,
                    { method: "DELETE" }
                );
            } catch (e) {
                console.warn("inbox: delete failed", e);
                fetchInbox();
            }
        },
        [brandId, fetchInbox]
    );

    const markRead = useCallback(
        async (conversationId: string) => {
            if (!brandId) return;
            setConversations((prev) =>
                prev.map((c) => (c.id === conversationId ? { ...c, unread: false } : c))
            );
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/conversations/${conversationId}/read`,
                    { method: "POST" }
                );
            } catch {
                // non-critical
            }
        },
        [brandId]
    );

    const resyncInbox = useCallback(async () => {
        if (!brandId) return;
        setLoading(true);
        try {
            const res = await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/inbox/resync`,
                { method: "POST" }
            );
            const data = await res.json();
            backendSettledRef.current = true;
            setConversations(data.conversations ?? []);
        } catch (e) {
            console.warn("inbox: resync failed", e);
            // Fall back to a normal refresh so the UI isn't left stale.
            await fetchInbox();
        } finally {
            setLoading(false);
        }
    }, [brandId, fetchInbox]);

    return {
        loading,
        connectedAccounts,
        conversations,
        sendReply,
        setCommentHidden,
        deleteComment,
        markRead,
        resyncInbox,
    };
}
