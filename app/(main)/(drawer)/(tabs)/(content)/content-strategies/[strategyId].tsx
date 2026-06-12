import ChatLoadingPanel from "@/components/content-strategy/ChatLoadingPanel";
import CollaboratorsSection from "@/components/content-strategy/CollaboratorsSection";
import CommentsPanel from "@/components/content-strategy/CommentsPanel";
import PushToCalendarModal, {
    PushToCalendarConfirm,
} from "@/components/content-strategy/PushToCalendarModal";
import PushToCalendarProgressModal from "@/components/content-strategy/PushToCalendarProgressModal";
import SnippetCommentPopover from "@/components/content-strategy/SnippetCommentPopover";
import StrategiesDrawer from "@/components/content-strategy/StrategiesDrawer";
import StrategyEditorPanel from "@/components/content-strategy/StrategyEditorPanel";
import StrategyLoadingPanel from "@/components/content-strategy/StrategyLoadingPanel";
import StrategyShimmerPanel from "@/components/content-strategy/StrategyShimmerPanel";
import ShareModal from "@/components/sharing/ShareModal";
import { ContentStrategy, ScreenState } from "@/components/content-strategy/types";
import { StrategyStatus } from "@/shared-libs/firestore/trendly-pro/models/strategies";
import { formatDateForWebInput } from "@/components/modals/DatePickerModal";
import { useSidebarParam } from "@/components/drawer-layout/use-sidebar-param";
import { useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import { PanelComment } from "@/components/shared/CommentsPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import RightPanelFab from "@/components/shared/RightPanelFab";
import { View } from "@/components/theme/Themed";
import { faCommentDots, faRobot } from "@fortawesome/free-solid-svg-icons";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useBreakpoints } from "@/hooks";
import { EDIT_LOCK_TTL_MS, useStrategies } from "@/hooks/use-strategies";
import { useStrategyComments } from "@/hooks/use-strategy-comments";
import AppLayout from "@/layouts/app-layout";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";

// ─── Main Screen ─────────────────────────────────────────────────────────────
// .replace(/<[^>]*>/g, "").trim()
const hasRealContent = (html: string) => !!html.replace(/<[^>]*>/g, "").trim();

