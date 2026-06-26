/**
 * Inbox unread badge source.
 *
 * Streams the brand's inbox (`brands/{brandId}/inbox`) and exposes the number of
 * conversations that have new inbound activity (conversationUnreadCount > 0).
 * Mounted once above the drawer + tabs so both the web drawer menu item and the
 * mobile tab bar can show a cumulative badge without each running its own
 * listener. The per-conversation bubble inside the inbox screen is computed
 * separately from the inbox screen's own listener.
 */
import { collection, onSnapshot } from "firebase/firestore";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    conversationUnreadCount,
    InboxConversation,
} from "@/components/inbox/types";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";

interface InboxUnreadValue {
    /** Number of conversations with at least one new inbound item. */
    unreadConversations: number;
}

const InboxUnreadContext = createContext<InboxUnreadValue>({
    unreadConversations: 0,
});

export const InboxUnreadProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const [unreadConversations, setUnreadConversations] = useState(0);

    useEffect(() => {
        if (!brandId) {
            setUnreadConversations(0);
            return;
        }
        const unsub = onSnapshot(
            collection(FirestoreDB, "brands", brandId, "inbox"),
            (snap) => {
                let n = 0;
                for (const d of snap.docs) {
                    if (conversationUnreadCount(d.data() as InboxConversation) > 0) {
                        n += 1;
                    }
                }
                setUnreadConversations(n);
            },
            (e) => {
                console.warn("inbox-unread: snapshot failed", e);
            }
        );
        return unsub;
    }, [brandId]);

    const value = useMemo(
        () => ({ unreadConversations }),
        [unreadConversations]
    );

    return (
        <InboxUnreadContext.Provider value={value}>
            {children}
        </InboxUnreadContext.Provider>
    );
};

export const useInboxUnread = () => useContext(InboxUnreadContext);
