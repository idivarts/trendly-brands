import ChatLoadingPanel from "@/components/content-strategy/ChatLoadingPanel";
import CollaboratorsModal from "@/components/content-strategy/CollaboratorsModal";
import CommentsPanel from "@/components/content-strategy/CommentsPanel";
import PresenceAvatars from "@/components/content-strategy/PresenceAvatars";
import SnippetCommentPopover from "@/components/content-strategy/SnippetCommentPopover";
import StrategiesDrawer from "@/components/content-strategy/StrategiesDrawer";
import StrategyEditorPanel from "@/components/content-strategy/StrategyEditorPanel";
import StrategyLoadingPanel from "@/components/content-strategy/StrategyLoadingPanel";
import StrategyShimmerPanel from "@/components/content-strategy/StrategyShimmerPanel";
import { ContentStrategy, ReviewStatus, ScreenState } from "@/components/content-strategy/types";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBreakpoints } from "@/hooks";
import { useStrategies } from "@/hooks/use-strategies";
import { useStrategyComments } from "@/hooks/use-strategy-comments";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBars,
    faCalendarDays,
    faCheck,
    faCommentDots,
    faPaperPlane,
    faPlus,
    faRobot,
    faRotateLeft,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text } from "react-native";

// ─── Review Status Banner ─────────────────────────────────────────────────────

interface StrategyToolbarProps {
    strategy: ContentStrategy;
    currentManagerId: string;
    xl: boolean;
    onApprove: () => void;
    onRequestChanges: () => void;
    onInvite: () => void;
    onSendForReview: () => void;
    onPushToCalendar: () => void;
    colors: ReturnType<typeof Colors>;
}

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: "transparent", text: "transparent", label: "" },
    in_review: { bg: "rgba(224,122,0,0.1)", text: "#E07A00", label: "Pending Review" },
    approved: { bg: "rgba(26,122,58,0.1)", text: "#1A7A3A", label: "Approved" },
    changes_requested: { bg: "rgba(220,38,38,0.1)", text: "#DC2626", label: "Changes Requested" },
};

