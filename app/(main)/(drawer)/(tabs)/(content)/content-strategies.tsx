import CollaboratorsModal from "@/components/content-strategy/CollaboratorsModal";
import CommentsPanel from "@/components/content-strategy/CommentsPanel";
import EmptyPromptView from "@/components/content-strategy/EmptyPromptView";
import PresenceAvatars from "@/components/content-strategy/PresenceAvatars";
import SnippetCommentPopover from "@/components/content-strategy/SnippetCommentPopover";
import StrategiesDrawer from "@/components/content-strategy/StrategiesDrawer";
import StrategyEditorPanel from "@/components/content-strategy/StrategyEditorPanel";
import StrategyShimmerPanel from "@/components/content-strategy/StrategyShimmerPanel";
import { ContentStrategy, ReviewStatus, ScreenState } from "@/components/content-strategy/types";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useStrategies } from "@/hooks/use-strategies";
import { useStrategyComments } from "@/hooks/use-strategy-comments";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBars,
    faCalendarDays,
    faCheck,
    faCommentDots,
    faPlus,
    faRobot,
    faRotateLeft,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

// ─── Review Status Banner ─────────────────────────────────────────────────────

interface ReviewBannerProps {
    strategy: ContentStrategy;
    currentManagerId: string;
    onApprove: () => void;
    onRequestChanges: () => void;
    colors: ReturnType<typeof Colors>;
}

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: "transparent", text: "transparent", label: "" },
    in_review: { bg: "rgba(224,122,0,0.1)", text: "#E07A00", label: "Pending Review" },
    approved: { bg: "rgba(26,122,58,0.1)", text: "#1A7A3A", label: "Approved" },
    changes_requested: { bg: "rgba(220,38,38,0.1)", text: "#DC2626", label: "Changes Requested" },
};

