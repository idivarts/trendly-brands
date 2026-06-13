import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import AIAnswerControl from "@/components/shared/AIAnswerControl";
import AIChatHistory from "@/components/shared/AIChatHistory";
import MarkdownMessage from "@/components/shared/MarkdownMessage";
import { TokenMeterBar, TokenMeterBlock, TokenMeterNotice } from "@/components/billing/TokenMeter";
import { AIControl, AIModule, useAIChat } from "@/hooks/use-ai-chat";
import { useAIModels } from "@/hooks/use-ai-models";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import {
    faChevronLeft,
    faChevronRight,
    faClockRotateLeft,
    faLock,
    faPaperPlane,
    faPenToSquare,
    faRobot,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Public types (kept for backward compatibility with existing screens) ─────

export interface ChatMessage {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp: number;
    control?: AIControl;
}

export interface FocusItem {
    id: string;
    label: string;
    /**
     * Optional text sent to the AI in place of `label`. Use it to give the model
     * the actionable identity of the focused thing (e.g. a content id) while the
     * chip still shows a short human label. Falls back to `label` when unset.
     */
    contextText?: string;
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

    /**
     * Read-only mode. History stays fully visible and scrollable, but the
     * composer, model selector and focus chips are removed — no new activity
     * can be started. Used when the backing strategy is finalized (locked).
     */
    readOnly?: boolean;

    /** Layout */
    isCompact?: boolean;
    placeholder?: string;

    /** Optional welcome line shown when there is no message history yet. */
    welcomeText?: string;

    /** Called when the user taps the collapse chevron. */
    onCollapse?: () => void;

    /**
     * Fired when the backend signals onboarding is complete. Used by the
     * onboarding screen to finalize the brand and navigate onward.
     */
    onOnboardingComplete?: () => void;

    /**
     * Hide the panel's own header (title + history/new-chat). Used when the host
     * screen provides its own header (e.g. onboarding) and a single thread.
     */
    hideHeader?: boolean;

    /**
     * Vertical alignment of the message list. "bottom" (default) anchors to the
     * input like a side-panel chat; "top" flows messages downward like a guided
     * wizard — better for a full-page onboarding flow with few messages.
     */
    messageAlign?: "top" | "bottom";

    /**
     * Set when the host already insets for the notch/home-indicator (e.g. it
     * sits inside an `AppLayout` whose `safeAreaEdges` include `top`/`bottom`).
     * The panel then skips its own safe-area padding so the inset isn't applied
     * twice — otherwise the header/input gain a doubled top/bottom gap on
     * native. Defaults to false (panel self-insets, for edge-to-edge mounts).
     */
    parentHandlesSafeArea?: boolean;
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
    readOnly = false,
    isCompact = false,
    placeholder = "Ask the AI Expert...",
    welcomeText,
    onCollapse,
    onOnboardingComplete,
    hideHeader = false,
    messageAlign = "bottom",
    parentHandlesSafeArea = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const insets = useSafeAreaInsets();
    // On mobile (!xl) the panel mounts edge-to-edge (full-screen chat or the
    // floating sheet), so it must inset for the notch/home-indicator itself.
    // On desktop the surrounding AppLayout already handles safe area — as does
    // any host that opts in via `parentHandlesSafeArea` (e.g. a screen whose
    // AppLayout already insets top/bottom), which would otherwise double up.
    const selfInset = !xl && !parentHandlesSafeArea;
    const safeTop = selfInset ? insets.top : 0;
    const rawSafeBottom = selfInset ? insets.bottom : 0;

    // While the keyboard is open it already covers the home-indicator area, so
    // the composer's own bottom safe-area inset would just float the input above
    // the keyboard — a visible double-padded gap. Collapse the inset whenever the
    // keyboard is up; restore it when hidden so the composer still clears the
    // home indicator. (Driven by keyboardWill* on iOS / keyboardDid* on Android
    // to stay in sync with the KeyboardAvoidingView animation.)
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        if (Platform.OS === "web") return;
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);
    const safeBottom = keyboardVisible ? 0 : rawSafeBottom;
    const styles = useStyles(colors, isCompact, safeTop, safeBottom, messageAlign);

    // KeyboardAvoidingView's `padding` math is `frame.y + frame.height - keyboardY`,
    // where `frame.y` is the view's PARENT-relative offset but `keyboardY` is in
    // screen space. So whenever a parent pushes this panel down (e.g. the host
    // AppLayout's top safe-area inset on the full-screen strategy chat), the avoided
    // height comes up short by exactly that gap and the keyboard overlaps the
    // composer. `keyboardVerticalOffset` exists to compensate — we measure our own
    // on-screen Y and feed it back, which self-corrects in every mount context
    // (full-screen, floating sheet, split-pane) without hardcoding inset assumptions.
    // iOS-only: Android/web use `height` behaviour + system resize, which don't need it.
    const rootRef = useRef<View>(null);
    const [kbVerticalOffset, setKbVerticalOffset] = useState(0);
    const measureKbOffset = useCallback(() => {
        if (Platform.OS !== "ios") return;
        rootRef.current?.measureInWindow((_x, y) => {
            if (typeof y === "number" && Number.isFinite(y)) {
                setKbVerticalOffset((prev) => (Math.abs(prev - y) > 1 ? y : prev));
            }
        });
    }, []);

    // ── Real AI thread state ─────────────────────────────────────────────────
    const {
        threads,
        activeThreadId,
        messages: aiMessages,
        streamingContent,
        isStreaming,
        loading,
        initializing,
        hasMore,
        loadOlder,
        sendMessage,
        loadThread,
        createThread,
        renameThread,
        deleteThread,
        refreshThreads,
    } = useAIChat({
        module,
        contextId,
        autoOpenLatest: !initialMessage,
        onOnboardingComplete,
    });

    const { models, selectedModel, setSelectedModel } = useAIModels();

    // Org AI-token pressure. When exhausted, the composer is replaced by an
    // in-context block (Upgrade / Add top-up) — we do NOT navigate away.
    const { tokens } = useEntitlements();
    const tokensExhausted = !readOnly && tokens.state === "exhausted";

    // The conversation is still wiring up (resolving brand, fetching threads,
    // loading history). Show a loader and keep the composer disabled until ready.
    const notReady = initializing || loading;

    // Mode toggle: chat (default) vs history list.
    const [viewMode, setViewMode] = useState<"chat" | "history">("chat");

    // True from the moment a queued initial message is dispatched until its
    // content is on screen. sendMessage creates the thread over HTTP first, so
    // there's a ~1-2s window where the history subscription hasn't started yet
    // (notReady is already false) and the optimistic user bubble hasn't been
    // added — without this the panel would render an empty chat. Keeping the
    // loader up across this window is what avoids the "blank panel" on first open.
    const [startingConversation, setStartingConversation] = useState(false);

    // Auto-send any queued initial message exactly once — but only after the
    // conversation has finished initializing, so it lands cleanly in the thread.
    const sentInitialRef = useRef<string | null>(null);
    useEffect(() => {
        if (!initialMessage) return;
        if (readOnly) return; // locked strategy — never start a new turn
        if (tokensExhausted) return; // out of AI tokens — block shows instead
        if (notReady) return;
        if (sentInitialRef.current === initialMessage) return;
        sentInitialRef.current = initialMessage;
        setStartingConversation(true);
        sendMessage(initialMessage, undefined, selectedModel);
        onInitialMessageSent?.();
    }, [initialMessage, notReady, sendMessage, selectedModel, onInitialMessageSent]);

    // Drop the starting flag as soon as the conversation shows life — the first
    // message lands (optimistic bubble or committed history) or the assistant
    // starts streaming.
    useEffect(() => {
        if (startingConversation && (aiMessages.length > 0 || isStreaming)) {
            setStartingConversation(false);
        }
    }, [startingConversation, aiMessages.length, isStreaming]);

    // Render-time "still wiring up" flag. Covers three windows: the conversation
    // initializing/loading (notReady), the single frame between ready and the
    // dispatch effect firing (a queued initial message not yet sent), and the
    // HTTP thread-creation window (startingConversation).
    const initialPending =
        !!initialMessage && !readOnly && sentInitialRef.current !== initialMessage;
    const busy = notReady || initialPending || startingConversation;

    // ── Compose state ────────────────────────────────────────────────────────
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList>(null);

    // ── Adapt AIMessage[] (+ live stream) to ChatMessage[] for rendering ────
    const messages: ChatMessage[] = useMemo(() => {
        const out: ChatMessage[] = aiMessages.map((m, i) => ({
            // Key by the message's own identity (Firestore doc id, or the
            // optimistic clientMsgId) so a committed message and its transient
            // twin can never render under two different keys. Falls back to a
            // role+timestamp composite only when neither id exists.
            id: m.id ?? m.clientMsgId ?? `m-${m.role}-${m.timestamp}-${i}`,
            sender: m.role === "user" ? "user" : "ai",
            text: m.content,
            timestamp: m.timestamp,
            control: m.control,
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

    // Default chat is rendered into an inverted FlatList — newest item sits at
    // index 0 and lands at the visual bottom. That gives us "scroll lands at
    // the bottom on load" + "scrolling up loads older messages" for free, and
    // avoids the scroll-jump that prepending items to a non-inverted list
    // causes when `loadOlder` resolves.
    //
    // Wizard mode (`messageAlign === "top"`) intentionally keeps the
    // top-down flow — onboarding only has a handful of messages.
    const isInverted = messageAlign === "bottom";
    const renderedMessages = useMemo(
        () => (isInverted ? [...messages].reverse() : messages),
        [messages, isInverted]
    );

    // ── Send handler ─────────────────────────────────────────────────────────
    const handleSend = () => {
        const trimmed = input.trim();
        if (readOnly || tokensExhausted || !trimmed || isStreaming || busy) return;
        const focusedText =
            focusItems.length > 0
                ? focusItems.map((f) => f.contextText ?? f.label).join("\n")
                : undefined;
        sendMessage(trimmed, focusedText, selectedModel);
        setInput("");
        focusItems.forEach((f) => onRemoveFocusItem?.(f.id));
    };

    // ── History view helpers ─────────────────────────────────────────────────
    useEffect(() => {
        if (viewMode === "history") refreshThreads();
    }, [viewMode, refreshThreads]);

    const onPickThread = (id: string) => {
        loadThread(id);
        setViewMode("chat");
    };

    const onNewChat = async () => {
        await createThread();
        setViewMode("chat");
    };

    // Send a control's answer back through the normal chat path as a user turn.
    const handleControlSubmit = (text: string) => {
        if (!text.trim() || isStreaming) return;
        sendMessage(text, undefined, selectedModel);
    };

    // ── Render helpers ───────────────────────────────────────────────────────
    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isAI = item.sender === "ai";
        // An answer control is actionable only on the latest message — once the
        // user replies, a new message follows and the stale control disappears.
        // In inverted mode the latest message is at index 0; otherwise it's
        // the last item in the list.
        const isLatest = isInverted
            ? index === 0
            : index === renderedMessages.length - 1;
        const showControl = isAI && !!item.control && isLatest && !isStreaming && !readOnly;
        return (
            <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
                {isAI && (
                    <View style={styles.avatarContainer}>
                        <FontAwesomeIcon icon={faRobot} size={14} color={colors.onPrimary} />
                    </View>
                )}
                <View style={[styles.messageColumn, isAI ? styles.messageColumnAI : styles.messageColumnUser]}>
                    <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                        {isAI ? (
                            <MarkdownMessage content={item.text} compact={isCompact} />
                        ) : (
                            <Text style={[styles.bubbleText, styles.userText]}>
                                {item.text}
                            </Text>
                        )}
                    </View>
                    {showControl && item.control && (
                        <AIAnswerControl
                            control={item.control}
                            disabled={isStreaming}
                            onSubmit={handleControlSubmit}
                        />
                    )}
                </View>
            </View>
        );
    };

    return (
        <View ref={rootRef} style={styles.container} onLayout={measureKbOffset}>
        <KeyboardAvoidingView
            style={styles.fill}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={kbVerticalOffset}
        >
            {/* ── Header — capped at 3 elements (per design critique) ───── */}
            {!hideHeader && (
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
                    <>
                        <Pressable
                            onPress={() => setViewMode("history")}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Open past conversations"
                            hitSlop={6}
                        >
                            <FontAwesomeIcon icon={faClockRotateLeft} size={14} color={colors.text} />
                        </Pressable>
                        <Pressable
                            onPress={onNewChat}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Start a new chat"
                            hitSlop={6}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} size={14} color={colors.text} />
                        </Pressable>
                    </>
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
            )}

            {viewMode === "history" ? (
                <AIChatHistory
                    threads={threads}
                    activeThreadId={activeThreadId}
                    onPickThread={onPickThread}
                    onNewChat={onNewChat}
                    onRenameThread={renameThread}
                    onDeleteThread={deleteThread}
                />
            ) : (
                // ── Chat view ────────────────────────────────────────────────
                <>
                    {busy ? (
                        <View style={styles.initLoader}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={styles.initText}>Setting up your conversation…</Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={listRef}
                            data={renderedMessages}
                            inverted={isInverted}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={styles.messageList}
                            showsVerticalScrollIndicator={false}
                            // Inverted: visual "scroll up" = approaching the end of
                            // the data, so pagination hangs off onEndReached. The
                            // wizard (non-inverted) keeps its top-of-list trigger.
                            onEndReached={isInverted && hasMore ? loadOlder : undefined}
                            onEndReachedThreshold={0.2}
                            onStartReached={!isInverted && hasMore ? loadOlder : undefined}
                            onStartReachedThreshold={0.2}
                        />
                    )}

                    {!busy && isAITyping && (
                        <View style={styles.typingRow}>
                            <View style={styles.avatarContainer}>
                                <FontAwesomeIcon icon={faRobot} size={14} color={colors.onPrimary} />
                            </View>
                            <View style={styles.typingBubble}>
                                <Text style={styles.typingText}>Thinking…</Text>
                            </View>
                        </View>
                    )}

                    {/* Tokens are already flowing into the streaming bubble; this
                        slim row makes it obvious the AI hasn't stalled mid-reply. */}
                    {!busy && isStreaming && !!streamingContent && (
                        <View style={styles.streamingStatus}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.streamingStatusText}>Generating…</Text>
                        </View>
                    )}

                    {!readOnly && focusItems.length > 0 && (
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

                    {readOnly ? (
                        // Finalized strategy: history stays readable, but there's
                        // no composer — new turns would change a locked strategy.
                        <View style={styles.readOnlyFooter}>
                            <FontAwesomeIcon icon={faLock} size={12} color={colors.textSecondary} />
                            <Text style={styles.readOnlyFooterText} numberOfLines={2}>
                                Chat is read-only — this strategy is finalized. Duplicate it to keep chatting.
                            </Text>
                        </View>
                    ) : tokensExhausted ? (
                        // Out of monthly AI tokens — keep the user in context with an
                        // inline Upgrade / Add top-up block instead of redirecting.
                        <TokenMeterBlock tokens={tokens} safeBottom={safeBottom} />
                    ) : (
                        <>
                            {/* Low / critical token warning — non-blocking. */}
                            <TokenMeterNotice tokens={tokens} />
                            {/* Model strip — sits right above the input */}
                            <View style={styles.modelStrip}>
                                <View style={styles.modelStripGrow}>
                                    <AIModelSelector
                                        models={models}
                                        selectedModel={selectedModel}
                                        onSelect={setSelectedModel}
                                        compact
                                    />
                                </View>
                                <TokenMeterBar tokens={tokens} />
                            </View>

                            <View style={styles.inputArea}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={busy ? "Getting ready…" : placeholder}
                                    placeholderTextColor={colors.textSecondary}
                                    value={input}
                                    onChangeText={setInput}
                                    editable={!busy}
                                    multiline
                                    maxLength={1000}
                                    onKeyPress={(e: any) => {
                                        // Web: Enter sends, Shift+Enter inserts a newline.
                                        // Native multiline behaviour is left untouched.
                                        if (
                                            Platform.OS === "web" &&
                                            e?.nativeEvent?.key === "Enter" &&
                                            !e?.nativeEvent?.shiftKey
                                        ) {
                                            e.preventDefault?.();
                                            handleSend();
                                        }
                                    }}
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.sendBtn,
                                        pressed && styles.sendBtnPressed,
                                        (!input.trim() || isStreaming || busy) && styles.sendBtnDisabled,
                                    ]}
                                    onPress={handleSend}
                                    disabled={!input.trim() || isStreaming || busy}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} size={16} color={colors.onPrimary} />
                                </Pressable>
                            </View>
                        </>
                    )}
                </>
            )}
        </KeyboardAvoidingView>
        </View>
    );
};

export default AIChatPanel;

function useStyles(
    colors: ReturnType<typeof Colors>,
    isCompact: boolean,
    safeTop: number,
    safeBottom: number,
    messageAlign: "top" | "bottom"
) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, backgroundColor: colors.card },
                fill: { flex: 1 },
                panelHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: isCompact ? 8 : 12,
                    paddingTop: 10 + safeTop,
                    paddingBottom: 10,
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
                // Wizard mode (top-aligned) explicitly anchors to the top so a
                // single message hugs the top of the panel. Default chat is
                // rendered into an inverted FlatList, so items pile up from
                // the visual bottom on their own — no justifyContent needed.
                messageList: {
                    padding: isCompact ? 12 : 16,
                    gap: 12,
                    flexGrow: 1,
                    ...(messageAlign === "top"
                        ? { justifyContent: "flex-start" as const }
                        : {}),
                },
                initLoader: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: 24,
                },
                initText: { color: colors.textSecondary, fontSize: 13 },
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
                messageColumn: { maxWidth: "82%", gap: 6 },
                messageColumnAI: { alignItems: "flex-start" },
                messageColumnUser: { alignItems: "flex-end" },
                bubble: {
                    maxWidth: "100%",
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
                streamingStatus: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: isCompact ? 12 : 16,
                    paddingBottom: 8,
                },
                streamingStatusText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                },
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
                    gap: 10,
                    backgroundColor: colors.card,
                },
                modelStripGrow: { flex: 1 },
                inputArea: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 10,
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingBottom: (isCompact ? 10 : 14) + safeBottom,
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
                // ── Read-only footer (finalized strategy) ────────────────────
                readOnlyFooter: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: isCompact ? 12 : 16,
                    paddingTop: 10,
                    paddingBottom: (isCompact ? 12 : 16) + safeBottom,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 4,
                },
                readOnlyFooterText: {
                    flex: 1,
                    fontSize: 12.5,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    lineHeight: 17,
                },
            }),
        [colors, isCompact, safeTop, safeBottom, messageAlign]
    );
}