const StrategyToolbar: React.FC<StrategyToolbarProps> = ({
    strategy,
    currentManagerId,
    xl,
    onApprove,
    onRequestChanges,
    onInvite,
    onSendForReview,
    onPushToCalendar,
    colors,
}) => {
    const reviewStatus = strategy.reviewStatus ?? "draft";
    const config = REVIEW_STATUS_CONFIG[reviewStatus];
    const isDraft = reviewStatus === "draft";
    const isReviewer =
        reviewStatus === "in_review" &&
        strategy.collaboratorIds?.includes(currentManagerId) &&
        strategy.reviewRequestedBy !== currentManagerId;
    const canSendForReview = reviewStatus === "draft" || reviewStatus === "changes_requested";

    const styles = toolbarStyles(colors, xl, isDraft ? "transparent" : config.bg);

    return (
        <View style={styles.row}>
            {!isDraft && (
                <View style={styles.statusBlock}>
                    <Text style={[styles.statusLabel, { color: config.text }]}>{config.label}</Text>
                    {reviewStatus === "in_review" && (
                        <Text style={styles.statusSub}>
                            {isReviewer
                                ? "This strategy has been sent to you for review."
                                : "Awaiting review from collaborators."}
                        </Text>
                    )}
                </View>
            )}
            <View style={styles.actions}>
                {isReviewer && (
                    <>
                        <Pressable
                            style={({ pressed }) => [styles.approveBtn, pressed && styles.btnPressed]}
                            onPress={onApprove}
                            accessibilityLabel="Approve"
                        >
                            <FontAwesomeIcon icon={faCheck} size={12} color="#fff" />
                            {xl && <Text style={styles.approveBtnText}>Approve</Text>}
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.rejectBtn, pressed && styles.btnPressed]}
                            onPress={onRequestChanges}
                            accessibilityLabel="Request Changes"
                        >
                            <FontAwesomeIcon icon={faRotateLeft} size={12} color="#DC2626" />
                            {xl && <Text style={styles.rejectBtnText}>Request Changes</Text>}
                        </Pressable>
                    </>
                )}

                <Pressable
                    style={({ pressed }) => [
                        xl ? styles.outlineBtn : styles.iconBtn,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={onInvite}
                    accessibilityLabel="Invite collaborators"
                >
                    <FontAwesomeIcon icon={faUserGroup} size={14} color={colors.primary} />
                    {xl && <Text style={styles.outlineBtnText}>Invite</Text>}
                </Pressable>

                {canSendForReview && (
                    <Pressable
                        style={({ pressed }) => [
                            xl ? styles.outlineBtn : styles.iconBtn,
                            pressed && styles.btnPressed,
                        ]}
                        onPress={onSendForReview}
                        accessibilityLabel="Send for Review"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} size={14} color={colors.primary} />
                        {xl && <Text style={styles.outlineBtnText}>Send for Review</Text>}
                    </Pressable>
                )}

                <Pressable
                    style={({ pressed }) => [
                        xl ? styles.outlineBtn : styles.iconBtn,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={onPushToCalendar}
                    accessibilityLabel="Push to Calendar"
                >
                    <FontAwesomeIcon icon={faCalendarDays} size={14} color={colors.primary} />
                    {xl && <Text style={styles.outlineBtnText}>Push to Calendar</Text>}
                </Pressable>
            </View>
        </View>
    );
};

function toolbarStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    bg: string,
) {
    return StyleSheet.create({
        row: {
            backgroundColor: bg === "transparent" ? colors.background : bg,
            paddingHorizontal: xl ? 16 : 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.05,
            elevation: 1,
        },
        statusBlock: {
            flex: 1,
            minWidth: 0,
        },
        statusLabel: {
            fontSize: 13,
            fontWeight: "700",
        },
        statusSub: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: xl ? 8 : 6,
            marginLeft: "auto",
        },
        approveBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: xl ? 12 : 10,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: "#1A7A3A",
        },
        approveBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#fff",
        },
        rejectBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: xl ? 12 : 10,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: "rgba(220,38,38,0.12)",
        },
        rejectBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#DC2626",
        },
        outlineBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        outlineBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.primary,
        },
        iconBtn: {
            width: 34,
            height: 34,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.primary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
// .replace(/<[^>]*>/g, "").trim()
const hasRealContent = (html: string) => !!html.replace(/<[^>]*>/g, "").trim();

const ContentStrategyDetail = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const { manager } = useAuthContext();
    const { strategyId, initialPrompt } = useLocalSearchParams<{
        strategyId: string;
        initialPrompt?: string;
    }>();

    const {
        strategies,
        loading: strategiesLoading,
        updateStrategyContent,
        updateReviewStatus,
        updatePresence,
    } = useStrategies();

    // Start in "loading" until Firestore tells us whether this strategy has
    // content. Only then do we resolve to "collecting" or "strategy-ready".

    const [strategyContent, setStrategyContent] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [chatFocusItems, setChatFocusItems] = useState<FocusItem[]>([]);
    const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(
        initialPrompt
    );

    const [screenState, setScreenState] = useState<ScreenState>("loading");

    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(xl ? "chat" : "none");
    const [showCollaborators, setShowCollaborators] = useState(false);
    const [snippetSelection, setSnippetSelection] = useState<{
        snippet: string;
        anchorStart: number;
        anchorEnd: number;
    } | null>(null);

    // Two animated drivers — interpolated to derive every visual property.
    // We drive everything off interpolations because RN Web doesn't reliably
    // propagate direct Animated.Value updates to opacity/transform inline
    // styles, whereas interpolated values flow through correctly (verified).
    //
    // transitionProgress: 0 = collecting/loading layout (chat-heavy),
    //                     1 = strategy-ready layout (editor-heavy).
    // loadedProgress:     1 = still loading (skeleton),
    //                     0 = resolved (collecting or strategy-ready).
    const transitionProgress = useRef(new Animated.Value(0)).current;
    const loadedProgress = useRef(new Animated.Value(1)).current;

    const styles = useMemo(() => useStyles(colors), [colors]);

    const activeStrategy = useMemo(
        () => strategies.find((s) => s.id === strategyId) ?? null,
        [strategies, strategyId]
    );

    const { addSnippetComment } = useStrategyComments(strategyId ?? null);

    // Seed the local editor content from the live strategy when it loads/changes.
    useEffect(() => {
        if (activeStrategy) {
            setStrategyContent(activeStrategy.content);
        }
    }, [activeStrategy]);

    // Resolve the loading state once Firestore returns. If the strategy already
    // has content, jump straight to "strategy-ready"; otherwise enter
    // "collecting". After that, the screenState is driven by content edits.
    useEffect(() => {
        if (screenState !== "loading") return;
        if (strategiesLoading) return;
        if (activeStrategy) {
            setScreenState(
                hasRealContent(activeStrategy.content) ? "strategy-ready" : "collecting"
            );
        } else {
            // Strategy not found in the snapshot yet (e.g. just-created with an
            // initialPrompt). Fall through to collecting — chat will lead.
            setScreenState("collecting");
        }
    }, [screenState, strategiesLoading, activeStrategy]);

    // Once content arrives on a collecting page, flip to strategy-ready.
    useEffect(() => {
        if (screenState === "collecting" && hasRealContent(strategyContent)) {
            setScreenState("strategy-ready");
        }
        if (screenState === "strategy-ready" && !hasRealContent(strategyContent)) {
            setScreenState("collecting");
        }
    }, [screenState, strategyContent]);

    // Drive the coordinated transition whenever screenState changes.
    useEffect(() => {
        const isLoading = screenState === "loading";
        const isReady = screenState === "strategy-ready";

        Animated.timing(loadedProgress, {
            toValue: isLoading ? 1 : 0,
            duration: 220,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();

        Animated.timing(transitionProgress, {
            toValue: isReady ? 1 : 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [screenState, loadedProgress, transitionProgress]);

    // Presence heartbeat
    useEffect(() => {
        if (!strategyId) return;
        updatePresence(strategyId);
        const interval = setInterval(() => updatePresence(strategyId), 20_000);
        return () => clearInterval(interval);
    }, [strategyId, updatePresence]);

    const handleSendToChat = useCallback((text: string) => {
        const label = text.length > 120 ? text.slice(0, 120) + "..." : text;
        setChatFocusItems((prev) => {
            const id = `focus-${Date.now()}`;
            return [...prev, { id, label }];
        });
    }, []);

    const handleNewStrategy = useCallback(() => {
        router.push("/(main)/(drawer)/(tabs)/(content)/content-strategies" as any);
    }, [router]);

    const handleSelectStrategy = useCallback(
        (strategy: ContentStrategy) => {
            router.push({
                pathname: "/(main)/(drawer)/(tabs)/(content)/content-strategies/[strategyId]" as any,
                params: { strategyId: strategy.id },
            });
        },
        [router]
    );

    const handleStrategyContentChange = useCallback(
        async (newContent: string) => {
            setStrategyContent(newContent);
            if (strategyId) {
                await updateStrategyContent(strategyId, newContent);
            }
        },
        [strategyId, updateStrategyContent]
    );

    // Escape hatch from the shimmer: seed the editor with a placeholder
    // paragraph. The hasRealContent effect picks this up and flips the
    // screen state to "strategy-ready" on the next render.
    const handleWriteManually = useCallback(() => {
        handleStrategyContentChange("<p>Write your strategy here</p>");
    }, [handleStrategyContentChange]);

    const handleSendForReview = useCallback(async () => {
        if (!strategyId) return;
        await updateReviewStatus(strategyId, "in_review");
    }, [strategyId, updateReviewStatus]);

    const handleApprove = useCallback(async () => {
        if (!strategyId) return;
        await updateReviewStatus(strategyId, "approved", manager?.id);
    }, [strategyId, updateReviewStatus, manager?.id]);

    const handleRequestChanges = useCallback(async () => {
        if (!strategyId) return;
        await updateReviewStatus(strategyId, "changes_requested", manager?.id);
    }, [strategyId, updateReviewStatus, manager?.id]);

    const handleSnippetComment = useCallback(
        (snippet: string, anchorStart: number, anchorEnd: number) => {
            setSnippetSelection({ snippet, anchorStart, anchorEnd });
        },
        []
    );

    const handleSnippetCommentSubmit = useCallback(
        async (text: string, snippet: string, anchorStart: number, anchorEnd: number) => {
            await addSnippetComment(text, snippet, anchorStart, anchorEnd);
            setSnippetSelection(null);
        },
        [addSnippetComment]
    );

    const handleCommentsToggle = useCallback(() => {
        setRightPanelMode((m) => (m === "comments" ? "none" : "comments"));
    }, []);

    const handleChatToggle = useCallback(() => {
        setRightPanelMode((m) => (m === "chat" ? "none" : "chat"));
    }, []);

    // Collecting state: chat is the primary surface (70% on xl, 100% on !xl)
    // and not collapsible. Pin mode to "chat" while collecting so neither the
    // user nor a stale state can close it.
    const isCollecting = screenState === "collecting";
    const isLoading = screenState === "loading";
    const isReady = screenState === "strategy-ready";
    useEffect(() => {
        if (isCollecting) setRightPanelMode("chat");
    }, [isCollecting]);

    // Track which left-panel children to keep in the tree. Inactive children
    // are unmounted after the crossfade completes so their animation loops
    // (shimmer, skeleton) don't keep running off-screen.
    const [mountFlags, setMountFlags] = useState({
        loading: true,
        shimmer: false,
        editor: false,
    });
    useEffect(() => {
        setMountFlags((prev) => ({
            loading: prev.loading || isLoading,
            shimmer: prev.shimmer || isCollecting,
            editor: prev.editor || isReady,
        }));
        const t = setTimeout(() => {
            setMountFlags({
                loading: isLoading,
                shimmer: isCollecting,
                editor: isReady,
            });
        }, 420);
        return () => clearTimeout(t);
    }, [isLoading, isCollecting, isReady]);

    // Keep the mobile full-screen chat mounted briefly after collecting ends so
    // its opacity fade can play before it leaves the tree.
    const [mobileChatMounted, setMobileChatMounted] = useState(false);
    useEffect(() => {
        if (isCollecting) {
            setMobileChatMounted(true);
            return;
        }
        const t = setTimeout(() => setMobileChatMounted(false), 240);
        return () => clearTimeout(t);
    }, [isCollecting]);

    // Panel flex: collecting (3 : 7) → strategy-ready (2 : 1).
    const leftFlex = transitionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 2],
    });
    const rightFlex = transitionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [7, 1],
    });

    // Derived opacities. While loadedProgress > 0, only the loading skeleton
    // is visible; once it crosses to 0, transitionProgress determines whether
    // the shimmer or editor shows.
    const loadingOpacity = loadedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });
    const shimmerOpacity = Animated.multiply(
        loadedProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transitionProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
    );
    const editorOpacity = Animated.multiply(
        loadedProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transitionProgress
    );
    const toolbarOpacity = editorOpacity;
    const toolbarTranslateY = transitionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-8, 0],
    });
    const mobileChatOpacity = transitionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    const headerLeftAction = useMemo(() => {
        if (strategies.length === 0) return null;
        return (
            <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.headerBtnPressed]}
                onPress={() => setDrawerOpen(true)}
            >
                <FontAwesomeIcon icon={faBars} size={18} color={colors.text} />
            </Pressable>
        );
    }, [strategies.length, colors.text, styles]);

    const viewingActionButtons = useMemo(() => {
        const isStrategyReady = screenState === "strategy-ready";
        return [
            strategyId ? (
                <PresenceAvatars key="presence" strategyId={strategyId} />
            ) : null,

            isStrategyReady ? (
                <Pressable
                    key="comments"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "comments" && styles.iconBtnActive,
                        pressed && styles.headerBtnPressed,
                    ]}
                    onPress={handleCommentsToggle}
                >
                    <FontAwesomeIcon
                        icon={faCommentDots}
                        size={16}
                        color={rightPanelMode === "comments" ? colors.onPrimary : colors.text}
                    />
                </Pressable>
            ) : null,

            isStrategyReady ? (
                <Pressable
                    key="chat"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "chat" && styles.iconBtnActive,
                        pressed && styles.headerBtnPressed,
                    ]}
                    onPress={handleChatToggle}
                >
                    <FontAwesomeIcon
                        icon={faRobot}
                        size={16}
                        color={rightPanelMode === "chat" ? colors.onPrimary : colors.text}
                    />
                </Pressable>
            ) : null,

            <Pressable
                key="new"
                style={({ pressed }) => [
                    xl ? styles.headerBtn : styles.iconBtn,
                    styles.headerBtnPrimary,
                    pressed && styles.headerBtnPressed,
                ]}
                onPress={handleNewStrategy}
                accessibilityLabel="New Strategy"
            >
                <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
                {xl && <Text style={styles.headerBtnPrimaryText}>New Strategy</Text>}
            </Pressable>,
        ].filter(Boolean) as React.ReactElement[];
    }, [
        screenState,
        strategyId,
        rightPanelMode,
        colors,
        styles,
        xl,
        handleCommentsToggle,
        handleChatToggle,
        handleNewStrategy,
    ]);

    return (
        <AppLayout>
            <PageHeader
                title={xl ? "Content Strategy" : "Strategy"}
                subtitle="Form a strategy before putting it in actionable content"
                showBackButton={false}
                leftAction={headerLeftAction}
                viewingActionButtons={viewingActionButtons}
                mobileActions="all"
            />

            {activeStrategy && (
                <Animated.View
                    style={{
                        opacity: toolbarOpacity,
                        transform: [{ translateY: toolbarTranslateY }],
                    }}
                    pointerEvents={isReady ? "auto" : "none"}
                >
                    <StrategyToolbar
                        strategy={activeStrategy}
                        currentManagerId={manager?.id ?? ""}
                        xl={xl}
                        onApprove={handleApprove}
                        onRequestChanges={handleRequestChanges}
                        onInvite={() => setShowCollaborators(true)}
                        onSendForReview={handleSendForReview}
                        onPushToCalendar={() => { }}
                        colors={colors}
                    />
                </Animated.View>
            )}

            <View style={styles.splitContainer}>
                {/* ── Left: layered loading-skeleton / shimmer / editor.
                    All three states cross-fade via opacity. Inactive children
                    are unmounted after the transition completes (mountFlags).
                    On !xl while collecting, the chat takes the whole screen,
                    so we skip rendering the left panel entirely. */}
                {!(isCollecting && !xl) && (
                    <Animated.View
                        style={[
                            styles.leftPanel,
                            { flex: xl ? leftFlex : 1 },
                        ]}
                    >
                        {mountFlags.loading && (
                            <Animated.View
                                style={[styles.layered, { opacity: loadingOpacity }]}
                                pointerEvents={isLoading ? "auto" : "none"}
                            >
                                <StrategyLoadingPanel animating={isLoading} />
                            </Animated.View>
                        )}
                        {mountFlags.shimmer && (
                            <Animated.View
                                style={[styles.layered, { opacity: shimmerOpacity }]}
                                pointerEvents={isCollecting ? "auto" : "none"}
                            >
                                <StrategyShimmerPanel onWriteManually={handleWriteManually} />
                            </Animated.View>
                        )}
                        {mountFlags.editor && (
                            <Animated.View
                                style={[styles.layered, { opacity: editorOpacity }]}
                                pointerEvents={isReady ? "auto" : "none"}
                            >
                                <StrategyEditorPanel
                                    content={strategyContent}
                                    onChange={handleStrategyContentChange}
                                    onSendToChat={handleSendToChat}
                                    onSnippetComment={handleSnippetComment}
                                    strategyId={strategyId ?? undefined}
                                />
                            </Animated.View>
                        )}
                    </Animated.View>
                )}

                {/* ── Right: split-pane on desktop. During loading we show a
                      chat-bubble skeleton instead of mounting the real chat
                      so we don't trigger network calls before we know which
                      state to land in. ─────────────────────────────────── */}
                {xl && (
                    <Animated.View
                        style={[
                            styles.rightPanel,
                            { flex: rightFlex },
                            !isCollecting && !isLoading && rightPanelMode === "none"
                                ? styles.rightPanelCollapsed
                                : null,
                        ]}
                    >
                        {isLoading ? (
                            <ChatLoadingPanel animating />
                        ) : (
                            <RightSidePanel
                                mode={isCollecting ? "chat" : rightPanelMode}
                                onModeChange={isCollecting ? () => { } : setRightPanelMode}
                                commentsSlot={
                                    <CommentsPanel
                                        strategyId={strategyId ?? null}
                                        onCollapse={() => setRightPanelMode("none")}
                                    />
                                }
                                chatSlot={
                                    <AIChatPanel
                                        module="strategy"
                                        contextId={strategyId ?? undefined}
                                        initialMessage={initialChatMessage}
                                        onInitialMessageSent={() =>
                                            setInitialChatMessage(undefined)
                                        }
                                        focusItems={chatFocusItems}
                                        onRemoveFocusItem={(id) =>
                                            setChatFocusItems((prev) =>
                                                prev.filter((f) => f.id !== id)
                                            )
                                        }
                                        isCompact={screenState === "strategy-ready"}
                                        onCollapse={
                                            isCollecting
                                                ? undefined
                                                : () => setRightPanelMode("none")
                                        }
                                    />
                                }
                            />
                        )}
                    </Animated.View>
                )}

                {!xl && mobileChatMounted && (
                    <Animated.View
                        style={[styles.fullScreenChat, { opacity: mobileChatOpacity }]}
                        pointerEvents={isCollecting ? "auto" : "none"}
                    >
                        <AIChatPanel
                            module="strategy"
                            contextId={strategyId ?? undefined}
                            initialMessage={initialChatMessage}
                            onInitialMessageSent={() => setInitialChatMessage(undefined)}
                            focusItems={chatFocusItems}
                            onRemoveFocusItem={(id) =>
                                setChatFocusItems((prev) => prev.filter((f) => f.id !== id))
                            }
                            isCompact={false}
                        />
                    </Animated.View>
                )}
            </View>

            {/* Mobile floating overlay — only when not collecting (the chat
                already fills the screen inline in that case). Suppressed
                during loading to avoid the chevron strip flashing in. */}
            {!xl && !isCollecting && !isLoading && (
                <RightSidePanel
                    mode={rightPanelMode}
                    onModeChange={setRightPanelMode}
                    commentsSlot={
                        <CommentsPanel
                            strategyId={strategyId ?? null}
                            onCollapse={() => setRightPanelMode("none")}
                        />
                    }
                    chatSlot={
                        <AIChatPanel
                            module="strategy"
                            contextId={strategyId ?? undefined}
                            initialMessage={initialChatMessage}
                            onInitialMessageSent={() => setInitialChatMessage(undefined)}
                            focusItems={chatFocusItems}
                            onRemoveFocusItem={(id) =>
                                setChatFocusItems((prev) => prev.filter((f) => f.id !== id))
                            }
                            isCompact={screenState === "strategy-ready"}
                            onCollapse={() => setRightPanelMode("none")}
                        />
                    }
                />
            )}

            <StrategiesDrawer
                visible={drawerOpen}
                strategies={strategies}
                activeId={strategyId ?? null}
                onSelect={handleSelectStrategy}
                onClose={() => setDrawerOpen(false)}
            />

            {strategyId && activeStrategy && (
                <CollaboratorsModal
                    visible={showCollaborators}
                    strategyId={strategyId}
                    collaboratorIds={activeStrategy.collaboratorIds}
                    onClose={() => setShowCollaborators(false)}
                />
            )}

            {snippetSelection && (
                <SnippetCommentPopover
                    visible={!!snippetSelection}
                    snippet={snippetSelection.snippet}
                    anchorStart={snippetSelection.anchorStart}
                    anchorEnd={snippetSelection.anchorEnd}
                    onSubmit={handleSnippetCommentSubmit}
                    onDismiss={() => setSnippetSelection(null)}
                />
            )}
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                splitContainer: {
                    flex: 1,
                    flexDirection: "row",
                    overflow: "hidden",
                },
                leftPanel: {
                    overflow: "hidden",
                    position: "relative",
                },
                layered: {
                    ...StyleSheet.absoluteFillObject,
                },
                rightPanel: {
                },
                rightPanelCollapsed: {
                    flex: 0,
                    width: 24,
                },
                fullScreenChat: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                headerBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                },
                headerBtnPrimary: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
                headerBtnPrimaryText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                headerBtnPressed: {
                    opacity: 0.7,
                },
                iconBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                iconBtnActive: {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                },
            }),
        [colors]
    );
}

export default ContentStrategyDetail;