const ReviewBanner: React.FC<ReviewBannerProps> = ({
    strategy,
    currentManagerId,
    onApprove,
    onRequestChanges,
    colors,
}) => {
    if (!strategy.reviewStatus || strategy.reviewStatus === "draft") return null;

    const config = REVIEW_STATUS_CONFIG[strategy.reviewStatus];
    const isReviewer =
        strategy.reviewStatus === "in_review" &&
        strategy.collaboratorIds?.includes(currentManagerId) &&
        strategy.reviewRequestedBy !== currentManagerId;

    return (
        <View
            style={{
                backgroundColor: config.bg,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
            }}
        >
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: config.text }}>
                    {config.label}
                </Text>
                {strategy.reviewStatus === "in_review" && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {isReviewer
                            ? "This strategy has been sent to you for review."
                            : "Awaiting review from collaborators."}
                    </Text>
                )}
            </View>
            {isReviewer && (
                <>
                    <Pressable
                        style={({ pressed }) => ({
                            flexDirection: "row" as const,
                            alignItems: "center" as const,
                            gap: 5,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                            backgroundColor: "#1A7A3A",
                            opacity: pressed ? 0.75 : 1,
                        })}
                        onPress={onApprove}
                    >
                        <FontAwesomeIcon icon={faCheck} size={12} color="#fff" />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Approve</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => ({
                            flexDirection: "row" as const,
                            alignItems: "center" as const,
                            gap: 5,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                            backgroundColor: "rgba(220,38,38,0.12)",
                            opacity: pressed ? 0.75 : 1,
                        })}
                        onPress={onRequestChanges}
                    >
                        <FontAwesomeIcon icon={faRotateLeft} size={12} color="#DC2626" />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#DC2626" }}>
                            Request Changes
                        </Text>
                    </Pressable>
                </>
            )}
        </View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const ContentStrategiesScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { manager } = useAuthContext();

    const { strategies, addStrategy, updateStrategyContent, updateReviewStatus, updatePresence } =
        useStrategies();

    const [screenState, setScreenState] = useState<ScreenState>("empty");
    const [strategyContent, setStrategyContent] = useState("");
    const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [chatFocusItems, setChatFocusItems] = useState<FocusItem[]>([]);
    // Initial prompt to send into the AI chat once the strategy + panel mount.
    // The panel owns thread state — we just hand off the first message.
    const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>();

    // ── Right panel — single mode state replaces showComments + chatCollapsed ──
    // 'chat'     → AI chat panel (default when collecting/generating)
    // 'comments' → Strategy comments panel
    // 'none'     → collapsed to 28px handle
    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("chat");

    const [showCollaborators, setShowCollaborators] = useState(false);
    const [snippetSelection, setSnippetSelection] = useState<{
        snippet: string;
        anchorStart: number;
        anchorEnd: number;
    } | null>(null);

    const panelRatio = useRef(new Animated.Value(0)).current;
    const styles = useMemo(() => useStyles(colors), [colors]);

    const activeStrategy = useMemo(
        () => strategies.find((s) => s.id === activeStrategyId) ?? null,
        [strategies, activeStrategyId]
    );

    const { addSnippetComment } = useStrategyComments(activeStrategyId);

    // Presence heartbeat
    useEffect(() => {
        if (!activeStrategyId) return;
        updatePresence(activeStrategyId);
        const interval = setInterval(() => updatePresence(activeStrategyId), 20_000);
        return () => clearInterval(interval);
    }, [activeStrategyId, updatePresence]);

    const handleFirstPromit = useCallback(
        async (prompt: string) => {
            // Create a draft strategy so the AI conversation has a real contextId.
            const newStratId = await addStrategy("New Strategy", "");
            if (!newStratId) return;
            setActiveStrategyId(newStratId);
            setStrategyContent("");
            // Hand the first message off to the panel — it will create the
            // conversation against this strategyId and dispatch the message.
            setInitialChatMessage(prompt);
            setScreenState("strategy-ready");
            Animated.timing(panelRatio, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
            }).start();
        },
        [addStrategy, panelRatio]
    );

    const handleSendToChat = useCallback((text: string) => {
        const label = text.length > 120 ? text.slice(0, 120) + "..." : text;
        setChatFocusItems((prev) => {
            const id = `focus-${Date.now()}`;
            return [...prev, { id, label }];
        });
    }, []);

    const handleNewStrategy = useCallback(() => {
        setScreenState("empty");
        setActiveStrategyId(null);
        setStrategyContent("");
        setChatFocusItems([]);
        setInitialChatMessage(undefined);
        setRightPanelMode("chat");
        panelRatio.setValue(0);
    }, [panelRatio]);

    const handleSelectStrategy = useCallback((strategy: ContentStrategy) => {
        setActiveStrategyId(strategy.id);
        setStrategyContent(strategy.content);
        setScreenState("strategy-ready");
        panelRatio.setValue(1);
    }, []);

    const handleStrategyContentChange = useCallback(
        async (newContent: string) => {
            setStrategyContent(newContent);
            if (activeStrategyId) {
                await updateStrategyContent(activeStrategyId, newContent);
            }
        },
        [activeStrategyId, updateStrategyContent]
    );

    const handleSendForReview = useCallback(async () => {
        if (!activeStrategyId) return;
        await updateReviewStatus(activeStrategyId, "in_review");
    }, [activeStrategyId, updateReviewStatus]);

    const handleApprove = useCallback(async () => {
        if (!activeStrategyId) return;
        await updateReviewStatus(activeStrategyId, "approved", manager?.id);
    }, [activeStrategyId, updateReviewStatus, manager?.id]);

    const handleRequestChanges = useCallback(async () => {
        if (!activeStrategyId) return;
        await updateReviewStatus(activeStrategyId, "changes_requested", manager?.id);
    }, [activeStrategyId, updateReviewStatus, manager?.id]);

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

    // Toggle helpers — tapping the active mode collapses, tapping inactive switches.
    const handleCommentsToggle = useCallback(() => {
        setRightPanelMode((m) => (m === "comments" ? "none" : "comments"));
    }, []);

    const handleChatToggle = useCallback(() => {
        setRightPanelMode((m) => (m === "chat" ? "none" : "chat"));
    }, []);

    const leftFlex = panelRatio.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 3],
    });
    const rightFlex = panelRatio.interpolate({
        inputRange: [0, 1],
        outputRange: [3, 1],
    });

    const headerActionButtons = useMemo(() => {
        const isStrategyReady = screenState === "strategy-ready";
        const reviewStatus = activeStrategy?.reviewStatus ?? "draft";

        return [
            // Presence avatars
            activeStrategyId ? (
                <PresenceAvatars key="presence" strategyId={activeStrategyId} />
            ) : null,

            // 💬 Comments toggle — active state filled when comments panel is open
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

            // 🤖 AI Chat toggle — active state filled when chat panel is open
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

            // Collaborators
            isStrategyReady ? (
                <Pressable
                    key="collaborators"
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.headerBtnPressed]}
                    onPress={() => setShowCollaborators(true)}
                >
                    <FontAwesomeIcon icon={faUserGroup} size={16} color={colors.text} />
                </Pressable>
            ) : null,

            // Send for Review
            isStrategyReady && (reviewStatus === "draft" || reviewStatus === "changes_requested") ? (
                <Pressable
                    key="review"
                    style={({ pressed }) => [styles.headerBtn, styles.headerBtnOutline, pressed && styles.headerBtnPressed]}
                    onPress={handleSendForReview}
                >
                    <Text style={styles.headerBtnOutlineText}>Send for Review</Text>
                </Pressable>
            ) : null,

            // Push to Calendar
            isStrategyReady ? (
                <Pressable
                    key="seal"
                    style={({ pressed }) => [styles.headerBtn, styles.headerBtnOutline, pressed && styles.headerBtnPressed]}
                    onPress={() => { }}
                >
                    <FontAwesomeIcon icon={faCalendarDays} size={14} color={colors.primary} />
                    <Text style={styles.headerBtnOutlineText}>Push to Calendar</Text>
                </Pressable>
            ) : null,

            // New Strategy
            isStrategyReady ? (
                <Pressable
                    key="new"
                    style={({ pressed }) => [styles.headerBtn, styles.headerBtnPrimary, pressed && styles.headerBtnPressed]}
                    onPress={handleNewStrategy}
                >
                    <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
                    <Text style={styles.headerBtnPrimaryText}>New Strategy</Text>
                </Pressable>
            ) : null,

            // Hamburger drawer
            strategies.length > 0 ? (
                <Pressable
                    key="hamburger"
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.headerBtnPressed]}
                    onPress={() => setDrawerOpen(true)}
                >
                    <FontAwesomeIcon icon={faBars} size={18} color={colors.text} />
                </Pressable>
            ) : null,
        ].filter(Boolean) as React.ReactElement[];
    }, [
        screenState,
        strategies.length,
        activeStrategyId,
        activeStrategy?.reviewStatus,
        rightPanelMode,
        colors,
        styles,
        handleNewStrategy,
        handleSendForReview,
        handleCommentsToggle,
        handleChatToggle,
    ]);

    return (
        <AppLayout>
            <PageHeader
                title="Content Strategy"
                subtitle="Form a strategy before putting it in actionable content"
                showBackButton={false}
                actionButtons={headerActionButtons}
                mobileActions="all"
            />

            {activeStrategy && (
                <ReviewBanner
                    strategy={activeStrategy}
                    currentManagerId={manager?.id ?? ""}
                    onApprove={handleApprove}
                    onRequestChanges={handleRequestChanges}
                    colors={colors}
                />
            )}

            {screenState === "empty" && (
                <EmptyPromptView
                    onSubmit={handleFirstPromit}
                    strategies={strategies}
                    onSelectStrategy={handleSelectStrategy}
                />
            )}

            {(screenState === "collecting" || screenState === "strategy-ready") && (
                <View style={styles.splitContainer}>
                    {/* ── Left: editor ─────────────────────────────────────────── */}
                    <Animated.View style={[styles.leftPanel, { flex: leftFlex }]}>
                        {screenState === "collecting" ? (
                            <StrategyShimmerPanel />
                        ) : (
                            <StrategyEditorPanel
                                content={strategyContent}
                                onChange={handleStrategyContentChange}
                                onSendToChat={handleSendToChat}
                                onSnippetComment={handleSnippetComment}
                                strategyId={activeStrategyId ?? undefined}
                            />
                        )}
                    </Animated.View>

                    {/* ── Right: RightSidePanel (comments OR chat) ──────────────── */}
                    <Animated.View style={[
                        styles.rightPanel,
                        { flex: rightFlex },
                        rightPanelMode === "none" ? styles.rightPanelCollapsed : null,
                    ]}>
                        <RightSidePanel
                            mode={rightPanelMode}
                            onModeChange={setRightPanelMode}
                            commentsSlot={
                                <CommentsPanel
                                    strategyId={activeStrategyId}
                                    onCollapse={() => setRightPanelMode("none")}
                                />
                            }
                            chatSlot={
                                <AIChatPanel
                                    module="strategy"
                                    contextId={activeStrategyId ?? undefined}
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
                    </Animated.View>
                </View>
            )}

            <StrategiesDrawer
                visible={drawerOpen}
                strategies={strategies}
                activeId={activeStrategyId}
                onSelect={handleSelectStrategy}
                onClose={() => setDrawerOpen(false)}
            />

            {activeStrategyId && activeStrategy && (
                <CollaboratorsModal
                    visible={showCollaborators}
                    strategyId={activeStrategyId}
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
                },
                rightPanel: {
                    // overflow: visible intentionally omitted — RightSidePanel
                    // owns the shadow; the Animated wrapper just controls flex.
                },
                rightPanelCollapsed: {
                    flex: 0,
                    width: 24,
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
                },
                headerBtnPrimaryText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                headerBtnOutline: {
                    borderWidth: 1,
                    borderColor: colors.primary,
                },
                headerBtnOutlineText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primary,
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

export default ContentStrategiesScreen;