const ContentStrategyDetail = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const { openModal } = useConfirmationModel();
    const { manager } = useAuthContext();
    const { selectedBrand, hasCapability } = useBrandContext();
    const { strategyId, initialPrompt } = useLocalSearchParams<{
        strategyId: string;
        initialPrompt?: string;
    }>();
    useSidebarParam();

    // Auto-collapse the web drawer rail on open so the strategy editor gets the
    // full width. Applied once on mount; the user can re-expand manually after.
    const { setCollapsed: setSidebarCollapsed } = useSidebarCollapsed();
    useEffect(() => {
        setSidebarCollapsed(true);
        // Run strictly once on mount; never fight a later manual toggle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const {
        strategies,
        loading: strategiesLoading,
        duplicateStrategy,
        deleteStrategy,
        updateStrategyContent,
        flushStrategyContent,
        savingStrategyIds,
        updateStrategyName,
        updateReviewStatus,
        updatePresence,
        acquireEditLock,
        refreshEditLock,
        releaseEditLock,
    } = useStrategies();

    // Start in "loading" until Firestore tells us whether this strategy has
    // content. Only then do we resolve to "collecting" or "strategy-ready".

    const [strategyContent, setStrategyContent] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    // Strategy targeted by the drawer's "Share" quick action. Independent of the
    // toolbar's own Share modal (which shares the strategy currently open).
    const [shareStrategy, setShareStrategy] = useState<ContentStrategy | null>(null);
    const canShare = hasCapability("manage_content_strategy") && !!selectedBrand?.id;
    const [chatFocusItems, setChatFocusItems] = useState<FocusItem[]>([]);
    const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(
        initialPrompt
    );

    const [screenState, setScreenState] = useState<ScreenState>("loading");

    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(xl ? "chat" : "none");
    // Measured width of the split row — feeds the RightSidePanel resize bounds.
    const [splitWidth, setSplitWidth] = useState(0);
    const [showPushToCalendar, setShowPushToCalendar] = useState(false);
    // The confirmed push job — drives the WS-backed progress/success modal.
    const [pushJob, setPushJob] = useState<{
        startDate: string;
        durationDays: number;
        overrideExisting: boolean;
    } | null>(null);
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

    const styles = useStyles(colors);

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

    // ── Single-writer edit lock (Phase 3) ──────────────────────────────────
    // Web is the collaborative (CRDT) surface; native is single-writer. A fresh
    // `editLock` means a device is editing → web yields (read-only). Native must
    // tap "Edit" to take the lock, and "Done" releases it (resetting the CRDT so
    // web re-bootstraps from the native-edited content).
    const isWeb = Platform.OS === "web";
    const [holdingLock, setHoldingLock] = useState(false);
    const holdingLockRef = useRef(false);
    useEffect(() => {
        holdingLockRef.current = holdingLock;
    }, [holdingLock]);

    // Re-evaluate lock freshness periodically so a stale lock (closed editor)
    // visibly frees up even without a new Firestore snapshot.
    const [, setLockTick] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setLockTick((t) => t + 1), 10_000);
        return () => clearInterval(i);
    }, []);

    const editLock = activeStrategy?.editLock ?? null;
    const lockFresh = !!editLock && Date.now() - editLock.heartbeatAt < EDIT_LOCK_TTL_MS;
    const lockedByOther = lockFresh && editLock!.managerId !== manager?.id;
    const lockedByName = lockedByOther ? editLock!.name : null;

    const handleRequestEdit = useCallback(async () => {
        if (!strategyId) return;
        const ok = await acquireEditLock(strategyId);
        if (ok) setHoldingLock(true);
        else Toaster.error("Someone's editing", "This strategy is being edited on another device.");
    }, [strategyId, acquireEditLock]);

    const handleEndEdit = useCallback(async () => {
        if (!strategyId) return;
        setHoldingLock(false);
        await releaseEditLock(strategyId, true);
    }, [strategyId, releaseEditLock]);

    // Heartbeat the lock while we hold it (native).
    useEffect(() => {
        if (!holdingLock || !strategyId) return;
        const i = setInterval(() => refreshEditLock(strategyId), 10_000);
        return () => clearInterval(i);
    }, [holdingLock, strategyId, refreshEditLock]);

    // Release the lock (and reset the CRDT) if we leave while still holding it.
    useEffect(() => {
        return () => {
            if (holdingLockRef.current && strategyId) {
                void releaseEditLock(strategyId, true);
            }
        };
    }, [strategyId, releaseEditLock]);

    // ── Editor refresh generation ───────────────────────────────────────────
    // Bumping this remounts the editor so it re-reads the strategy body from
    // scratch (web re-bootstraps the CRDT; native re-seeds its uncontrolled
    // input). Without it, a body replaced out-of-band — by an AI action or
    // another device — wasn't visible until a full app reload (Notion
    // 37b42d5f…1503534).
    const [editorGen, setEditorGen] = useState(0);
    const bumpEditor = useCallback(() => setEditorGen((g) => g + 1), []);

    // The last body THIS device emitted, so we can tell our own echo apart from
    // a genuine external rewrite (used by the native trigger below).
    const lastEmittedRef = useRef<string | null>(null);

    // (a) A device's native single-writer lock was released or expired → the
    // body may have changed while we were read-only; re-read it.
    const prevLockedByOther = useRef(lockedByOther);
    useEffect(() => {
        if (prevLockedByOther.current && !lockedByOther) bumpEditor();
        prevLockedByOther.current = lockedByOther;
    }, [lockedByOther, bumpEditor]);

    // (b) An AI action (or any server rewrite) replaced the doc. The backend
    // writes markdownContent and clears `crdtInitialized` in one atomic update,
    // so a true→false transition is a reliable, co-editing-safe signal that the
    // live editor must re-bootstrap. (Live human co-edits never touch it.)
    const crdtInitialized = activeStrategy?.crdtInitialized;
    const prevCrdtInit = useRef(crdtInitialized);
    useEffect(() => {
        if (prevCrdtInit.current === true && crdtInitialized === false) bumpEditor();
        prevCrdtInit.current = crdtInitialized;
    }, [crdtInitialized, bumpEditor]);

    // (c) Native fallback: the editor input is uncontrolled and a native-only
    // strategy may never have set `crdtInitialized`, so also remount when the
    // server body changes to something this device didn't type and isn't
    // mid-editing. (Native is single-writer, so there's no live co-editing to
    // disrupt.)
    const serverContent = activeStrategy?.content ?? "";
    const prevServerContent = useRef<string | null>(null);
    useEffect(() => {
        if (isWeb) {
            prevServerContent.current = serverContent;
            return;
        }
        if (prevServerContent.current === null) {
            prevServerContent.current = serverContent;
            return;
        }
        if (serverContent === prevServerContent.current) return;
        const isOwnEcho = serverContent === lastEmittedRef.current;
        prevServerContent.current = serverContent;
        if (!holdingLock && !isOwnEcho) bumpEditor();
    }, [isWeb, serverContent, holdingLock, bumpEditor]);

    // Finalized (pushed to calendar) is a terminal lock: the document and the
    // AI chat go read-only and the only way forward is to duplicate. It takes
    // precedence over the collaborative single-writer lock.
    const isFinalized = activeStrategy?.status === StrategyStatus.Finalized;

    const editorEditable = !isFinalized && (isWeb ? !lockedByOther : holdingLock);
    const editorLock = useMemo(
        () => ({
            editable: editorEditable,
            lockedByName,
            onRequestEdit:
                !isFinalized && !isWeb && !lockedByOther && !holdingLock ? handleRequestEdit : undefined,
            onEndEdit: !isWeb && holdingLock ? handleEndEdit : undefined,
            finalized: isFinalized,
        }),
        [editorEditable, lockedByName, isWeb, lockedByOther, holdingLock, isFinalized, handleRequestEdit, handleEndEdit]
    );

    const handleSendToChat = useCallback((text: string) => {
        const label = text.length > 120 ? text.slice(0, 120) + "..." : text;
        setChatFocusItems((prev) => {
            const id = `focus-${Date.now()}`;
            return [...prev, { id, label }];
        });
    }, []);

    // "Send to AI" on a comment: focus its text in the chat and open the panel.
    const handleCommentToChat = useCallback(
        (comment: PanelComment) => {
            handleSendToChat(comment.text);
            setRightPanelMode("chat");
        },
        [handleSendToChat]
    );

    const handleNewStrategy = useCallback(() => {
        router.push("/(main)/(drawer)/(tabs)/(content)/content-strategies" as any);
    }, [router]);

    // Duplicate into a fresh, editable copy and open it. This is the iteration
    // path for a finalized (locked) strategy — the original stays read-only.
    const handleDuplicate = useCallback(async () => {
        if (!strategyId) return;
        const newId = await duplicateStrategy(strategyId);
        if (!newId) {
            Toaster.error("Couldn't duplicate", "Please try again.");
            return;
        }
        Toaster.success("Strategy duplicated", "Opened an editable copy.");
        router.push({
            pathname: "/(main)/(drawer)/(tabs)/(content)/content-strategies/[strategyId]" as any,
            params: { strategyId: newId },
        });
    }, [strategyId, duplicateStrategy, router]);

    // Back to the strategies listing. `navigate` (not `push`) collapses the
    // stack so we don't pile detail screens on top of each other.
    const handleBack = useCallback(() => {
        router.navigate("/(main)/(drawer)/(tabs)/(content)/content-strategies" as any);
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

    // Drawer quick-action: duplicate any listed strategy and open the copy.
    const handleDuplicateStrategy = useCallback(
        async (strategy: ContentStrategy) => {
            const newId = await duplicateStrategy(strategy.id);
            if (!newId) {
                Toaster.error("Couldn't duplicate", "Please try again.");
                return;
            }
            Toaster.success("Strategy duplicated", `A copy of "${strategy.title}" was created.`);
            router.push({
                pathname: "/(main)/(drawer)/(tabs)/(content)/content-strategies/[strategyId]" as any,
                params: { strategyId: newId },
            });
        },
        [duplicateStrategy, router]
    );

    // Drawer quick-action: open the public share modal for the chosen strategy.
    const handleShareStrategy = useCallback((strategy: ContentStrategy) => {
        setShareStrategy(strategy);
    }, []);

    // Drawer quick-action: confirm, then permanently delete. If we just deleted
    // the strategy currently open, fall back to the listing.
    const handleDeleteStrategy = useCallback(
        (strategy: ContentStrategy) => {
            openModal({
                title: "Delete strategy?",
                description: `"${strategy.title}" will be permanently deleted. This is an irreversible action and cannot be undone.`,
                confirmText: "Delete Strategy",
                cancelText: "Cancel",
                confirmAction: async () => {
                    const ok = await deleteStrategy(strategy.id);
                    if (!ok) {
                        Toaster.error("Couldn't delete", "Please try again.");
                        return;
                    }
                    Toaster.success("Strategy deleted", `"${strategy.title}" was removed.`);
                    if (strategy.id === strategyId) {
                        router.navigate(
                            "/(main)/(drawer)/(tabs)/(content)/content-strategies" as any
                        );
                    }
                },
            });
        },
        [openModal, deleteStrategy, strategyId, router]
    );

    const handleStrategyContentChange = useCallback(
        async (newContent: string) => {
            // Remember what we emitted so the native refresh trigger can tell our
            // own snapshot echo apart from an external rewrite.
            lastEmittedRef.current = newContent;
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
        handleStrategyContentChange("<html><p>Write your strategy here</p></html>");
    }, [handleStrategyContentChange]);

    // Ctrl+S in the toolbar dispatches `trendly:strategy-save-now`. The editor
    // listens too (to flush buffered Yjs deltas and re-emit the canonical
    // HTML); here we cancel any pending 1.5s autosave debounce and commit
    // markdownContent to Firestore immediately so the converged CRDT state
    // lands on the main field without delay.
    useEffect(() => {
        if (Platform.OS !== "web" || !strategyId) return;
        const onSaveNow = () => {
            void flushStrategyContent(strategyId);
        };
        window.addEventListener("trendly:strategy-save-now", onSaveNow);
        return () => window.removeEventListener("trendly:strategy-save-now", onSaveNow);
    }, [strategyId, flushStrategyContent]);

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

    const handleRename = useCallback((name: string) => {
        if (strategyId) updateStrategyName(strategyId, name);
    }, [strategyId, updateStrategyName]);

    // Confirmed "Push to Calendar": hand off to the WS-backed progress modal.
    // The generation is heavy AI work that can exceed the 30s HTTP limit, so it
    // runs over the WebSocket with a live loader instead of a blocking request.
    const handlePushToCalendarConfirm = useCallback(
        (opts: PushToCalendarConfirm) => {
            setShowPushToCalendar(false);
            const startDate = formatDateForWebInput(opts.startDate);
            if (!strategyId || !selectedBrand?.id) return;
            setPushJob({
                startDate,
                durationDays: opts.durationDays,
                overrideExisting: opts.overrideExisting,
            });
        },
        [strategyId, selectedBrand?.id]
    );

    // Success CTA from the progress modal — close it and land on the calendar at
    // the campaign's start month.
    const handleViewCalendarFromPush = useCallback(
        (focusDate: string) => {
            setPushJob(null);
            router.push({
                pathname: "/(main)/(drawer)/(tabs)/(content)/content-calendar" as any,
                params: { focusDate },
            });
        },
        [router]
    );

    // Re-derive the campaign length from the (possibly hand-edited) strategy body.
    const handleRefreshDuration = useCallback(async (): Promise<number | null> => {
        const brandId = selectedBrand?.id;
        if (!strategyId || !brandId) return activeStrategy?.durationDays ?? null;

        try {
            const res = await HttpWrapper.fetch(
                `/api/content-strategy/${strategyId}/recheck-duration`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brandId }),
                }
            );
            const data = await res.json();
            return typeof data.durationDays === "number" ? data.durationDays : null;
        } catch {
            // Endpoint hiccup → keep the recorded duration rather than blocking.
            return activeStrategy?.durationDays ?? null;
        }
    }, [strategyId, selectedBrand?.id, activeStrategy?.durationDays]);

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
    const mobileChatOpacity = transitionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    return (
        <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
            <View
                style={styles.splitContainer}
                onLayout={(e) => setSplitWidth(e.nativeEvent.layout.width)}
            >
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
                                    key={`editor-${strategyId}-${editorGen}`}
                                    content={strategyContent}
                                    onChange={handleStrategyContentChange}
                                    onSendToChat={handleSendToChat}
                                    onSnippetComment={handleSnippetComment}
                                    strategyId={strategyId ?? undefined}
                                    collaborative
                                    lock={editorLock}

                                    toolbar={activeStrategy ? {
                                        strategy: activeStrategy,
                                        currentManagerId: manager?.id ?? "",
                                        xl,
                                        onApprove: handleApprove,
                                        onRequestChanges: handleRequestChanges,
                                        onSendForReview: handleSendForReview,
                                        onPushToCalendar: () => setShowPushToCalendar(true),
                                        onDuplicate: handleDuplicate,
                                        onRename: handleRename,
                                        onOpenDrawer: strategies.length > 0 ? () => setDrawerOpen(true) : undefined,
                                        onNewStrategy: handleNewStrategy,
                                        onBack: handleBack,
                                        saveState: strategyId && savingStrategyIds.has(strategyId)
                                            ? "unsaved"
                                            : "saved",
                                    } : undefined}
                                />
                            </Animated.View>
                        )}
                    </Animated.View>
                )}

                {/* ── Right: split-pane on desktop. During loading we show a
                      chat-bubble skeleton instead of mounting the real chat
                      so we don't trigger network calls before we know which
                      state to land in. ─────────────────────────────────── */}
                {xl && (() => {
                    // Once the strategy has settled (not loading / not collecting)
                    // the RightSidePanel owns its own width — drag-to-resize or the
                    // 44px rail — so the wrapper just hugs it. While loading or
                    // collecting we keep the animated flex transition (7→1) and
                    // disable resizing so the two don't fight.
                    const isSettled = !isCollecting && !isLoading;
                    return (
                        <Animated.View
                            style={[
                                styles.rightPanel,
                                isSettled
                                    ? styles.rightPanelSettled
                                    : { flex: rightFlex },
                            ]}
                        >
                            {isLoading ? (
                                <ChatLoadingPanel animating />
                            ) : (
                                <RightSidePanel
                                    mode={isCollecting ? "chat" : rightPanelMode}
                                    onModeChange={isCollecting ? () => { } : setRightPanelMode}
                                    containerWidth={splitWidth}
                                    resizable={isSettled}
                                    // While collecting the chat is pinned open
                                    // (onModeChange is a no-op) — don't offer a
                                    // collapse chevron that wouldn't do anything.
                                    collapsible={!isCollecting}
                                    // Comments aren't available during collecting —
                                    // suppressing the slot also hides the rail icon
                                    // so users don't tap a no-op control.
                                    // Desktop path — the rail's chevron handles
                                    // collapse, so the slot headers don't render
                                    // their own. (Mobile mount still passes
                                    // onCollapse below for the in-sheet chevron.)
                                    commentsSlot={
                                        isCollecting ? undefined : (
                                            <CommentsPanel
                                                strategyId={strategyId ?? null}
                                                onSendToAI={handleCommentToChat}
                                            />
                                        )
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
                                            readOnly={isFinalized}
                                            isCompact={screenState === "strategy-ready"}
                                        />
                                    }
                                />
                            )}
                        </Animated.View>
                    );
                })()}

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
                            readOnly={isFinalized}
                            isCompact={false}
                            // AppLayout (this screen) already insets top+bottom,
                            // so the panel must not add the safe area again.
                            parentHandlesSafeArea
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
                            onSendToAI={handleCommentToChat}
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
                            readOnly={isFinalized}
                            isCompact={screenState === "strategy-ready"}
                            onCollapse={() => setRightPanelMode("none")}
                            // Sheet sits inside this screen's AppLayout, which
                            // already insets top+bottom — don't double it.
                            parentHandlesSafeArea
                        />
                    }
                />
            )}

            {/* Mobile: open Comments / AI Chat from a bottom-right speed-dial FAB.
                Only in the strategy-ready state — while collecting the chat already
                fills the screen. bottomOffset clears the 70px bottom tab bar. */}
            {!xl && !isCollecting && !isLoading && (
                <RightPanelFab
                    mode={rightPanelMode}
                    onModeChange={setRightPanelMode}
                    bottomOffset={70}
                    actions={[
                        { mode: "comments", icon: faCommentDots, label: "Comments" },
                        { mode: "chat", icon: faRobot, label: "AI Chat" },
                    ]}
                />
            )}

            <StrategiesDrawer
                visible={drawerOpen}
                strategies={strategies}
                activeId={strategyId ?? null}
                onSelect={handleSelectStrategy}
                onClose={() => setDrawerOpen(false)}
                onDuplicate={handleDuplicateStrategy}
                onDelete={handleDeleteStrategy}
                onShare={canShare ? handleShareStrategy : undefined}
            />

            {shareStrategy && selectedBrand?.id && (
                <ShareModal
                    visible={!!shareStrategy}
                    target={{
                        type: "strategy",
                        brandId: selectedBrand.id,
                        resourceId: shareStrategy.id,
                    }}
                    title={shareStrategy.title || "Untitled strategy"}
                    onClose={() => setShareStrategy(null)}
                    extraSection={
                        <CollaboratorsSection
                            strategyId={shareStrategy.id}
                            collaboratorIds={shareStrategy.collaboratorIds ?? []}
                        />
                    }
                />
            )}

            {activeStrategy && (
                <PushToCalendarModal
                    visible={showPushToCalendar}
                    strategyTitle={activeStrategy.title}
                    durationDays={activeStrategy.durationDays}
                    onClose={() => setShowPushToCalendar(false)}
                    onConfirm={handlePushToCalendarConfirm}
                    onRefreshDuration={handleRefreshDuration}
                />
            )}

            {pushJob && selectedBrand?.id && strategyId && (
                <PushToCalendarProgressModal
                    visible={!!pushJob}
                    brandId={selectedBrand.id}
                    strategyId={strategyId}
                    startDate={pushJob.startDate}
                    durationDays={pushJob.durationDays}
                    overrideExisting={pushJob.overrideExisting}
                    onClose={() => setPushJob(null)}
                    onViewCalendar={handleViewCalendarFromPush}
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
                rightPanelSettled: {
                    // Settled: the panel owns its width (drag-to-resize / 44px
                    // rail); the wrapper hugs it without growing or shrinking.
                    flexShrink: 0,
                },
                fullScreenChat: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
            }),
        [colors]
    );
}

export default ContentStrategyDetail;
