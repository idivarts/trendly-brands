import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { aiWS } from "@/utils/ai-ws";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { router } from "expo-router";
import {
    collection,
    limit as fsLimit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AIModule = "strategy" | "calendar" | "content" | "general" | "onboarding";

/** How many messages to load in the first page, and per "load older" step. */
const MESSAGE_PAGE_SIZE = 30;

/**
 * AIControl is an optional structured answer control attached to an assistant
 * message — either a set of selectable options or a typed/validated input field.
 * Mirrors the backend trendlymodels.AIControl. Available in every module.
 */
export interface AIControlOption {
    label: string;
    value: string;
}

export interface AIControl {
    kind: "options" | "input";
    // options
    selectionType?: "single" | "multi";
    options?: AIControlOption[];
    allowCustom?: boolean;
    // input
    inputType?: "text" | "phone" | "url" | "email";
    placeholder?: string;
    optional?: boolean;
}

export interface AIMessage {
    /** Firestore doc id for committed messages; absent on optimistic bubbles. */
    id?: string;
    /** Client-generated id used to reconcile an optimistic user bubble. */
    clientMsgId?: string;
    role: "user" | "assistant" | "tool";
    content: string;
    model?: string;
    focusedText?: string;
    imageUrl?: string;
    tokenCount?: number;
    timestamp: number;
    control?: AIControl;
}

export interface AIConversationMeta {
    id: string;
    brandId: string;
    userId: string;
    module: string;
    contextId?: string;
    title: string;
    currentModel: string;
    createdAt: number;
    updatedAt: number;
}

interface UseAIChatOpts {
    module: AIModule;
    contextId?: string;
    /**
     * When true (default), the most recent conversation for this
     * module + contextId is loaded automatically on open. Pass false to
     * start blank — e.g. while an `initialMessage` is queued so it lands in a
     * fresh thread instead of appending to the last one.
     */
    autoOpenLatest?: boolean;
    /**
     * Fired when the backend signals onboarding is complete (all required brand
     * fields collected). The onboarding screen uses this to finalize the brand.
     */
    onOnboardingComplete?: () => void;
}

function newClientMsgId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * AI chat state, with **Firestore as the source of truth** for displayed
 * content. The thread list and message history are live Firestore
 * subscriptions — no backend GET — so the conversation survives tab-switch /
 * minimize / reconnect. The WebSocket only drives the live "typing" feel: token
 * deltas accumulate into a transient streaming bubble that is replaced by the
 * committed Firestore message once the turn finishes (`done`).
 */
export function useAIChat({ module, contextId, autoOpenLatest = true, onOnboardingComplete }: UseAIChatOpts) {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [threads, setThreads] = useState<AIConversationMeta[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [committed, setCommitted] = useState<AIMessage[]>([]);
    const [streamingContent, setStreamingContent] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(MESSAGE_PAGE_SIZE);
    const [hasMore, setHasMore] = useState(false);
    // True until the conversation is ready to use: the brand is resolved and the
    // thread list has loaded once (plus the latest thread chosen when
    // auto-opening). Drives the panel's init loader + send-disabled state.
    const [initializing, setInitializing] = useState(true);

    const brandId = selectedBrand?.id;
    const userId = manager?.id;
    const streamingRef = useRef("");
    // A control pushed mid-stream is buffered here and attached to the lingering
    // assistant bubble when the turn finishes ("done").
    const pendingControlRef = useRef<AIControl | null>(null);
    // Optimistic user bubbles awaiting their Firestore doc, keyed by clientMsgId.
    const [pendingUsers, setPendingUsers] = useState<AIMessage[]>([]);
    // The just-finished assistant turn, kept on screen until its Firestore doc
    // arrives over the subscription so the bubble never flickers out and back.
    const [lingerAssistant, setLingerAssistant] = useState<AIMessage | null>(null);
    // Kept in a ref so the WS listener doesn't need to resubscribe when the
    // callback identity changes.
    const onOnboardingCompleteRef = useRef(onOnboardingComplete);
    onOnboardingCompleteRef.current = onOnboardingComplete;
    // Guards auto-open so it fires once per module + contextId, not on every
    // thread-list snapshot. Reset when the scope changes.
    const autoOpenedRef = useRef(false);

    // ── Thread list: live subscription ────────────────────────────────────
    // Replaces the old GET /api/ai/conversations. Filters userId == self so the
    // query satisfies the author-only Firestore rule.
    useEffect(() => {
        if (!brandId || !userId) {
            setThreads([]);
            setInitializing(true);
            return;
        }
        setInitializing(true);
        const constraints: any[] = [
            where("brandId", "==", brandId),
            where("userId", "==", userId),
            where("module", "==", module),
        ];
        if (contextId) constraints.push(where("contextId", "==", contextId));
        constraints.push(orderBy("updatedAt", "desc"));
        const q = query(collection(FirestoreDB, "ai_conversations"), ...constraints);

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AIConversationMeta[];
                setThreads(list);
                if (autoOpenLatest && !autoOpenedRef.current && list.length > 0) {
                    autoOpenedRef.current = true;
                    setActiveThreadId(list[0].id);
                }
                setInitializing(false);
            },
            () => setInitializing(false)
        );
        return () => unsub();
    }, [brandId, userId, module, contextId, autoOpenLatest]);

    // Reset the active thread + auto-open guard whenever the scope changes
    // (e.g. navigating Strategy A → B) so the new scope opens its own latest.
    useEffect(() => {
        autoOpenedRef.current = false;
        setActiveThreadId(null);
        setCommitted([]);
        setPendingUsers([]);
        setLingerAssistant(null);
        setPageSize(MESSAGE_PAGE_SIZE);
        setHasMore(false);
    }, [module, contextId]);

    // ── Message history: live subscription (newest page, paginated) ───────
    // Replaces the old GET /api/ai/conversations/:id. Orders by timestamp desc
    // with a limit, then renders ascending. "Load older" grows the window.
    useEffect(() => {
        if (!activeThreadId) {
            setCommitted([]);
            setHasMore(false);
            return;
        }
        if (!userId) {
            setCommitted([]);
            return;
        }
        setLoading(true);
        // Filter userId == self so the query provably matches the author-only
        // Firestore rule (rules are not filters — an unconstrained query would be
        // denied). Backed by the messages {userId, timestamp} composite index.
        const q = query(
            collection(FirestoreDB, "ai_conversations", activeThreadId, "messages"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            fsLimit(pageSize)
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AIMessage[];
                // Stored newest-first; reverse for ascending display.
                docs.reverse();
                setCommitted(docs);
                setHasMore(snap.size >= pageSize);
                setLoading(false);

                // Reconcile optimistic/lingering bubbles against what's now committed.
                const seenClientIds = new Set(docs.map((m) => m.clientMsgId).filter(Boolean));
                const committedUserContent = new Set(
                    docs.filter((m) => m.role === "user").map((m) => m.content)
                );
                setPendingUsers((prev) =>
                    prev.filter((m) => {
                        // Primary: the committed doc echoes our clientMsgId.
                        if (m.clientMsgId && seenClientIds.has(m.clientMsgId)) return false;
                        // Fallback (clientMsgId missing): a user doc with the same text
                        // is committed — drop to avoid a duplicate bubble.
                        if (committedUserContent.has(m.content)) return false;
                        return true;
                    })
                );
                const committedIds = new Set(docs.map((m) => m.id));
                setLingerAssistant((prev) => {
                    if (!prev) return null;
                    // Primary: the committed doc arrived (matched by messageId).
                    if (prev.id && committedIds.has(prev.id)) return null;
                    // Fallback (id missing/unknown): an assistant doc with the same
                    // text is now committed — drop the linger to avoid a duplicate.
                    if (docs.some((m) => m.role === "assistant" && m.content === prev.content)) return null;
                    return prev;
                });
            },
            () => setLoading(false)
        );
        return () => unsub();
    }, [activeThreadId, pageSize, userId]);

    const loadOlder = useCallback(() => {
        if (hasMore) setPageSize((n) => n + MESSAGE_PAGE_SIZE);
    }, [hasMore]);

    // setActiveThreadId is enough — the subscription above loads history. Kept
    // async + same name so existing callers don't change.
    const loadThread = useCallback(async (conversationId: string) => {
        setPageSize(MESSAGE_PAGE_SIZE);
        setActiveThreadId(conversationId);
    }, []);

    // No-op retained for callers (the thread list is live now). Resolves with
    // the current threads.
    const threadsRef = useRef(threads);
    threadsRef.current = threads;
    const refreshThreads = useCallback(async (): Promise<AIConversationMeta[]> => threadsRef.current, []);

    const createThread = useCallback(async (title?: string): Promise<string | null> => {
        if (!brandId) return null;
        const res = await HttpWrapper.fetch(`/api/ai/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brandId, module, contextId, title }),
        });
        const data = await res.json();
        const newId = data.conversation?.id as string | undefined;
        if (newId) {
            setPageSize(MESSAGE_PAGE_SIZE);
            setActiveThreadId(newId);
            // The thread list subscription will surface it; nothing else to do.
            return newId;
        }
        return null;
    }, [brandId, module, contextId]);

    const deleteThread = useCallback(async (conversationId: string) => {
        await HttpWrapper.fetch(`/api/ai/conversations/${conversationId}`, { method: "DELETE" });
        if (activeThreadId === conversationId) {
            setActiveThreadId(null);
            setCommitted([]);
        }
    }, [activeThreadId]);

    const renameThread = useCallback(async (conversationId: string, title: string) => {
        await HttpWrapper.fetch(`/api/ai/conversations/${conversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });
    }, []);

    // ── WebSocket: live typing feel only ──────────────────────────────────
    // Tokens accumulate into the streaming bubble. On `done` the bubble lingers
    // (keyed by the committed messageId) until the Firestore subscription
    // delivers the real doc, which then replaces it. Content always resolves
    // from Firestore — the socket only animates it.
    useEffect(() => {
        const remove = aiWS.addListener((msg: any) => {
            if (!activeThreadId) return;
            if (msg.conversationId && msg.conversationId !== activeThreadId) return;
            if (msg.type === "token" && typeof msg.delta === "string") {
                streamingRef.current += msg.delta;
                setStreamingContent(streamingRef.current);
            } else if (msg.type === "control") {
                pendingControlRef.current = (msg.control as AIControl) ?? null;
            } else if (msg.type === "onboarding_complete") {
                onOnboardingCompleteRef.current?.();
            } else if (msg.type === "done") {
                const finalContent = streamingRef.current;
                const control = pendingControlRef.current;
                streamingRef.current = "";
                pendingControlRef.current = null;
                setStreamingContent("");
                setIsStreaming(false);
                // Linger the finished assistant turn until Firestore delivers the
                // committed doc (matched by messageId), so it never flickers.
                if (finalContent || control) {
                    setLingerAssistant({
                        id: msg.messageId,
                        role: "assistant",
                        content: finalContent,
                        control: control ?? undefined,
                        timestamp: Date.now(),
                    });
                }
            } else if (msg.type === "upgrade_required") {
                streamingRef.current = "";
                pendingControlRef.current = null;
                setStreamingContent("");
                setIsStreaming(false);
                Toaster.error("This needs a higher plan. Please upgrade to continue.");
                router.push("/billing");
            } else if (msg.type === "error") {
                streamingRef.current = "";
                pendingControlRef.current = null;
                setStreamingContent("");
                setIsStreaming(false);
            }
        });
        return remove;
    }, [activeThreadId]);

    const sendMessage = useCallback(
        async (content: string, focusedText?: string, model?: string) => {
            if (!brandId || !manager?.id) return;
            let convId = activeThreadId;
            if (!convId) {
                convId = await createThread();
                if (!convId) return;
            }
            const clientMsgId = newClientMsgId();
            // Optimistic user bubble — dropped once its Firestore doc syncs.
            setPendingUsers((prev) => [
                ...prev,
                { role: "user", content, focusedText, clientMsgId, timestamp: Date.now() },
            ]);
            streamingRef.current = "";
            setStreamingContent("");
            setIsStreaming(true);
            await aiWS.send({
                type: "message",
                brandId,
                conversationId: convId,
                clientMsgId,
                content,
                focusedText,
                model,
            });
        },
        [brandId, manager?.id, activeThreadId, createThread]
    );

    // Rendered history = committed (Firestore) + any optimistic user bubbles not
    // yet synced + the lingering assistant turn not yet synced. The panel adds
    // the live streaming bubble separately while `isStreaming`.
    //
    // The transient bubbles are deduped against `committed` HERE — in the derived
    // list — not only in the snapshot handler. The snapshot reconciliation can
    // miss a race: the Firestore doc can land BEFORE the WS `done` frame (the
    // backend writes the message, then sends `done`), so the snapshot handler
    // runs while `lingerAssistant` is still null and the linger is added
    // afterwards as a permanent duplicate. Filtering in the memo is
    // order-independent, so a committed message always suppresses its matching
    // optimistic/linger twin (Notion 37b42d5f…dcc52d).
    const messages = useMemo<AIMessage[]>(() => {
        const committedIds = new Set(committed.map((m) => m.id).filter(Boolean));
        const committedClientIds = new Set(
            committed.map((m) => m.clientMsgId).filter(Boolean)
        );
        const committedUserContent = new Set(
            committed.filter((m) => m.role === "user").map((m) => m.content)
        );
        const committedAssistantContent = new Set(
            committed.filter((m) => m.role === "assistant").map((m) => m.content)
        );

        const visiblePending = pendingUsers.filter((m) => {
            if (m.clientMsgId && committedClientIds.has(m.clientMsgId)) return false;
            if (committedUserContent.has(m.content)) return false;
            return true;
        });

        const showLinger =
            !!lingerAssistant &&
            !(lingerAssistant.id && committedIds.has(lingerAssistant.id)) &&
            !committedAssistantContent.has(lingerAssistant.content);

        const out = [...committed, ...visiblePending];
        if (showLinger && lingerAssistant) out.push(lingerAssistant);
        return out;
    }, [committed, pendingUsers, lingerAssistant]);

    return {
        threads,
        activeThreadId,
        messages,
        streamingContent,
        isStreaming,
        loading,
        initializing,
        hasMore,
        loadOlder,
        createThread,
        loadThread,
        deleteThread,
        renameThread,
        sendMessage,
        refreshThreads,
    };
}
