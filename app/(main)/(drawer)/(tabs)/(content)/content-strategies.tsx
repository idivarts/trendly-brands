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
import { useBreakpoints } from "@/hooks";
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

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

// Toolbar row that sits directly under PageHeader whenever a strategy is
// active. Hosts both the review status (when non-draft) and the high-stakes
// workflow buttons — Invite, Send for Review, Push to Calendar — that used
// to live in the header. Keeps the header itself uncluttered on mobile.
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

const ContentStrategiesScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
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
    // 'chat'     → AI chat panel (default when collecting/generating on desktop)
    // 'comments' → Strategy comments panel
    // 'none'     → collapsed (24px strip on desktop, hidden on mobile)
    // On !xl the panel floats over the page, so we open closed by default.
    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(xl ? "chat" : "none");

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
        setRightPanelMode(xl ? "chat" : "none");
        panelRatio.setValue(0);
    }, [panelRatio, xl]);

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
        outputRange: [1, 2],
    });
    const rightFlex = panelRatio.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 1],
    });

    // Hamburger sits on the LEFT of the title — it's a sibling-document
    // switcher (list of strategies), so it belongs with navigation, not
    // with actions. Visible in every screen state as long as strategies exist.
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

    // Viewing tools: lightweight, navigation-style toggles that affect what
    // the user *sees* but never commit state. Plus the primary "New Strategy"
    // CTA — it stays in row 1 on mobile so the most common action is always
    // a thumb-tap away. Invite/Review/Push-to-Calendar drop to row 2 on !xl
    // via workflowActionButtons below.
    const viewingActionButtons = useMemo(() => {
        const isStrategyReady = screenState === "strategy-ready";
        return [
            activeStrategyId ? (
                <PresenceAvatars key="presence" strategyId={activeStrategyId} />
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
        activeStrategyId,
        rightPanelMode,
        colors,
        styles,
        xl,
        handleCommentsToggle,
        handleChatToggle,
        handleNewStrategy,
    ]);

    // Workflow buttons (Invite, Send for Review, Push to Calendar) now live
    // in StrategyToolbar below — see the JSX after PageHeader. Keeping the
    // header free for navigation-style toggles plus the primary "New" CTA.

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

            {activeStrategy && screenState === "strategy-ready" && (
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
                    <Animated.View style={[styles.leftPanel, { flex: xl ? leftFlex : 1 }]}>
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

                    {/* ── Right: split-pane on desktop; mobile renders as a
                          floating overlay sibling below. ──────────────────── */}
                    {xl && (
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
                    )}
                </View>
            )}

            {/* On mobile, the panel floats over the page as a full-height
                overlay anchored to AppLayout. RightSidePanel returns null when
                closed so nothing renders. */}
            {!xl && (screenState === "collecting" || screenState === "strategy-ready") && (
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
                    borderColor: colors.primary,
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
                iconBtnOutline: {
                    borderColor: colors.primary,
                },
            }),
        [colors]
    );
}

export default ContentStrategiesScreen;
