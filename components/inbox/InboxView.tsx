import { faArrowsRotate, faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";

import ContactPanel from "./ContactPanel";
import ConversationList from "./ConversationList";
import EmptyNoMessages from "./EmptyNoMessages";
import EmptyNoSocials from "./EmptyNoSocials";
import MediaView from "./MediaView";
import ThreadView from "./ThreadView";
import { useInbox } from "./data/use-inbox";
import { InboxConversation, InboxFilter, InboxMode } from "./types";
import { matchesFilter, sortByRecency } from "./utils";

interface InboxViewProps {
    /** Active section, controlled by the page-header toggle. */
    mode: InboxMode;
}

const LIST_WIDTH = 360;
const CONTACT_WIDTH = 320;

const InboxView: React.FC<InboxViewProps> = ({ mode }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    const {
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
    } = useInbox();

    const [filter, setFilter] = useState<InboxFilter>("all");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [showDetails, setShowDetails] = useState(false);
    const [resyncing, setResyncing] = useState(false);

    const handleResync = async () => {
        if (resyncing) return;
        setResyncing(true);
        setSelectedId(undefined);
        try {
            await resyncInbox();
        } finally {
            setResyncing(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return conversations
            .filter((c) => matchesFilter(c, filter))
            .filter(
                (c) =>
                    !q ||
                    c.participant.name.toLowerCase().includes(q) ||
                    c.preview.toLowerCase().includes(q)
            )
            .sort(sortByRecency);
    }, [conversations, filter, search]);

    const unreadTotal = useMemo(
        () => conversations.filter((c) => c.unread).length,
        [conversations]
    );

    const selected: InboxConversation | undefined = useMemo(
        () => conversations.find((c) => c.id === selectedId),
        [conversations, selectedId]
    );

    // On desktop, keep a conversation selected by default.
    useEffect(() => {
        if (xl && !selected && filtered.length > 0) {
            setSelectedId(filtered[0].id);
        }
    }, [xl, selected, filtered]);

    const handleSelect = (c: InboxConversation) => {
        setSelectedId(c.id);
        setShowDetails(false);
        if (c.unread) markRead(c.id);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (connectedAccounts.length === 0) {
        return <EmptyNoSocials />;
    }

    const list = (
        <ConversationList
            conversations={filtered}
            selectedId={selectedId}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
            unreadTotal={unreadTotal}
            onRefresh={refreshInbox}
        />
    );

    const thread = selected ? (
        <ThreadView
            key={selected.id}
            conversation={selected}
            showBack={!xl}
            onBack={() => setSelectedId(undefined)}
            showDetailsToggle={!xl}
            onToggleDetails={() => setShowDetails((v) => !v)}
            onSendReply={(text) => sendReply(selected.id, text)}
            onSetHidden={(hidden) => setCommentHidden(selected.id, hidden)}
            onDelete={async () => {
                await deleteComment(selected.id);
                setSelectedId(undefined);
            }}
            onResyncThread={() => resyncThread(selected.id)}
            onResyncProfile={() => resyncProfile(selected.id)}
            onResyncMessage={(msgId) => resyncMessage(selected.id, msgId)}
        />
    ) : null;

    // ---- Messages body (conversations: DMs + comment threads) ----
    let messagesBody: React.ReactNode;
    if (!xl) {
        if (selected) {
            messagesBody = (
                <View style={styles.container}>
                    {thread}
                    {showDetails ? (
                        <View style={styles.mobileDetails}>
                            <ContactPanel
                                conversation={selected}
                                onClose={() => setShowDetails(false)}
                                onResyncProfile={() => resyncProfile(selected.id)}
                            />
                        </View>
                    ) : null}
                </View>
            );
        } else if (conversations.length === 0) {
            messagesBody = <EmptyNoMessages accounts={connectedAccounts} />;
        } else {
            messagesBody = <View style={styles.container}>{list}</View>;
        }
    } else {
        messagesBody = (
            <View style={styles.row}>
                <View style={[styles.listPane, { width: LIST_WIDTH }]}>{list}</View>
                <View style={styles.threadPane}>
                    {conversations.length === 0 ? (
                        <EmptyNoMessages accounts={connectedAccounts} />
                    ) : selected ? (
                        thread
                    ) : (
                        <View style={styles.center}>
                            <FontAwesomeIcon icon={faComments} size={40} color={colors.tag} />
                            <Text style={styles.placeholder}>
                                Select a conversation to get started
                            </Text>
                        </View>
                    )}
                </View>
                {selected ? (
                    <View style={[styles.contactPane, { width: CONTACT_WIDTH }]}>
                        <ContactPanel
                            conversation={selected}
                            onResyncProfile={() => resyncProfile(selected.id)}
                        />
                    </View>
                ) : null}
            </View>
        );
    }

    return (
        <View style={styles.body}>
            {mode === "media" ? <MediaView /> : messagesBody}
            {__DEV__ ? (
                <Pressable
                    onPress={handleResync}
                    disabled={resyncing}
                    style={styles.devResyncButton}
                    accessibilityLabel="Resync inbox (dev only)"
                >
                    {resyncing ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <FontAwesomeIcon
                            icon={faArrowsRotate}
                            size={16}
                            color={colors.white}
                        />
                    )}
                    <Text style={styles.devResyncLabel}>
                        {resyncing ? "Resyncing…" : "DEV: Resync"}
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                body: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                row: {
                    flex: 1,
                    flexDirection: "row",
                    backgroundColor: colors.background,
                },
                listPane: {
                    backgroundColor: colors.background,
                    // Cast a shadow rightward onto the thread pane (no border).
                    shadowColor: "#000",
                    shadowOffset: { width: 6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.06,
                    elevation: 8,
                    zIndex: 2,
                },
                threadPane: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                contactPane: {
                    backgroundColor: colors.background,
                    // Cast a shadow leftward onto the thread pane.
                    shadowColor: "#000",
                    shadowOffset: { width: -6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.06,
                    elevation: 8,
                    zIndex: 2,
                },
                mobileDetails: {
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: colors.background,
                    zIndex: 10,
                },
                center: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    padding: 24,
                },
                placeholder: {
                    fontSize: 15,
                    color: colors.textSecondary,
                },
                devResyncButton: {
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 24,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                    zIndex: 20,
                },
                devResyncLabel: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.white,
                },
            }),
        [colors]
    );
}

export default InboxView;
