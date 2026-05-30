import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { aiWS } from "@/utils/ai-ws";
import { useCallback, useEffect, useRef, useState } from "react";

export type AIModule = "strategy" | "calendar" | "content" | "general";

export interface AIMessage {
    role: "user" | "assistant" | "tool";
    content: string;
    model?: string;
    focusedText?: string;
    imageUrl?: string;
    tokenCount?: number;
    timestamp: number;
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
}

export function useAIChat({ module, contextId, autoOpenLatest = true }: UseAIChatOpts) {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [threads, setThreads] = useState<AIConversationMeta[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [streamingContent, setStreamingContent] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [loading, setLoading] = useState(false);

    const brandId = selectedBrand?.id;
    const streamingRef = useRef("");
    // Guards auto-open so it fires once per module + contextId, not on every
    // refreshThreads. Reset when the scope changes.
    const autoOpenedRef = useRef(false);

    const refreshThreads = useCallback(async () => {
        if (!brandId) return;
        try {
            const q = new URLSearchParams({ brandId, module });
            if (contextId) q.set("contextId", contextId);
            const res = await HttpWrapper.fetch(`/api/ai/conversations?${q.toString()}`);
            const data = await res.json();
            const all = (data.conversations ?? []) as AIConversationMeta[];
            const filtered = contextId
                ? all.filter((t) => t.contextId === contextId)
                : all;
            setThreads(filtered);
        } catch {
            setThreads([]);
        }
    }, [brandId, module, contextId]);

    // Reset the active thread + auto-open guard whenever the scope changes
    // (e.g. navigating Strategy A → B) so the new scope opens its own latest.
    useEffect(() => {
        autoOpenedRef.current = false;
        setActiveThreadId(null);
        setMessages([]);
    }, [module, contextId]);

    useEffect(() => {
        refreshThreads();
    }, [refreshThreads]);

    const loadThread = useCallback(async (conversationId: string) => {
        setLoading(true);
        try {
            const res = await HttpWrapper.fetch(`/api/ai/conversations/${conversationId}`);
            const data = await res.json();
            setActiveThreadId(conversationId);
            setMessages((data.messages ?? []) as AIMessage[]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-open the most recent conversation for this scope (threads arrive
    // ordered by updatedAt desc). Fires once until the scope changes.
    useEffect(() => {
        if (!autoOpenLatest) return;
        if (autoOpenedRef.current) return;
        if (activeThreadId) return;
        if (threads.length === 0) return;
        autoOpenedRef.current = true;
        loadThread(threads[0].id);
    }, [autoOpenLatest, threads, activeThreadId, loadThread]);

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
            setActiveThreadId(newId);
            setMessages([]);
            await refreshThreads();
            return newId;
        }
        return null;
    }, [brandId, module, contextId, refreshThreads]);

    const deleteThread = useCallback(async (conversationId: string) => {
        await HttpWrapper.fetch(`/api/ai/conversations/${conversationId}`, { method: "DELETE" });
        if (activeThreadId === conversationId) {
            setActiveThreadId(null);
            setMessages([]);
        }
        await refreshThreads();
    }, [activeThreadId, refreshThreads]);

    const renameThread = useCallback(async (conversationId: string, title: string) => {
        await HttpWrapper.fetch(`/api/ai/conversations/${conversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });
        await refreshThreads();
    }, [refreshThreads]);

    useEffect(() => {
        const remove = aiWS.addListener((msg: any) => {
            if (!activeThreadId) return;
            if (msg.conversationId && msg.conversationId !== activeThreadId) return;
            if (msg.type === "token" && typeof msg.delta === "string") {
                streamingRef.current += msg.delta;
                setStreamingContent(streamingRef.current);
            } else if (msg.type === "done") {
                const finalContent = streamingRef.current;
                streamingRef.current = "";
                setStreamingContent("");
                setIsStreaming(false);
                if (finalContent) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: "assistant",
                            content: finalContent,
                            timestamp: Date.now(),
                        },
                    ]);
                }
            } else if (msg.type === "error") {
                streamingRef.current = "";
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
            setMessages((prev) => [
                ...prev,
                { role: "user", content, focusedText, timestamp: Date.now() },
            ]);
            streamingRef.current = "";
            setStreamingContent("");
            setIsStreaming(true);
            await aiWS.send({
                type: "message",
                brandId,
                conversationId: convId,
                content,
                focusedText,
                model,
            });
        },
        [brandId, manager?.id, activeThreadId, createThread]
    );

    return {
        threads,
        activeThreadId,
        messages,
        streamingContent,
        isStreaming,
        loading,
        createThread,
        loadThread,
        deleteThread,
        renameThread,
        sendMessage,
        refreshThreads,
    };
}
