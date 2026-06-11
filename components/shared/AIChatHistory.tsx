import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faPenToSquare, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface AIChatHistoryThread {
    id: string;
    title: string;
    updatedAt: number;
}

interface AIChatHistoryProps {
    threads: AIChatHistoryThread[];
    activeThreadId?: string | null;
    onPickThread: (id: string) => void;
    onNewChat: () => void;
    onRenameThread: (id: string, title: string) => void;
    onDeleteThread: (id: string) => void;
}

function timeAgo(epoch: number): string {
    const s = Math.max(1, Math.floor((Date.now() - epoch) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

const AIChatHistory: React.FC<AIChatHistoryProps> = ({
    threads,
    activeThreadId,
    onPickThread,
    onNewChat,
    onRenameThread,
    onDeleteThread,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const safeBottom = xl ? 0 : insets.bottom;
    const styles = useMemo(
        () => useStyles(colors, safeBottom),
        [colors, safeBottom]
    );

    const [searchQ, setSearchQ] = useState("");
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameText, setRenameText] = useState("");

    const filteredThreads = useMemo(() => {
        const q = searchQ.trim().toLowerCase();
        if (!q) return threads;
        return threads.filter((t) => (t.title ?? "").toLowerCase().includes(q));
    }, [threads, searchQ]);

    return (
        <View style={styles.historyWrap}>
            <Pressable
                style={({ pressed }) => [styles.newChatBtn, pressed && styles.newChatBtnPressed]}
                onPress={onNewChat}
            >
                <FontAwesomeIcon icon={faPlus} size={12} color={colors.onPrimary} />
                <Text style={styles.newChatText}>New chat</Text>
            </Pressable>

            <TextInput
                style={styles.searchInput}
                value={searchQ}
                onChangeText={setSearchQ}
                placeholder="Search chats…"
                placeholderTextColor={colors.textSecondary}
            />

            <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
                {filteredThreads.length === 0 ? (
                    <Text style={styles.historyEmpty}>No conversations yet.</Text>
                ) : (
                    filteredThreads.map((t) => {
                        const active = t.id === activeThreadId;
                        const renaming = renameId === t.id;
                        return (
                            <View
                                key={t.id}
                                style={[styles.threadRow, active && styles.threadRowActive]}
                            >
                                {renaming ? (
                                    <TextInput
                                        style={styles.renameInput}
                                        value={renameText}
                                        onChangeText={setRenameText}
                                        autoFocus
                                        onBlur={() => {
                                            const next = renameText.trim();
                                            if (next && next !== t.title) onRenameThread(t.id, next);
                                            setRenameId(null);
                                        }}
                                        onSubmitEditing={() => {
                                            const next = renameText.trim();
                                            if (next && next !== t.title) onRenameThread(t.id, next);
                                            setRenameId(null);
                                        }}
                                    />
                                ) : (
                                    <Pressable
                                        style={styles.threadPress}
                                        onPress={() => onPickThread(t.id)}
                                    >
                                        <Text
                                            style={[styles.threadTitle, active && styles.threadTitleActive]}
                                            numberOfLines={1}
                                        >
                                            {t.title || "Untitled"}
                                        </Text>
                                        <Text
                                            style={[styles.threadMeta, active && styles.threadMetaActive]}
                                        >
                                            {timeAgo(t.updatedAt)}
                                        </Text>
                                    </Pressable>
                                )}
                                <View style={styles.threadActions}>
                                    <Pressable
                                        hitSlop={6}
                                        onPress={() => {
                                            setRenameId(t.id);
                                            setRenameText(t.title);
                                        }}
                                        style={({ pressed }) => [styles.threadActionBtn, pressed && styles.threadActionBtnPressed]}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPenToSquare}
                                            size={11}
                                            color={active ? colors.onPrimary : colors.textSecondary}
                                        />
                                    </Pressable>
                                    <Pressable
                                        hitSlop={6}
                                        onPress={() => onDeleteThread(t.id)}
                                        style={({ pressed }) => [styles.threadActionBtn, pressed && styles.threadActionBtnPressed]}
                                    >
                                        <FontAwesomeIcon
                                            icon={faTrash}
                                            size={11}
                                            color={active ? colors.onPrimary : colors.textSecondary}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
};

export default AIChatHistory;

function useStyles(colors: ReturnType<typeof Colors>, safeBottom: number) {
    return useMemo(
        () =>
            StyleSheet.create({
                historyWrap: { flex: 1, padding: 12, paddingBottom: 12 + safeBottom, gap: 10 },
                newChatBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 10,
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                    shadowOpacity: 0.3,
                    elevation: 4,
                },
                newChatBtnPressed: { opacity: 0.75 },
                newChatText: { color: colors.onPrimary, fontWeight: "700", fontSize: 13 },
                searchInput: {
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.tag,
                    color: colors.text,
                    borderRadius: 10,
                    fontSize: 13,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                historyList: { flex: 1 },
                historyListContent: { gap: 4, paddingBottom: 8 },
                historyEmpty: {
                    color: colors.textSecondary,
                    fontSize: 12,
                    textAlign: "center",
                    paddingVertical: 20,
                },
                threadRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    gap: 6,
                },
                threadRowActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                threadPress: { flex: 1 },
                threadTitle: { color: colors.text, fontSize: 13, fontWeight: "600" },
                threadTitleActive: { color: colors.onPrimary },
                threadMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
                threadMetaActive: { color: colors.onPrimary, opacity: 0.8 },
                threadActions: { flexDirection: "row", gap: 2 },
                threadActionBtn: {
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    alignItems: "center",
                    justifyContent: "center",
                },
                threadActionBtnPressed: { backgroundColor: colors.tag },
                renameInput: {
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    backgroundColor: colors.tag,
                    color: colors.text,
                    borderRadius: 6,
                    fontSize: 13,
                },
            }),
        [colors, safeBottom]
    );
}
