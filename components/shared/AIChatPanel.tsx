import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import { TokenMeterBar, TokenMeterBlock, TokenMeterNotice } from "@/components/billing/TokenMeter";
import AIAnswerControl from "@/components/shared/AIAnswerControl";
import AIChatHistory from "@/components/shared/AIChatHistory";
import MarkdownMessage from "@/components/shared/MarkdownMessage";
import { getAIChatStarter } from "@/constants/AIChatStarters";
import { useBreakpoints } from "@/hooks";
import { AIControl, AIModule, useAIChat } from "@/hooks/use-ai-chat";
import { useAIModels } from "@/hooks/use-ai-models";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { pickMedia } from "@/shared-libs/utils/media-picker";
import Colors from "@/shared-uis/constants/Colors";
import {
    faChevronLeft,
    faChevronRight,
    faClockRotateLeft,
    faImage,
    faLock,
    faPaperPlane,
    faPenToSquare,
    faRobot,
    faUpRightAndDownLeftFromCenter,
    faWandMagicSparkles,
    faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Readable column width for the conversation in the wide (split) layout — the
// chat doesn't stretch full-bleed; messages + composer sit in a centered column.
const CHAT_MAX_WIDTH = 760;

// ─── Public types (kept for backward compatibility with existing screens) ─────

export interface ChatMessage {
    id: string;
    sender: "ai" | "user";
    text: string;
    timestamp: number;
    control?: AIControl;
    /** Image URLs attached to (user) or produced by (assistant) this message. */
    images?: string[];
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

/**
 * The panel's two header actions, lifted out so a host (e.g. the Playground
 * page) can render them in its own PageHeader instead of the panel's header.
 * Emitted via `onControlsChange`; pair with `hideHeader` to avoid duplicates.
 */
export interface AIChatControls {
    /** Toggle the conversation history (left pane on desktop, list view on mobile). */
    toggleHistory: () => void;
    /** Start a new blank-draft chat. */
    newChat: () => void;
    /** Whether the history list is currently showing (for active-state styling). */
    historyActive: boolean;
}

interface AIChatPanelProps {
    /** Which AI module backs this panel — drives system prompt + history filter. */
    module: AIModule;
    /** Optional context inside the module (e.g. strategyId, contentId). */
    contextId?: string;

    /**
     * Thread-list scope (forwarded to useAIChat).
     * - "module" (default): only this module's (+ contextId) conversations.
     * - "all": every conversation across all modules — the Playground hub. New
     *   chats still use `module` (Playground passes "general").
     */
    scope?: "module" | "all";

    /**
     * Panel layout.
     * - "panel" (default): single column; past conversations open via the
     *   header history toggle. Used by the per-module side panels + onboarding.
     * - "split": on desktop (xl), a persistent conversation list sits to the
     *   LEFT of the chat (Claude-style); on mobile (!xl) it falls back to the
     *   "panel" behaviour so the list→tap→chat flow still works. Used by the
     *   Playground.
     */
    layout?: "panel" | "split";

    /** Header label. Defaults to "AI Content Expert". */
    title?: string;

    /**
     * Open this conversation on mount instead of starting blank. Used by the
     * Playground when reached via another panel's "expand" action (deep-link with
     * a conversationId). One-shot — the user can navigate away afterwards.
     */
    initialConversationId?: string;

    /**
     * Emits the panel's header actions (history toggle + new chat) so a host can
     * render them elsewhere — e.g. the Playground surfaces them in its PageHeader
     * and passes `hideHeader` to suppress the panel's own header. Called whenever
     * the actions or their active state change. Memoize the callback to avoid
     * re-emits.
     */
    onControlsChange?: (controls: AIChatControls) => void;

    /**
     * Hero (empty-draft) state, shown when `scope="all"` and no conversation is
     * open yet: a centered branded greeting + composer + quick-start chips
     * instead of a bottom-pinned welcome bubble. `heroTitle` is the big greeting;
     * `heroSuggestions` prefill the composer when tapped.
     */
    heroTitle?: string;
    heroSuggestions?: string[];

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
     * Set when the host already insets for BOTH the notch and the
     * home-indicator (e.g. it sits inside an `AppLayout` whose `safeAreaEdges`
     * include `top` AND `bottom`). The panel then skips its own safe-area
     * padding on both axes so the inset isn't applied twice. Defaults to false
     * (panel self-insets, for edge-to-edge mounts).
     */
    parentHandlesSafeArea?: boolean;

    /**
     * Set when only the BOTTOM is handled by the host — e.g. the screen sits in
     * the tab navigator (the tab bar owns the home-indicator inset) but its
     * `AppLayout` does NOT inset `top`. The panel then keeps insetting its own
     * top (so its header clears the status bar) while skipping the bottom inset
     * (which would otherwise double up above the tab bar). Ignored when
     * `parentHandlesSafeArea` is set. Defaults to false.
     */
    parentHandlesSafeBottom?: boolean;
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
    scope = "module",
    layout = "panel",
    title = "AI Content Expert",
    heroTitle,
    heroSuggestions,
    onControlsChange,
    initialConversationId,
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
    parentHandlesSafeBottom = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const insets = useSafeAreaInsets();
    // On mobile (!xl) the panel mounts edge-to-edge (full-screen chat or the
    // floating sheet), so it must inset for the notch/home-indicator itself.
    // On desktop the surrounding AppLayout already handles safe area — as does
    // any host that opts in (which would otherwise double up). Top and bottom
    // are decoupled: a tab-hosted screen (`parentHandlesSafeBottom`) keeps its
    // top inset but lets the tab bar own the bottom.
    const selfInsetTop = !xl && !parentHandlesSafeArea;
    const selfInsetBottom = !xl && !parentHandlesSafeArea && !parentHandlesSafeBottom;
    const safeTop = selfInsetTop ? insets.top : 0;
    const rawSafeBottom = selfInsetBottom ? insets.bottom : 0;

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
        startNewChat,
        renameThread,
        deleteThread,
        refreshThreads,
    } = useAIChat({
        module,
        contextId,
        scope,
        // Playground (scope "all") opens to a blank placeholder chat — it does
        // NOT resume the most recent conversation. The user opens past chats
        // explicitly from the history pane.
        autoOpenLatest: !initialMessage && scope !== "all",
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

    // Two-pane (Claude-style) layout only on desktop. On mobile (!xl) we fall
    // back to the single-column panel where the list lives behind the header
    // toggle. In split mode the right pane is always the chat; the LEFT history
    // pane is a closable column toggled by the header clock icon (closed by
    // default, so the panel opens to the empty placeholder chat).
    const splitMode = layout === "split" && xl;
    const effectiveViewMode = splitMode ? "chat" : viewMode;
    const [historyOpen, setHistoryOpen] = useState(false);

    // Header clock icon: in split mode it opens/closes the left list; in the
    // single-column panel it toggles the whole view between chat and history
    // (toggle, not one-way, so a host header has a way back to chat too).
    const onToggleHistory = useCallback(() => {
        if (splitMode) setHistoryOpen((v) => !v);
        else setViewMode((v) => (v === "history" ? "chat" : "history"));
    }, [splitMode]);
    // Whether the history list is currently visible (drives active styling).
    const historyActive = splitMode ? historyOpen : viewMode === "history";

    // Chat-pane header label. In the Playground (scope "all") the list mixes
    // many conversations, so the header names the ACTIVE one rather than the
    // panel; per-module panels keep their fixed `title`.
    const activeThread = threads.find((t) => t.id === activeThreadId);
    const chatLabel = scope === "all" ? (activeThread?.title?.trim() || "New conversation") : title;
    const headerLabel = effectiveViewMode === "history" ? "Chat history" : chatLabel;

    // Hero (empty-state) copy comes from the per-module starter map, but any of
    // the three pieces can be overridden per-mount via props.
    const starter = getAIChatStarter(module);
    const resolvedHeroTitle = heroTitle ?? starter.heading;
    const resolvedHeroDescription = welcomeText ?? starter.description;
    const heroSuggestionList = heroSuggestions ?? starter.templates;

    // True from the moment a queued initial message is dispatched until its
    // content is on screen. sendMessage creates the thread over HTTP first, so
    // there's a ~1-2s window where the history subscription hasn't started yet
    // (notReady is already false) and the optimistic user bubble hasn't been
    // added — without this the panel would render an empty chat. Keeping the
    // loader up across this window is what avoids the "blank panel" on first open.
    const [startingConversation, setStartingConversation] = useState(false);

    // True until a deep-linked `initialConversationId` (Playground "expand") has
    // been opened — keeps the loader up (and the hero suppressed) so the target
    // conversation slides in directly instead of flashing the empty state.
    const [pendingInitialOpen, setPendingInitialOpen] = useState(!!initialConversationId);
    const openedInitialRef = useRef(false);
    useEffect(() => {
        if (!initialConversationId || openedInitialRef.current) return;
        openedInitialRef.current = true;
        loadThread(initialConversationId);
        setPendingInitialOpen(false);
    }, [initialConversationId, loadThread]);

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
    const busy = notReady || initialPending || startingConversation || pendingInitialOpen;

    // Centered hero empty state — shown for ANY module (and the Playground) when
    // there's no conversation yet, instead of a lone welcome bubble. As soon as
    // the user sends, an optimistic bubble lands / isStreaming flips and the hero
    // gives way to the normal thread view. Guards:
    //  - `!busy`: wait for load to settle so a module panel that auto-resumes its
    //    latest thread doesn't flash the hero first.
    //  - `!initialMessage`: hosts that auto-send a first message (strategy create
    //    flow) skip the hero so it isn't shown for a frame before dispatch.
    //  - `messageAlign === "bottom"`: excludes the onboarding wizard (top-aligned),
    //    which has its own guided layout.
    const showHero =
        !busy &&
        !initialMessage &&
        messageAlign === "bottom" &&
        !activeThreadId &&
        aiMessages.length === 0 &&
        !isStreaming &&
        !readOnly &&
        !tokensExhausted;

    // ── Compose state ────────────────────────────────────────────────────────
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList>(null);
    const { uploadFileUri } = useAWSContext();

    // Pending attachments for the next message: picked locally, uploaded to S3,
    // shown as chips until the message is sent. Send is blocked while uploading.
    type PendingImage = { key: string; uri: string; url?: string; uploading: boolean; failed?: boolean };
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const uploadingImages = pendingImages.some((p) => p.uploading);
    const readyImageUrls = useMemo(
        () => pendingImages.filter((p) => p.url).map((p) => p.url as string),
        [pendingImages]
    );

    // Full-screen image preview (tap any thumbnail to zoom).
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const handleAttach = useCallback(async () => {
        if (readOnly || tokensExhausted || busy) return;
        try {
            const picked = await pickMedia("image");
            if (!picked) return;
            const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setPendingImages((prev) => [...prev, { key, uri: picked.uri, uploading: true }]);
            try {
                const uploaded = await uploadFileUri({
                    id: picked.assetId ?? picked.uri,
                    localUri: picked.uri,
                    uri: picked.uri,
                    type: picked.type,
                });
                setPendingImages((prev) =>
                    prev.map((p) => (p.key === key ? { ...p, url: uploaded.imageUrl, uploading: false } : p))
                );
            } catch {
                setPendingImages((prev) =>
                    prev.map((p) => (p.key === key ? { ...p, uploading: false, failed: true } : p))
                );
            }
        } catch {
            // picker error — ignore
        }
    }, [readOnly, tokensExhausted, busy, uploadFileUri]);

    const removePendingImage = useCallback((key: string) => {
        setPendingImages((prev) => prev.filter((p) => p.key !== key));
    }, []);

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
            images: m.images && m.images.length > 0
                ? m.images
                : m.imageUrl
                    ? [m.imageUrl]
                    : undefined,
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
        if (readOnly || tokensExhausted || isStreaming || busy || uploadingImages) return;
        if (!trimmed && readyImageUrls.length === 0) return;
        const focusedText =
            focusItems.length > 0
                ? focusItems.map((f) => f.contextText ?? f.label).join("\n")
                : undefined;
        sendMessage(trimmed, focusedText, selectedModel, readyImageUrls.length > 0 ? readyImageUrls : undefined);
        setInput("");
        setPendingImages([]);
        focusItems.forEach((f) => onRemoveFocusItem?.(f.id));
    };

    const canSend =
        !isStreaming && !busy && !uploadingImages && (!!input.trim() || readyImageUrls.length > 0);

    // ── History view helpers ─────────────────────────────────────────────────
    useEffect(() => {
        if (viewMode === "history") refreshThreads();
    }, [viewMode, refreshThreads]);

    const onPickThread = (id: string) => {
        loadThread(id);
        setViewMode("chat");
        setHistoryOpen(false);
    };

    // "New chat" starts a blank draft — no conversation is persisted until the
    // user sends their first message (sendMessage creates it lazily). Until then
    // the panel shows the empty/welcome state.
    const onNewChat = useCallback(() => {
        startNewChat();
        setViewMode("chat");
        setHistoryOpen(false);
    }, [startNewChat]);

    // Surface the two header actions to a host (Playground → PageHeader). Re-emits
    // only when a handler identity or the active state actually changes.
    useEffect(() => {
        onControlsChange?.({ toggleHistory: onToggleHistory, newChat: onNewChat, historyActive });
    }, [onControlsChange, onToggleHistory, onNewChat, historyActive]);

    // "Expand" — open the active conversation in the full Playground. Deep-links
    // with its id so the Playground opens it by default. Only meaningful from a
    // module panel (the Playground IS the expanded view), and only when a
    // conversation is actually open.
    const canExpand = scope !== "all" && !!activeThreadId;
    const onExpand = useCallback(() => {
        if (!activeThreadId) return;
        router.push({ pathname: "/playground", params: { conversationId: activeThreadId } });
    }, [activeThreadId]);

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
                    {item.images && item.images.length > 0 && (
                        <View style={[styles.imageGrid, isAI ? styles.imageGridAI : styles.imageGridUser]}>
                            {item.images.map((url, idx) => (
                                <Pressable
                                    key={`${url}-${idx}`}
                                    onPress={() => setLightboxUrl(url)}
                                    style={styles.imageThumb}
                                    accessibilityRole="imagebutton"
                                    accessibilityLabel="View image"
                                >
                                    <Image source={{ uri: url }} style={styles.imageThumbImg} resizeMode="cover" />
                                </Pressable>
                            ))}
                        </View>
                    )}
                    {!!item.text && (
                        <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
                            {isAI ? (
                                <MarkdownMessage content={item.text} compact={isCompact} />
                            ) : (
                                <Text style={[styles.bubbleText, styles.userText]}>
                                    {item.text}
                                </Text>
                            )}
                        </View>
                    )}
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

    // Token notice + pending-image chips + composer. Extracted so the same
    // composer renders both at the bottom of an active thread AND centered in
    // the hero empty state.
    const composerStack = (
        <>
            {/* Low / critical token warning — non-blocking. */}
            <View style={splitMode ? styles.centered : undefined}>
                <TokenMeterNotice tokens={tokens} />
            </View>

            {/* Pending image attachments — chips with upload spinner + remove */}
            {pendingImages.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={[styles.attachBar, splitMode && styles.centered]}
                    contentContainerStyle={styles.attachBarContent}
                >
                    {pendingImages.map((p) => (
                        <View key={p.key} style={styles.attachChip}>
                            <Image source={{ uri: p.uri }} style={styles.attachThumb} resizeMode="cover" />
                            {p.uploading && (
                                <View style={styles.attachOverlay}>
                                    <ActivityIndicator size="small" color={colors.onPrimary} />
                                </View>
                            )}
                            {p.failed && (
                                <View style={styles.attachOverlay}>
                                    <Text style={styles.attachFailedText}>!</Text>
                                </View>
                            )}
                            <Pressable
                                onPress={() => removePendingImage(p.key)}
                                style={styles.attachRemove}
                                hitSlop={6}
                                accessibilityLabel="Remove attachment"
                            >
                                <FontAwesomeIcon icon={faXmark} size={9} color={colors.onPrimary} />
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Composer — full-width input on top, controls (image, model,
                tokens, send) on a roomy row below for easy mobile tapping. */}
            <View style={[styles.inputArea, splitMode && styles.centered]}>
                <View style={styles.composer}>
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
                    <View style={styles.composerControls}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.attachBtn,
                                pressed && styles.attachBtnPressed,
                                busy && styles.sendBtnDisabled,
                            ]}
                            onPress={handleAttach}
                            disabled={busy}
                            hitSlop={8}
                            accessibilityLabel="Attach image"
                        >
                            <FontAwesomeIcon icon={faImage} size={18} color={colors.primary} />
                        </Pressable>
                        <View style={styles.modelStripGrow}>
                            <AIModelSelector
                                models={models}
                                selectedModel={selectedModel}
                                onSelect={setSelectedModel}
                                compact
                            />
                        </View>
                        <TokenMeterBar tokens={tokens} />
                        <Pressable
                            style={({ pressed }) => [
                                styles.sendBtn,
                                pressed && styles.sendBtnPressed,
                                !canSend && styles.sendBtnDisabled,
                            ]}
                            onPress={handleSend}
                            disabled={!canSend}
                            hitSlop={8}
                            accessibilityLabel="Send message"
                        >
                            <FontAwesomeIcon icon={faPaperPlane} size={16} color={colors.onPrimary} />
                        </Pressable>
                    </View>
                </View>
            </View>
        </>
    );

    return (
        <View
            ref={rootRef}
            style={[styles.container, splitMode && styles.containerSplit]}
            onLayout={measureKbOffset}
        >
            {/* Closable conversation list (desktop split layout only). Hidden by
            default; toggled open by the header clock icon. */}
            {splitMode && historyOpen && (
                <View style={styles.historyPane}>
                    <View style={styles.historyPaneHeader}>
                        <Text style={styles.historyPaneTitle} numberOfLines={1}>Conversations</Text>
                        <Pressable
                            onPress={() => setHistoryOpen(false)}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close conversations"
                            hitSlop={6}
                        >
                            <FontAwesomeIcon icon={faXmark} size={14} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <AIChatHistory
                        threads={threads}
                        activeThreadId={activeThreadId}
                        onPickThread={onPickThread}
                        onNewChat={onNewChat}
                        onRenameThread={renameThread}
                        onDeleteThread={deleteThread}
                        showModuleBadge={scope === "all"}
                    />
                </View>
            )}
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
                            {headerLabel}
                        </Text>
                        {effectiveViewMode === "chat" ? (
                            <>
                                {canExpand && (
                                    <Pressable
                                        onPress={onExpand}
                                        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                                        accessibilityRole="button"
                                        accessibilityLabel="Expand in Playground"
                                        hitSlop={6}
                                    >
                                        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} size={13} color={colors.text} />
                                    </Pressable>
                                )}
                                <Pressable
                                    onPress={onToggleHistory}
                                    style={({ pressed }) => [
                                        styles.iconBtn,
                                        (pressed || historyActive) && styles.iconBtnPressed,
                                    ]}
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

                {effectiveViewMode === "history" ? (
                    <AIChatHistory
                        threads={threads}
                        activeThreadId={activeThreadId}
                        onPickThread={onPickThread}
                        onNewChat={onNewChat}
                        onRenameThread={renameThread}
                        onDeleteThread={deleteThread}
                        showModuleBadge={scope === "all"}
                    />
                ) : showHero ? (
                    // ── Hero empty state (Playground draft) ──────────────────────
                    // Centered greeting + composer + quick-start chips. Replaced by
                    // the normal thread view the moment the user sends.
                    <ScrollView
                        style={styles.fill}
                        contentContainerStyle={styles.heroScroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.heroInner}>
                            {/* <View style={styles.heroIcon}>
                                <FontAwesomeIcon icon={faWandMagicSparkles} size={24} color={colors.onPrimary} />
                            </View> */}
                            <Text style={styles.heroTitle}>{resolvedHeroTitle}</Text>
                            {!!resolvedHeroDescription && (
                                <Text style={styles.heroSubtitle}>{resolvedHeroDescription}</Text>
                            )}
                            <View style={styles.heroComposer}>{composerStack}</View>
                            {heroSuggestionList.length > 0 && (
                                <View style={styles.heroChips}>
                                    {heroSuggestionList.map((s) => (
                                        <Pressable
                                            key={s}
                                            onPress={() => setInput(s)}
                                            style={({ pressed }) => [styles.heroChip, pressed && styles.heroChipPressed]}
                                            accessibilityRole="button"
                                            accessibilityLabel={s}
                                        >
                                            <Text style={styles.heroChipText} numberOfLines={1}>{s}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
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
                                contentContainerStyle={[styles.messageList, splitMode && styles.centered]}
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
                            <View style={[styles.typingRow, splitMode && styles.centered]}>
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
                            <View style={[styles.streamingStatus, splitMode && styles.centered]}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.streamingStatusText}>Generating…</Text>
                            </View>
                        )}

                        {!readOnly && focusItems.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={[styles.focusBar, splitMode && styles.centered]}
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
                            <View style={[styles.readOnlyFooter, splitMode && styles.centered]}>
                                <FontAwesomeIcon icon={faLock} size={12} color={colors.textSecondary} />
                                <Text style={styles.readOnlyFooterText} numberOfLines={2}>
                                    Chat is read-only — this strategy is finalized. Duplicate it to keep chatting.
                                </Text>
                            </View>
                        ) : tokensExhausted ? (
                            // Out of monthly AI tokens — keep the user in context with an
                            // inline Upgrade / Add top-up block instead of redirecting.
                            <View style={splitMode ? styles.centered : undefined}>
                                <TokenMeterBlock tokens={tokens} safeBottom={safeBottom} />
                            </View>
                        ) : (
                            composerStack
                        )}
                    </>
                )}
            </KeyboardAvoidingView>

            {/* Full-screen image preview */}
            <Modal visible={!!lightboxUrl} transparent animationType="fade" onRequestClose={() => setLightboxUrl(null)}>
                <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUrl(null)}>
                    {lightboxUrl && (
                        <Image source={{ uri: lightboxUrl }} style={styles.lightboxImage} resizeMode="contain" />
                    )}
                    <View style={styles.lightboxClose}>
                        <FontAwesomeIcon icon={faXmark} size={18} color={colors.onPrimary} />
                    </View>
                </Pressable>
            </Modal>
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
                // Desktop two-pane: list column + chat column side by side.
                containerSplit: { flexDirection: "row" },
                // Left conversation list. Separated from the chat by a rightward
                // shadow (panel divider via shadow, not a border — per design rules).
                historyPane: {
                    width: 300,
                    backgroundColor: colors.card,
                    zIndex: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.07,
                    elevation: 8,
                },
                historyPaneHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: 16,
                    paddingRight: 8,
                    paddingTop: 14,
                    paddingBottom: 6,
                },
                historyPaneTitle: {
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    letterSpacing: -0.2,
                },
                fill: { flex: 1 },
                // Constrains the conversation content (messages + composer) to a
                // readable centered column when the chat pane is wide (split layout).
                centered: { width: "100%", maxWidth: CHAT_MAX_WIDTH, alignSelf: "center" },
                // ── Hero empty state ─────────────────────────────────────────
                heroScroll: {
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: isCompact ? 14 : 20,
                    paddingVertical: isCompact ? 20 : 32,
                },
                heroInner: {
                    width: "100%",
                    maxWidth: isCompact ? 440 : 640,
                    alignItems: "center",
                    gap: isCompact ? 11 : 14,
                },
                heroIcon: {
                    width: isCompact ? 48 : 56,
                    height: isCompact ? 48 : 56,
                    borderRadius: isCompact ? 24 : 28,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 16,
                    shadowOpacity: 0.35,
                    elevation: 6,
                    marginBottom: 2,
                },
                heroTitle: {
                    fontSize: isCompact ? 20 : 26,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    letterSpacing: -0.4,
                },
                heroSubtitle: {
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 480,
                    marginBottom: 6,
                },
                // The shared composer renders full-width inside the hero column.
                heroComposer: { width: "100%" },
                heroChips: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 2,
                },
                heroChip: {
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                heroChipPressed: { opacity: 0.7 },
                heroChipText: { fontSize: 13, fontWeight: "500", color: colors.text },
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
                // ── Composer (input + controls) ──────────────────────────────
                modelStripGrow: { flex: 1, minWidth: 0 },
                // Floating bottom bar — holds the composer card. The composer carries
                // its own lift shadow, so the bar itself stays flat (no upward edge line).
                inputArea: {
                    paddingHorizontal: isCompact ? 10 : 14,
                    paddingBottom: (isCompact ? 10 : 14) + safeBottom,
                    paddingTop: 6,
                    backgroundColor: colors.card,
                },
                // Single rounded surface: full-width text on top, controls row below.
                // Card-coloured + lifted so the tag-coloured chip / token track inside
                // it stay legible (tag-on-tag would vanish).
                composer: {
                    backgroundColor: colors.card,
                    borderRadius: 22,
                    paddingHorizontal: 6,
                    paddingTop: 4,
                    paddingBottom: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                input: {
                    minHeight: 40,
                    maxHeight: 140,
                    color: colors.text,
                    paddingHorizontal: 12,
                    paddingTop: 8,
                    paddingBottom: 6,
                    fontSize: 15,
                    textAlignVertical: "top",
                    // No blue focus ring on web — the composer surface already
                    // signals the active field.
                    ...Platform.select({ web: { outlineStyle: "none" } as any }),
                },
                composerControls: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 2,
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
                // ── Attach button + pending image chips ──────────────────────
                attachBtn: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                },
                attachBtnPressed: { backgroundColor: colors.tag },
                attachBar: { flexShrink: 0, maxHeight: 76, marginHorizontal: 12, marginBottom: 6 },
                attachBarContent: { gap: 8, alignItems: "center", paddingVertical: 4 },
                attachChip: {
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                attachThumb: { width: "100%", height: "100%" },
                attachOverlay: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.backdropStrong,
                },
                attachFailedText: { color: colors.onPrimary, fontWeight: "800", fontSize: 16 },
                attachRemove: {
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.backdropStrong,
                },
                // ── Message image thumbnails + lightbox ──────────────────────
                imageGrid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    maxWidth: "100%",
                },
                imageGridAI: { justifyContent: "flex-start" },
                imageGridUser: { justifyContent: "flex-end" },
                imageThumb: {
                    width: 132,
                    height: 132,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.08,
                    elevation: 2,
                },
                imageThumbImg: { width: "100%", height: "100%" },
                lightboxBackdrop: {
                    flex: 1,
                    backgroundColor: colors.backdropStrong,
                    alignItems: "center",
                    justifyContent: "center",
                },
                lightboxImage: { width: "92%", height: "80%" },
                lightboxClose: {
                    position: "absolute",
                    top: 50,
                    right: 24,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.backdropStrong,
                },
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
