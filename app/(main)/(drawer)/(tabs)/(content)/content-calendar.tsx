import AddContentModal from "@/components/content-calendar/AddContentModal";
import CalendarCommentsPanel from "@/components/content-calendar/CalendarCommentsPanel";
import EmptyCalendarView from "@/components/content-calendar/EmptyCalendarView";
import MonthView from "@/components/content-calendar/MonthView";
import WeekView from "@/components/content-calendar/WeekView";
import { CalendarItem, CalendarView } from "@/components/content-calendar/types";
import AIChatPanel, { FocusItem } from "@/components/shared/AIChatPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useContents } from "@/hooks/use-contents";
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

// One stable chat per brand for the Calendar module. brandId already scopes the
// conversation query, so a constant contextId keeps the calendar on a single
// thread regardless of which item (if any) is selected.
const CALENDAR_CONTEXT_ID = "calendar";

const ContentCalendarScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const { hasCapability } = useBrandContext();
    const canManageContent = hasCapability("manage_content");
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const { items: allContents, addContent } = useContents();
    const items = useMemo<CalendarItem[]>(
        () => allContents.filter((i) => !!i.date),
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

    // Sending an item to chat: focuses it in the chat panel and opens chat if closed.
    const handleFocusChat = useCallback((item: CalendarItem) => {
        const label = item.title.length > 80 ? item.title.slice(0, 80) + "..." : item.title;
        setFocusItems((prev) => {
            if (prev.find((f) => f.id === item.id)) return prev;
            return [...prev, { id: item.id, label }];
        });
        setRightPanelMode("chat");
    }, []);

    // Tapping the 💬 icon on a content chip: opens item-level comments.
    const handleComment = useCallback((item: CalendarItem) => {
        setSelectedCommentItem(item);
        setRightPanelMode("comments");
    }, []);

    // Tapping a content chip body: opens the content details page for editing.
    const handleOpenItem = useCallback(
        (item: CalendarItem) => {
            router.push({
                pathname:
                    "/(main)/(drawer)/(tabs)/(content)/contents/[contentId]" as any,
                params: { contentId: item.id },
            });
        },
        [router]
    );

    const handleAddItem = useCallback(
        async (newItem: Omit<CalendarItem, "id">) => {
            await addContent(newItem);
        },
        [addContent]
    );

    const handleOpenAddModal = useCallback((date?: string) => {
        setAddInitialDate(date);
        setShowAddModal(true);
    }, []);

    // Toggle helpers — tapping the active mode collapses; tapping inactive switches.
    const handleCommentsToggle = useCallback(() => {
        setRightPanelMode((m) => (m === "comments" ? "none" : "comments"));
    }, []);

    const handleChatToggle = useCallback(() => {
        setRightPanelMode((m) => (m === "chat" ? "none" : "chat"));
    }, []);

    const headerActionButtons = useMemo(
        () => [
            // 💬 Comments toggle — mobile only; desktop lives in the RightSidePanel rail
            !xl ? (
                <Pressable
                    key="comments"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "comments" && styles.iconBtnActive,
                        pressed && styles.iconBtnPressed,
                    ]}
                    onPress={handleCommentsToggle}
                >
                    <FontAwesomeIcon
                        icon={faCommentDots}
                        size={15}
                        color={rightPanelMode === "comments" ? colors.onPrimary : colors.textSecondary}
                    />
                </Pressable>
            ) : null,

            // 🤖 AI Chat toggle — mobile only; desktop lives in the RightSidePanel rail
            !xl ? (
                <Pressable
                    key="chat"
                    style={({ pressed }) => [
                        styles.iconBtn,
                        rightPanelMode === "chat" && styles.iconBtnActive,
                        pressed && styles.iconBtnPressed,
                    ]}
                    onPress={handleChatToggle}
                >
                    <FontAwesomeIcon
                        icon={faRobot}
                        size={15}
                        color={rightPanelMode === "chat" ? colors.onPrimary : colors.textSecondary}
                    />
                </Pressable>
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
        [hasItems, canManageContent, colors, rightPanelMode, handleOpenAddModal, handleCommentsToggle, handleChatToggle, styles, xl]
    );

    // Slot chevrons are intentionally not wired — desktop uses the rail's
    // chevron and mobile uses the scrim-tap-to-close affordance.
    const rightSidePanel = (
        <RightSidePanel
            mode={rightPanelMode}
            onModeChange={setRightPanelMode}
            commentsSlot={
                <CalendarCommentsPanel
                    year={calYear}
                    month={calMonth}
                    selectedItem={selectedCommentItem}
                    onClearSelectedItem={() => setSelectedCommentItem(null)}
                />
            }
            chatSlot={
                <AIChatPanel
                    module="calendar"
                    contextId={CALENDAR_CONTEXT_ID}
                    focusItems={focusItems}
                    onRemoveFocusItem={(id) =>
                        setFocusItems((prev) => prev.filter((f) => f.id !== id))
                    }
                    isCompact
                    welcomeText={CALENDAR_WELCOME}
                    placeholder="Ask the AI Expert..."
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
                <View style={styles.splitContainer}>
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
                                onAddWeek={(weekStartDate) => handleOpenAddModal(weekStartDate)}
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
                            />
                        )}
                    </View>

                    {/* ── Right: split-pane on desktop only. Mobile uses the
                          floating overlay rendered below. ──────────────────── */}
                    {xl && (
                        <View style={[
                            styles.rightPanel,
                            rightPanelMode === "none" && styles.rightPanelCollapsed,
                        ]}>
                            {rightSidePanel}
                        </View>
                    )}
                </View>
            )}

            {!xl && hasItems && rightSidePanel}

            <AddContentModal
                visible={showAddModal}
                initialDate={addInitialDate}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
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
                    flex: xl ? 2 : 1,
                    overflow: "hidden",
                },
                rightPanel: {
                    flex: 1,
                    // overflow: visible so RightSidePanel's shadow renders unclipped.
                },
                rightPanelCollapsed: {
                    // `flex: 0` ⇒ `flex: 0 1 0%` collapses width to 0; use
                    // explicit grow/shrink/basis so the 44px rail is honored.
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: 44,
                    width: 44,
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
