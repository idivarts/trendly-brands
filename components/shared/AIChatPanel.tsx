import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import { AIModule, useAIChat } from "@/hooks/use-ai-chat";
import { useAIModels } from "@/hooks/use-ai-models";
import Colors from "@/shared-uis/constants/Colors";
import {
    faChevronLeft,
    faChevronRight,
    faClockRotateLeft,
    faPaperPlane,
    faPenToSquare,
    faPlus,
    faRobot,
    faTrash,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ─── Public types (kept for backward compatibility with existing screens) ─────

export interface ChatMessage {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp: number;
}

export interface FocusItem {
    id: string;
    label: string;
}

interface AIChatPanelProps {
    /** Which AI module backs this panel — drives system prompt + history filter. */
    module: AIModule;
    /** Optional context inside the module (e.g. strategyId, contentId). */
    contextId?: string;

    /**
     * If provided, the panel sends this as the first message on mount (or when
     * the message string changes). Used by screens with an empty → chat
     * onboarding step. Parent should clear it after observing send.
     */
    initialMessage?: string;
    /** Notified after `initialMessage` has been dispatched. */
    onInitialMessageSent?: () => void;

    /** Selection chips lifted from the editor. Same shape as before. */
    focusItems?: FocusItem[];
    onRemoveFocusItem?: (id: string) => void;

    /** Layout */
    isCompact?: boolean;
    placeholder?: string;

    /** Optional welcome line shown when there is no message history yet. */
    welcomeText?: string;

    /** Called when the user taps the collapse chevron. */
    onCollapse?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Pure presentation + thread management combined.
 *
 * Per the design critique:
 *  - Header stays at 3 elements: collapse chevron · title · history icon.
 *  - "New chat" lives INSIDE the conversations view (not its own header icon).
 *  - Model chip sits in the row above the input — user knows which model will
 *    answer before sending.
 *  - Conversations view is an in-panel mode swap (no extra Modal layer).
 */
const AIChatPanel: React.FC<AIChatPanelProps> = ({
    module,
    contextId,
    initialMessage,
    onInitialMessageSent,
    focusItems = [],
    onRemoveFocusItem,
    isCompact = false,
    placeholder = "Ask the AI Expert...",
    welcomeText,
    onCollapse,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors, isCompact), [colors, isCompact]);

    // ── Real AI thread state ─────────────────────────────────────────────────
    const {
        threads,
        activeThreadId,
        messages: aiMessages,
        streamingContent,
        isStreaming,
        sendMessage,
        loadThread,
        createThread,
        renameThread,
        deleteThread,
        refreshThreads,
    } = useAIChat({ module, contextId });

    const { models, selectedModel, setSelectedModel } = useAIModels();

    // Mode toggle: chat (default) vs history list.
    const [viewMode, setViewMode] = useState<"chat" | "history">("chat");

    // Auto-send any queued initial message exactly once.
    const sentInitialRef = useRef<string | null>(null);
    useEffect(() => {
        if (!initialMessage) return;
        if (sentInitialRef.current === initialMessage) return;
        sentInitialRef.current = initialMessage;
        sendMessage(initialMessage, undefined, selectedModel);
        onInitialMessageSent?.();
    }, [initialMessage, sendMessage, selectedModel, onInitialMessageSent]);

    // ── Compose state ────────────────────────────────────────────────────────
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList>(null);

    // ── Adapt AIMessage[] (+ live stream) to ChatMessage[] for rendering ────
    const messages: ChatMessage[] = useMemo(() => {
        const out: ChatMessage[] = aiMessages.map((m, i) => ({
            id: `m-${m.timestamp}-${i}`,
            sender: m.role === "user" ? "user" : "ai",
            text: m.content,
            timestamp: m.timestamp,
        }));
        if (isStreaming && streamingContent) {
            out.push({
                id: "streaming",
                sender: "ai",
                text: streamingContent,
                timestamp: Date.now(),
            });
        }
        if (out.length === 0 && welcomeText) {
            return [
                { id: "welcome", sender: "ai", text: welcomeText, timestamp: Date.now() },
            ];
        }
        return out;
    }, [aiMessages, isStreaming, streamingContent, welcomeText]);

    const isAITyping = isStreaming && !streamingContent;

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages.length]);

    // ── Send handler ─────────────────────────────────────────────────────────
    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;
        const focusedText =
            focusItems.length > 0 ? focusItems.map((f) => f.label).join("\n") : undefined;
        sendMessage(trimmed, focusedText, selectedModel);
        setInput("");
        focusItems.forEach((f) => onRemoveFocusItem?.(f.id));
    };

    // ── History view helpers ─────────────────────────────────────────────────
    const [searchQ, setSearchQ] = useState("");
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameText, setRenameText] = useState("");

    useEffect(() => {
        if (viewMode === "history") refreshThreads();
    }, [viewMode, refreshThreads]);

    const filteredThreads = useMemo(() => {
        const q = searchQ.trim().toLowerCase();
        if (!q) return threads;
        return threads.filter((t) => (t.title ?? "").toLowerCase().includes(q));
    }, [threads, searchQ]);

    const onPickThread = (id: string) => {
        loadThread(id);
        setViewMode("chat");
    };

    const onNewChat = async () => {
        await createThread();
        setViewMode("chat");
    };

    // ── Render helpers ───────────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isAI = item.sender === "ai";
        return (
            <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
                {isAI && (
                    <View style={styles.avatarContainer}>
                        <FontAwesomeIcon icon={faRobot} size={14} color={colors.onPrimary} />
                    </View>
                )}
                <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                    <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* ── Header — capped at 3 elements (per design critique) ───── */}
            <View style={styles.panelHeader}>
                {onCollapse && (
                    <Pressable
                        onPress={onCollapse}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Collapse panel"
                        hitSlop={6}
                    >
                        <FontAwesomeIcon icon={faChevronRight} size={11} color={colors.textSecondary} />
                    </Pressable>
                )}
                <Text style={styles.panelHeaderLabel} numberOfLines={1}>
                    {viewMode === "history" ? "Chat history" : "AI Content Expert"}
                </Text>
                {viewMode === "chat" ? (
                    <Pressable
                        onPress={() => setViewMode("history")}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Open past conversations"
                        hitSlop={6}
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} size={14} color={colors.text} />
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() => setViewMode("chat")}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Back to chat"
                        hitSlop={6}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} size={12} color={colors.text} />
                    </Pressable>
                )}
            </View>

            {viewMode === "history" ? (
                // ── Conversations view ───────────────────────────────────────
                <View style={styles.historyWrap}>
                    <Pressable
                        style={({ pressed }) => [styles.newChatBtn, pressed && styles.sendBtnPressed]}
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
                                                    if (next && next !== t.title) renameThread(t.id, next);
                                                    setRenameId(null);
                                                }}
                                                onSubmitEditing={() => {
                                                    const next = renameText.trim();
                                                    if (next && next !== t.title) renameThread(t.id, next);
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
                                                style={({ pressed }) => [styles.threadActionBtn, pressed && styles.iconBtnPressed]}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPenToSquare}
                                                    size={11}
                                                    color={active ? colors.onPrimary : colors.textSecondary}
                                                />
                                            </Pressable>
                                            <Pressable
                                                hitSlop={6}
                                                onPress={() => deleteThread(t.id)}
                                                style={({ pressed }) => [styles.threadActionBtn, pressed && styles.iconBtnPressed]}
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
            ) : (
                // ── Chat view ────────────────────────────────────────────────
                <>
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                    />

                    {isAITyping && (
                        <View style={styles.typingRow}>
                            <View style={styles.avatarContainer}>
                                <FontAwesomeIcon icon={faRobot} size={14} color={colors.onPrimary} />
                            </View>
                            <View style={styles.typingBubble}>
                                <Text style={styles.typingText}>Thinking…</Text>
                            </View>
                        </View>
                    )}

                    {focusItems.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.focusBar}
                            contentContainerStyle={styles.focusBarContent}
                        >
                            {focusItems.map((item) => (
                                <View key={item.id} style={styles.focusChip}>
                                    <View style={styles.focusChipAccent} />
                                    <Text style={styles.focusChipText} numberOfLines={1}>
                                        {item.label}
                                    </Text>
                                    {onRemoveFocusItem && (
                                        <Pressable
                                            onPress={() => onRemoveFocusItem(item.id)}
                                            style={styles.focusChipClose}
                                        >
                                            <FontAwesomeIcon icon={faXmark} size={10} color={colors.textSecondary} />
                                        </Pressable>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Model strip — sits right above the input */}
                    <View style={styles.modelStrip}>
                        <AIModelSelector
                            models={models}
                            selectedModel={selectedModel}
                            onSelect={setSelectedModel}
                            compact
                        />
                    </View>

                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor={colors.textSecondary}
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={1000}
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendBtn,
                                pressed && styles.sendBtnPressed,
                                (!input.trim() || isStreaming) && styles.sendBtnDisabled,
                            ]}
                            onPress={handleSend}
                            disabled={!input.trim() || isStreaming}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} size={16} color={colors.onPrimary} />
                        </Pressable>
                    </View>
                </>
            )}
        </KeyboardAvoidingView>
    );
};

