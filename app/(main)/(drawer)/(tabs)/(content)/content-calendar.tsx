import AddContentModal, { AddContentExtras } from "@/components/content-calendar/AddContentModal";
import ContentDetailsModal from "@/components/content-calendar/ContentDetailsModal";
import CalendarCommentsPanel from "@/components/content-calendar/CalendarCommentsPanel";
import EmptyCalendarView from "@/components/content-calendar/EmptyCalendarView";
import MonthView from "@/components/content-calendar/MonthView";
import WeekView from "@/components/content-calendar/WeekView";
import { CalendarItem, CalendarView } from "@/components/content-calendar/types";
import { ContentItem } from "@/components/contents/types";
import { useSidebarParam } from "@/components/drawer-layout/use-sidebar-param";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import { PanelComment } from "@/components/shared/CommentsPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import RightPanelFab from "@/components/shared/RightPanelFab";
import ShareButton from "@/components/sharing/ShareButton";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { GUIDE_TOUR_CALENDAR_MOBILE, GUIDE_TOUR_CALENDAR_WEB } from "@/components/guide-tour/guide-tour-config";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useContents } from "@/hooks/use-contents";
import { useFeatureTour } from "@/hooks/use-feature-tour";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCommentDots,
    faPlus,
    faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { parseWebInputDate } from "@/components/modals/DatePickerModal";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

const CALENDAR_WELCOME =
    "Hi! I'm your AI Content Expert. Select items from the calendar and send them here — I can help you rewrite, rethink, or bulk-edit your content plan.";

// One chat thread per CALENDAR MONTH. brandId scopes the conversation query and
// a `calendar-YYYY-MM` contextId scopes it further to the month currently in
// view — so each month keeps its own conversation/memory, and the backend reads
// the month out of the contextId to load that month's posts + today's date into
// the AI's context (so the model knows what "today" is relative to the items).
const calendarContextId = (year: number, month0: number) =>
    `calendar-${year}-${String(month0 + 1).padStart(2, "0")}`;

const ContentCalendarScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    // Measured width of the split row — feeds the RightSidePanel resize bounds.
    const [splitWidth, setSplitWidth] = useState(0);
    const router = useRouter();
    const { hasCapability, selectedBrand } = useBrandContext();
    useSidebarParam();
    const canManageContent = hasCapability("manage_content");
    const styles = useStyles(colors, xl);

    const { items: allContents, addContent, updateContent } = useContents();
    const items = useMemo<CalendarItem[]>(
        () => allContents.filter((i) => !!i.date && !i.isArchived),
        [allContents]
    );

    // `focusDate` (YYYY-MM-DD) lands the calendar on a specific month — e.g. when
    // arriving from "Push strategy to calendar" with the chosen start date.
    const { focusDate } = useLocalSearchParams<{ focusDate?: string }>();
    const focusParsed = useMemo(
        () => (focusDate ? parseWebInputDate(focusDate) : null),
        [focusDate]
    );

    const today = new Date();
    // Weekly is the readable default on phones — month cells become unreadable
    // squares below ~600px. Desktop keeps month overview.
    const [calView, setCalView] = useState<CalendarView>(xl ? "month" : "week");
    const [calYear, setCalYear] = useState(focusParsed?.getFullYear() ?? today.getFullYear());
    const [calMonth, setCalMonth] = useState(focusParsed?.getMonth() ?? today.getMonth());

    // Re-focus the month if we navigate here again with a different focusDate.
    useEffect(() => {
        if (!focusParsed) return;
        setCalYear(focusParsed.getFullYear());
        setCalMonth(focusParsed.getMonth());
    }, [focusParsed]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [addInitialDate, setAddInitialDate] = useState<string | undefined>();
    // How the modal was opened decides its date UI. Only the per-week "+" button
    // carries a real week context ("week" → day-of-week pills); the generic top
    // "Add Content" button has no week, so it falls back to the default date
    // picker ("month") even while the calendar is in week view.
    const [addSource, setAddSource] = useState<"week" | "month">("month");

    // Item whose short-details preview modal is open (tapping a content card).
    const [detailItem, setDetailItem] = useState<ContentItem | null>(null);

    // ── Right panel ───────────────────────────────────────────────────────────
    // 'chat'     → AI chat panel (desktop default)
    // 'comments' → Calendar comments panel (month or item level)
    // 'none'     → collapsed; on mobile the panel floats over the page when open
    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(xl ? "chat" : "none");

    // Which content item's comments are currently in focus.
    // null = month-level comments; set = item-level comments.
    const [selectedCommentItem, setSelectedCommentItem] = useState<CalendarItem | null>(null);

    const [focusItems, setFocusItems] = useState<FocusItem[]>([]);

    const hasItems = items.length > 0;

    // Coach mark: teach the view toggle + AI chat/comments once the calendar
    // has content (the rail/FAB anchors only mount when hasItems is true).
    useFeatureTour({
        feature: "calendar",
        ready: hasItems,
        web: GUIDE_TOUR_CALENDAR_WEB,
        mobile: GUIDE_TOUR_CALENDAR_MOBILE,
    });

    // Sending an item to chat: focuses it in the chat panel and opens chat if closed.
    const handleFocusChat = useCallback((item: CalendarItem) => {
        const label = item.title.length > 80 ? item.title.slice(0, 80) + "..." : item.title;
        // Carry the post's id (+ date/type) to the AI so calendar tools can act on
        // this exact item; the chip itself still shows just the title.
        const contextText = `Focused post [id:${item.id}] "${item.title}" (${item.type}, ${item.date})`;
        setFocusItems((prev) => {
            if (prev.find((f) => f.id === item.id)) return prev;
            return [...prev, { id: item.id, label, contextText }];
        });
        setRightPanelMode("chat");
    }, []);

    // Tapping the 💬 icon on a content chip: opens item-level comments.
    const handleComment = useCallback((item: CalendarItem) => {
        setSelectedCommentItem(item);
        setRightPanelMode("comments");
    }, []);

    // "Send to AI" on a comment: focus its text in the chat panel and open chat.
    // Comments live either at month level or on a specific content item; we tell
    // the AI which, and (for item comments) the post's id so it can act on it.
    const handleSendCommentToAI = useCallback(
        (comment: PanelComment) => {
            const label =
                comment.text.length > 80 ? comment.text.slice(0, 80) + "..." : comment.text;
            const target = selectedCommentItem
                ? `on post [id:${selectedCommentItem.id}] "${selectedCommentItem.title}"`
                : "on the calendar month";
            const contextText = `Comment ${target}: "${comment.text}"`;
            setFocusItems((prev) => [
                ...prev,
                { id: `comment-${comment.id}-${Date.now()}`, label, contextText },
            ]);
            setRightPanelMode("chat");
        },
        [selectedCommentItem]
    );

    // Tapping a content chip body: first show a short-details preview modal.
    // Resolve the full ContentItem (the calendar list is widened to CalendarItem,
    // but the preview needs status + platforms) by id.
    const handleOpenItem = useCallback(
        (item: CalendarItem) => {
            setDetailItem(allContents.find((c) => c.id === item.id) ?? null);
        },
        [allContents]
    );

    // From the preview modal: navigate to the full content page for editing.
    const handleGoToContentPage = useCallback(
        (item: CalendarItem) => {
            setDetailItem(null);
            router.push({
                pathname:
                    "/(main)/(drawer)/(tabs)/(content)/contents/[contentId]" as any,
                params: { contentId: item.id },
            });
        },
        [router]
    );

    const handleAddItem = useCallback(
        async (newItem: Omit<CalendarItem, "id">, extras: AddContentExtras) => {
            await addContent(newItem, { platforms: extras.platforms });
        },
        [addContent]
    );

    const handleOpenAddModal = useCallback(
        (date?: string, source: "week" | "month" = "month") => {
            setAddInitialDate(date);
            setAddSource(source);
            setShowAddModal(true);
        },
        []
    );

    // Drag a content card onto another day (month view, desktop). Persisting the
    // new postingTimeStamp re-fires the Firestore snapshot, so the chip lands on
    // the new day with no manual optimistic state. Midnight UTC mirrors how
    // AddContentModal places new items (see toIContent in use-contents).
    const handleMoveItem = useCallback(
        async (itemId: string, newDate: string) => {
            // Scheduled / posted content is locked — its posting date can't be
            // changed by dragging. Unschedule (or it's already posted) first.
            const moved = allContents.find((c) => c.id === itemId);
            if (moved && (moved.status === "scheduled" || moved.status === "posted")) {
                return;
            }
            const postingTimeStamp = new Date(newDate + "T00:00:00Z").getTime();
            try {
                await updateContent(itemId, { postingTimeStamp });
            } catch (err) {
                console.warn("Failed to move content to new day", err);
            }
        },
        [updateContent, allContents]
    );

    const headerActionButtons = useMemo(
        () => [
            // Comments + AI Chat moved to the mobile RightPanelFab (bottom-right);
            // desktop keeps them in the RightSidePanel rail.

            // 🔗 Share this month (read-only public link)
            selectedBrand?.id ? (
                <ShareButton
                    key="share"
                    canShare={canManageContent}
                    target={{
                        type: "calendarMonth",
                        brandId: selectedBrand.id,
                        month: `${calYear}-${String(calMonth + 1).padStart(2, "0")}`,
                    }}
                    title={new Date(calYear, calMonth, 1).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                    })}
                />
            ) : null,

            // Add content
            hasItems && canManageContent ? (
                <Pressable
                    key="add"
                    style={({ pressed }) => [
                        xl ? styles.addBtn : styles.iconBtnPrimary,
                        pressed && styles.addBtnPressed,
                    ]}
                    onPress={() => handleOpenAddModal()}
                    accessibilityLabel="Add Content"
                >
                    <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
                    {xl && <Text style={styles.addBtnText}>Add Content</Text>}
                </Pressable>
            ) : null,
        ].filter(Boolean) as React.ReactElement[],
        [hasItems, canManageContent, colors, handleOpenAddModal, styles, xl, selectedBrand?.id, calYear, calMonth]
    );

    // Slot chevrons are intentionally not wired — desktop uses the rail's
    // chevron and mobile uses the scrim-tap-to-close affordance.
    const rightSidePanel = (
        <RightSidePanel
            mode={rightPanelMode}
            onModeChange={setRightPanelMode}
            containerWidth={splitWidth}
            chatAnchorId="gt-calendar-ai-chat"
            commentsAnchorId="gt-calendar-comments"
            commentsSlot={
                <CalendarCommentsPanel
                    year={calYear}
                    month={calMonth}
                    selectedItem={selectedCommentItem}
                    onClearSelectedItem={() => setSelectedCommentItem(null)}
                    onSendToAI={handleSendCommentToAI}
                />
            }
            chatSlot={
                <AIChatPanel
                    module="calendar"
                    contextId={calendarContextId(calYear, calMonth)}
                    focusItems={focusItems}
                    onRemoveFocusItem={(id) =>
                        setFocusItems((prev) => prev.filter((f) => f.id !== id))
                    }
                    isCompact
                    welcomeText={CALENDAR_WELCOME}
                    placeholder="Ask the AI Expert..."
                    // Tab bar owns the bottom inset (don't double it), but this
                    // screen's AppLayout does NOT inset the top — so the panel must
                    // keep its own top inset for the header to clear the status bar.
                    parentHandlesSafeBottom
                />
            }
        />
    );

    return (
        <AppLayout>
            <PageHeader
                title={xl ? "Content Calendar" : "Calendar"}
                subtitle="Plan and visualise your entire content schedule"
                showBackButton={false}
                actionButtons={headerActionButtons}
                mobileActions="all"
            />

            {!hasItems ? (
                <EmptyCalendarView
                    onCreateStrategy={() =>
                        router.push("/(main)/(drawer)/(tabs)/(content)/content-strategies" as any)
                    }
                    onCreateItem={() => handleOpenAddModal()}
                />
            ) : (
                <View
                    style={styles.splitContainer}
                    onLayout={(e) => setSplitWidth(e.nativeEvent.layout.width)}
                >
                    {/* ── Left: calendar grid ───────────────────────────────────── */}
                    <View style={styles.calendarPanel}>
                        {calView === "week" ? (
                            <WeekView
                                year={calYear}
                                month={calMonth}
                                items={items}
                                view={calView}
                                onViewChange={setCalView}
                                onMonthChange={(y, m) => {
                                    setCalYear(y);
                                    setCalMonth(m);
                                }}
                                onAddWeek={(weekStartDate) =>
                                    handleOpenAddModal(weekStartDate, "week")
                                }
                                onFocusChat={handleFocusChat}
                                onComment={handleComment}
                                onOpenItem={handleOpenItem}
                            />
                        ) : (
                            <MonthView
                                year={calYear}
                                month={calMonth}
                                items={items}
                                view={calView}
                                onViewChange={setCalView}
                                onMonthChange={(y, m) => {
                                    setCalYear(y);
                                    setCalMonth(m);
                                }}
                                onDayPress={(dateStr) => handleOpenAddModal(dateStr)}
                                onFocusChat={handleFocusChat}
                                onComment={handleComment}
                                onOpenItem={handleOpenItem}
                                onMoveItem={
                                    canManageContent ? handleMoveItem : undefined
                                }
                            />
                        )}
                    </View>

                    {/* ── Right: split-pane on desktop only. Mobile uses the
                          floating overlay rendered below. ──────────────────── */}
                    {xl && (
                        <View style={styles.rightPanel}>
                            {rightSidePanel}
                        </View>
                    )}
                </View>
            )}

            {!xl && hasItems && rightSidePanel}

            {/* Mobile: panel surfaces live in a bottom-right speed-dial FAB.
                bottomOffset clears the 70px bottom tab bar. */}
            {!xl && hasItems && (
                <RightPanelFab
                    mode={rightPanelMode}
                    onModeChange={setRightPanelMode}
                    bottomOffset={70}
                    anchorId="gt-calendar-fab"
                    actions={[
                        { mode: "comments", icon: faCommentDots, label: "Comments" },
                        { mode: "chat", icon: faRobot, label: "AI Chat" },
                    ]}
                />
            )}

            <AddContentModal
                visible={showAddModal}
                initialDate={addInitialDate}
                source={addSource}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
            />

            <ContentDetailsModal
                visible={!!detailItem}
                item={detailItem}
                onClose={() => setDetailItem(null)}
                onOpenContentPage={handleGoToContentPage}
                onAddComment={(item) => {
                    setDetailItem(null);
                    handleComment(item);
                }}
                onSendToAI={(item) => {
                    setDetailItem(null);
                    handleFocusChat(item);
                }}
            />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return useMemo(
        () =>
            StyleSheet.create({
                splitContainer: {
                    flex: 1,
                    flexDirection: "row",
                },
                calendarPanel: {
                    flex: 1,
                    overflow: "hidden",
                },
                rightPanel: {
                    // The panel owns its own width (drag-to-resize / 44px rail);
                    // this wrapper just hugs it without growing or shrinking.
                    // overflow visible so RightSidePanel's shadow renders unclipped.
                    flexShrink: 0,
                },
                iconBtn: {
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                iconBtnActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                iconBtnPressed: { opacity: 0.75 },
                iconBtnPrimary: {
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                addBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 13,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                addBtnPressed: { opacity: 0.75 },
                addBtnText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default ContentCalendarScreen;
