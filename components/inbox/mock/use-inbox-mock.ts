/**
 * MOCK ONLY — delete this file when removing the mock layer.
 *
 * In-memory implementation of `UseInboxResult`. Holds conversations in local
 * state and mutates them optimistically so reply / hide / delete all feel real
 * in the demo. The selected scenario (from MockScenarioProvider) decides
 * whether accounts/conversations are present.
 */
import { useCallback, useEffect, useState } from "react";

import {
    ConnectedInboxAccount,
    InboxConversation,
    InboxMessage,
    UseInboxResult,
} from "../types";
import { useMockScenario } from "./mock-scenario-context";
import { buildMockConversations, MOCK_ACCOUNTS } from "./mock-data";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let replyCounter = 0;
const nextReplyId = () => `reply_${Date.now()}_${replyCounter++}`;

export function useInboxMock(): UseInboxResult {
    const { scenario } = useMockScenario();

    const [accounts, setAccounts] = useState<ConnectedInboxAccount[]>([]);
    const [conversations, setConversations] = useState<InboxConversation[]>([]);
    const [loading, setLoading] = useState(true);

    // Reseed whenever the demo scenario changes.
    useEffect(() => {
        setLoading(true);
        const t = setTimeout(() => {
            if (scenario === "no-socials") {
                setAccounts([]);
                setConversations([]);
            } else if (scenario === "no-messages") {
                setAccounts(MOCK_ACCOUNTS);
                setConversations([]);
            } else {
                setAccounts(MOCK_ACCOUNTS);
                setConversations(buildMockConversations());
            }
            setLoading(false);
        }, 250);
        return () => clearTimeout(t);
    }, [scenario]);

    const sendReply = useCallback(
        async (conversationId: string, text: string) => {
            const reply: InboxMessage = {
                id: nextReplyId(),
                author: "business",
                text,
                sentAt: Date.now(),
                pending: true,
            };
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
                            ? {
                                  ...c.comment,
                                  replies: [...c.comment.replies, reply],
                              }
                            : c.comment,
                        lastActivityAt: reply.sentAt,
                        unread: false,
                    };
                })
            );
            await wait(500);
            // Clear the pending flag once "sent".
            setConversations((prev) =>
                prev.map((c) => {
                    if (c.id !== conversationId) return c;
                    if (c.kind === "dm") {
                        return {
                            ...c,
                            messages: (c.messages ?? []).map((m) =>
                                m.id === reply.id ? { ...m, pending: false } : m
                            ),
                        };
                    }
                    return {
                        ...c,
                        comment: c.comment
                            ? {
                                  ...c.comment,
                                  replies: c.comment.replies.map((m) =>
                                      m.id === reply.id
                                          ? { ...m, pending: false }
                                          : m
                                  ),
                              }
                            : c.comment,
                    };
                })
            );
        },
        []
    );

    const setCommentHidden = useCallback(
        async (conversationId: string, hidden: boolean) => {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === conversationId && c.comment
                        ? { ...c, comment: { ...c.comment, hidden } }
                        : c
                )
            );
            await wait(300);
        },
        []
    );

    const deleteComment = useCallback(async (conversationId: string) => {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        await wait(300);
    }, []);

    const markRead = useCallback(async (conversationId: string) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === conversationId ? { ...c, unread: false } : c
            )
        );
    }, []);

    return {
        loading,
        connectedAccounts: accounts,
        conversations,
        sendReply,
        setCommentHidden,
        deleteComment,
        markRead,
    };
}
