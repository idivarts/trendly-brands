import { faComments, faImages } from "@fortawesome/free-solid-svg-icons";
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
import { InboxConversation, InboxFilter } from "./types";
import { matchesFilter, sortByRecency } from "./utils";

type InboxMode = "messages" | "media";

const LIST_WIDTH = 360;
const CONTACT_WIDTH = 320;

const InboxView: React.FC = () => {
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
    } = useInbox();

    const [mode, setMode] = useState<InboxMode>("messages");
    const [filter, setFilter] = useState<InboxFilter>("all");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [showDetails, setShowDetails] = useState(false);

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
                        <ContactPanel conversation={selected} />
                    </View>
                ) : null}
            </View>
        );
    }

    const tabs: { key: InboxMode; label: string; icon: typeof faComments }[] = [
        { key: "messages", label: "Messages", icon: faComments },
        { key: "media", label: "Media", icon: faImages },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.modeBar}>
                {tabs.map((t) => {
                    const active = mode === t.key;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => setMode(t.key)}
                            style={[styles.modeTab, active && styles.modeTabActive]}
                        >
                            <FontAwesomeIcon
                                icon={t.icon}
                                size={15}
                                color={active ? colors.onPrimary : colors.textSecondary}
                            />
                            <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
                                {t.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            <View style={styles.body}>
                {mode === "media" ? <MediaView /> : messagesBody}
            </View>
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
                modeBar: {
                    flexDirection: "row",
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: colors.background,
                    // Sticky-header shadow downward over the body (no border).
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 3,
                    zIndex: 3,
                },
                modeTab: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                },
                modeTabActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                modeTabText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                modeTabTextActive: {
                    color: colors.onPrimary,
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
            }),
        [colors]
    );
}

export default InboxView;
