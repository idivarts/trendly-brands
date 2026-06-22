/**
 * Live backend implementation of the Inbox data contract.
 *
 * Reads are realtime: the conversation list and connected accounts are streamed
 * straight from Firestore (`brands/{brandId}/inbox` + `socialAccounts`) via
 * onSnapshot. The slow Meta sync runs in a background SQS worker that upserts
 * each conversation as it goes, so they appear live as they load — no waiting on
 * one big API round-trip.
 *
 * Writes still go through the brand-scoped inbox API (functions/trendly_v2):
 *   POST   /brands/:brandId/inbox/sync             (queue background sync)
 *   POST   /brands/:brandId/inbox/resync           (queue background resync)
 *   POST   /brands/:brandId/inbox/conversations/:id/reply
 *   POST   /brands/:brandId/inbox/conversations/:id/hide
 *   DELETE /brands/:brandId/inbox/conversations/:id
 *   POST   /brands/:brandId/inbox/conversations/:id/read
 *
 * Mutations are optimistic; the Firestore listener reconciles them once the
 * backend write lands.
 */
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

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

    // Fire-and-forget trigger for the background sync worker. The results stream
    // back in through the Firestore listener below, so we don't read the response.
    const triggerSync = useCallback(
        async (path: "sync" | "resync") => {
            if (!brandId) return;
            try {
                await HttpWrapper.fetch(`/api/v2/brands/${brandId}/inbox/${path}`, {
                    method: "POST",
                });
            } catch (e) {
                console.warn(`inbox: trigger ${path} failed`, e);
            }
        },
        [brandId]
    );

    useEffect(() => {
        if (!brandId) {
            setConnectedAccounts([]);
            setConversations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        let coldTriggered = false;
        // Hold the spinner until BOTH listeners have reported once, so the UI
        // never flashes "no socials" while the accounts snapshot is still in
        // flight after the inbox one lands.
        let inboxReady = false;
        let accountsReady = false;
        const settleIfReady = () => {
            if (inboxReady && accountsReady) setLoading(false);
        };

        // Realtime conversation list. The background worker upserts each
        // conversation as it processes them, so they appear here incrementally.
        const unsubInbox = onSnapshot(
            collection(FirestoreDB, "brands", brandId, "inbox"),
            (snap) => {
                setConversations(snap.docs.map((d) => d.data() as InboxConversation));
                if (!inboxReady) {
                    inboxReady = true;
                    settleIfReady();
                    // Cold cache → kick a background sync; rows stream in via this
                    // same listener as the worker writes them.
                    if (snap.empty && !coldTriggered) {
                        coldTriggered = true;
                        triggerSync("sync");
                    }
                }
            },
            (e) => {
                console.warn("inbox: conversations snapshot failed", e);
                inboxReady = true;
                settleIfReady();
            }
        );

        // Realtime connected accounts (mirrors the backend's ListAccounts mapping).
        const unsubAccounts = onSnapshot(
            collection(FirestoreDB, "brands", brandId, "socialAccounts"),
            (snap) => {
                setConnectedAccounts(mapConnectedAccounts(snap.docs.map((d) => d.data())));
                accountsReady = true;
                settleIfReady();
            },
            (e) => {
                console.warn("inbox: accounts snapshot failed", e);
                accountsReady = true;
                settleIfReady();
            }
        );

        return () => {
            unsubInbox();
            unsubAccounts();
        };
    }, [brandId, triggerSync]);

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
            }
            // No manual refetch — the Firestore listener reconciles once the
            // backend write lands.
        },
        [brandId]
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
            }
        },
        [brandId]
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
            }
        },
        [brandId]
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

    // Look for new conversations / messages without clearing anything (pull-to-
    // refresh + the desktop refresh button). Additive; updates arrive via the
    // Firestore listener.
    const refreshInbox = useCallback(async () => {
        await triggerSync("sync");
    }, [triggerSync]);

    // Queue a background resync (clear DM cache + re-pull from Meta). The cleared
    // and rebuilt rows arrive live through the Firestore listener.
    const resyncInbox = useCallback(async () => {
        await triggerSync("resync");
    }, [triggerSync]);

    // Unit-level resyncs. Each POSTs and returns; the Firestore listener surfaces
    // the refreshed item (the caller spins until the item's updatedAt advances).
    const postConv = useCallback(
        async (convId: string, path: string) => {
            if (!brandId) return;
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/conversations/${convId}/${path}`,
                    { method: "POST" }
                );
            } catch (e) {
                console.warn(`inbox: ${path} failed`, e);
            }
        },
        [brandId]
    );

    const resyncProfile = useCallback((convId: string) => postConv(convId, "resync-profile"), [postConv]);
    const resyncThread = useCallback((convId: string) => postConv(convId, "resync"), [postConv]);
    const resyncMessage = useCallback(
        async (convId: string, msgId: string) => {
            if (!brandId) return;
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/conversations/${convId}/messages/${msgId}/resync`,
                    { method: "POST" }
                );
            } catch (e) {
                console.warn("inbox: message resync failed", e);
            }
        },
        [brandId]
    );

    return {
        loading,
        connectedAccounts,
        conversations,
        sendReply,
        setCommentHidden,
        deleteComment,
        markRead,
        refreshInbox,
        resyncInbox,
        resyncProfile,
        resyncThread,
        resyncMessage,
    };
}
