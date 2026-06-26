import {
    faComment,
    faEnvelope,
    faEyeSlash,
    faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import ChannelAvatar from "./ChannelAvatar";
import ResyncButton from "./ResyncButton";
import { conversationUnreadCount, InboxConversation, InboxFilter } from "./types";
import { relativeTime } from "./utils";

// Keep the pull-to-refresh spinner visible briefly so a quick (202) trigger still
// reads as a deliberate refresh, even when nothing new comes back.
const MIN_REFRESH_MS = 900;

const FILTERS: { key: InboxFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "dm", label: "DMs" },
    { key: "comment", label: "Comments" },
];

interface Props {
    conversations: InboxConversation[];
    selectedId?: string;
    filter: InboxFilter;
    onFilterChange: (f: InboxFilter) => void;
    search: string;
    onSearchChange: (s: string) => void;
    onSelect: (c: InboxConversation) => void;
    unreadTotal: number;
    /** Look for new conversations/messages (pull-to-refresh + desktop button). */
    onRefresh: () => Promise<void>;
}

const ConversationList: React.FC<Props> = ({
    conversations,
    selectedId,
    filter,
    onFilterChange,
    search,
    onSearchChange,
    onSelect,
    unreadTotal,
    onRefresh,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        await Promise.all([
            onRefresh().catch(() => {}),
            new Promise((r) => setTimeout(r, MIN_REFRESH_MS)),
        ]);
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            {/* Search (+ desktop refresh button — touch uses pull-to-refresh) */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        size={14}
                        color={colors.textSecondary}
                    />
                    <TextInput
                        value={search}
                        onChangeText={onSearchChange}
                        placeholder="Search messages"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.searchInput}
                    />
                </View>
                {/* Web (any width) gets a button; native uses pull-to-refresh. */}
                {Platform.OS === "web" ? (
                    <ResyncButton onPress={handleRefresh} busy={refreshing} label="Refresh inbox" />
                ) : null}
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => {
                    const active = f.key === filter;
                    return (
                        <Pressable
                            key={f.key}
                            onPress={() => onFilterChange(f.key)}
                            style={[
                                styles.filterChip,
                                active && { backgroundColor: colors.primary },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: active ? colors.onPrimary : colors.textSecondary },
                                ]}
                            >
                                {f.label}
                            </Text>
                            {f.key === "unread" && unreadTotal > 0 ? (
                                <View
                                    style={[
                                        styles.filterCount,
                                        { backgroundColor: active ? colors.onPrimary : colors.primary },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterCountText,
                                            { color: active ? colors.primary : colors.onPrimary },
                                        ]}
                                    >
                                        {unreadTotal}
                                    </Text>
                                </View>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>

            {/* List */}
            <FlatList
                data={conversations}
                keyExtractor={(c) => c.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.noResults}>
                        <Text style={styles.noResultsText}>
                            No conversations match this filter.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const active = item.id === selectedId && xl;
                    const isComment = item.kind === "comment";
                    const newCount = conversationUnreadCount(item);
                    return (
                        <Pressable
                            onPress={() => onSelect(item)}
                            style={[
                                styles.row,
                                active && { backgroundColor: colors.primary },
                            ]}
                        >
                            <ChannelAvatar
                                avatarUrl={item.participant.avatarUrl}
                                channel={item.channel}
                                size={46}
                                name={item.participant.name}
                                handle={item.participant.handle}
                            />
                            <View style={styles.rowBody}>
                                <View style={styles.rowTop}>
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.name,
                                            { color: active ? colors.onPrimary : colors.text },
                                        ]}
                                    >
                                        {item.participant.name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.time,
                                            { color: active ? colors.onPrimary : colors.textSecondary },
                                        ]}
                                    >
                                        {relativeTime(item.lastActivityAt)}
                                    </Text>
                                </View>
                                <View style={styles.rowBottom}>
                                    <FontAwesomeIcon
                                        icon={isComment ? faComment : faEnvelope}
                                        size={11}
                                        color={active ? colors.onPrimary : colors.textSecondary}
                                    />
                                    {item.kind === "comment" && item.comment?.hidden ? (
                                        <FontAwesomeIcon
                                            icon={faEyeSlash}
                                            size={11}
                                            color={active ? colors.onPrimary : colors.textSecondary}
                                        />
                                    ) : null}
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.preview,
                                            {
                                                color: active
                                                    ? colors.onPrimary
                                                    : newCount > 0
                                                    ? colors.text
                                                    : colors.textSecondary,
                                                fontWeight: newCount > 0 ? "600" : "400",
                                            },
                                        ]}
                                    >
                                        {item.preview}
                                    </Text>
                                </View>
                            </View>
                            {newCount > 0 && !active ? (
                                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.countBadgeText, { color: colors.onPrimary }]}>
                                        {newCount > 99 ? "99+" : newCount}
                                    </Text>
                                </View>
                            ) : null}
                        </Pressable>
                    );
                }}
            />
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
                searchRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginHorizontal: 12,
                    marginTop: 12,
                },
                searchBox: {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 12,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                searchInput: {
                    flex: 1,
                    fontSize: 14,
                    color: colors.text,
                    paddingVertical: 0,
                    ...(typeof document !== "undefined" ? { outlineStyle: "none" as any } : {}),
                },
                filterRow: {
                    flexDirection: "row",
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                },
                filterChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.tag,
                    justifyContent: "center",
                },
                filterText: {
                    fontSize: 13,
                    fontWeight: "600",
                },
                filterCount: {
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    paddingHorizontal: 5,
                    alignItems: "center",
                    justifyContent: "center",
                },
                filterCountText: {
                    fontSize: 11,
                    fontWeight: "700",
                },
                listContent: {
                    paddingHorizontal: 8,
                    paddingBottom: 24,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                },
                rowBody: {
                    flex: 1,
                    minWidth: 0,
                },
                rowTop: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                },
                name: {
                    fontSize: 15,
                    fontWeight: "700",
                    flexShrink: 1,
                },
                time: {
                    fontSize: 12,
                    flexShrink: 0,
                },
                rowBottom: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3,
                },
                preview: {
                    fontSize: 13,
                    flexShrink: 1,
                },
                countBadge: {
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    paddingHorizontal: 5,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                },
                countBadgeText: {
                    fontSize: 11,
                    fontWeight: "700",
                },
                noResults: {
                    paddingTop: 48,
                    alignItems: "center",
                },
                noResultsText: {
                    fontSize: 14,
                    color: colors.textSecondary,
                },
            }),
        [colors]
    );
}

export default ConversationList;