export default AIChatPanel;

function useStyles(colors: ReturnType<typeof Colors>, isCompact: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.card },
                panelHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: isCompact ? 8 : 12,
                    paddingVertical: 10,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                    zIndex: 1,
                },
                iconBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                },
                iconBtnPressed: { backgroundColor: colors.tag },
                panelHeaderLabel: {
                    flex: 1,
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                },
                // ── Message list ─────────────────────────────────────────────
                messageList: {
                    padding: isCompact ? 12 : 16,
                    gap: 12,
                    flexGrow: 1,
                    justifyContent: "flex-end",
                },
                messageRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                },
                aiRow: { justifyContent: "flex-start" },
                userRow: { justifyContent: "flex-end" },
                avatarContainer: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                },
                bubble: {
                    maxWidth: "80%",
                    borderRadius: 14,
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingVertical: isCompact ? 8 : 10,
                },
                aiBubble: {
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                userBubble: {
                    backgroundColor: colors.primary,
                    borderTopRightRadius: 4,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                bubbleText: { fontSize: isCompact ? 13 : 14, lineHeight: isCompact ? 19 : 21 },
                aiText: { color: colors.text },
                userText: { color: colors.onPrimary },
                typingRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                    paddingHorizontal: isCompact ? 12 : 16,
                    paddingBottom: 8,
                },
                typingBubble: {
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    borderTopLeftRadius: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                typingText: { fontSize: 13, color: colors.textSecondary, fontStyle: "italic" },
                // ── Focus chips ──────────────────────────────────────────────
                focusBar: { flexShrink: 0, maxHeight: 44, marginHorizontal: 12, marginBottom: 6 },
                focusBarContent: { gap: 8, alignItems: "center" },
                focusChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.aliceBlue,
                    borderRadius: 10,
                    overflow: "hidden",
                    maxWidth: 200,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                focusChipAccent: { width: 4, alignSelf: "stretch", backgroundColor: colors.primary },
                focusChipText: {
                    flex: 1,
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                },
                focusChipClose: { padding: 8 },
                // ── Model strip + input ──────────────────────────────────────
                modelStrip: {
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingBottom: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.card,
                },
                inputArea: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 10,
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingBottom: isCompact ? 10 : 14,
                    paddingTop: 6,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                },
                input: {
                    flex: 1,
                    minHeight: 40,
                    maxHeight: 120,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    color: colors.text,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    textAlignVertical: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                sendBtn: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                sendBtnPressed: { opacity: 0.75 },
                sendBtnDisabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
                // ── History view ─────────────────────────────────────────────
                historyWrap: { flex: 1, padding: 12, gap: 10 },
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
        [colors, isCompact]
    );
}
