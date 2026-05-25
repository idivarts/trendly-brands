import AddContentModal from "@/components/content-calendar/AddContentModal";
import CalendarCommentsPanel from "@/components/content-calendar/CalendarCommentsPanel";
import EmptyCalendarView from "@/components/content-calendar/EmptyCalendarView";
import MonthView from "@/components/content-calendar/MonthView";
import WeekView from "@/components/content-calendar/WeekView";
import { CalendarItem, CalendarView } from "@/components/content-calendar/types";
import AIChatPanel, { ChatMessage, FocusItem } from "@/components/shared/AIChatPanel";
import RightSidePanel, { RightPanelMode } from "@/components/shared/RightSidePanel";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import { useContents } from "@/hooks/use-contents";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faCalendarWeek,
    faCommentDots,
    faPlus,
    faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

let msgId = 0;
const newId = () => `cmsg-${++msgId}-${Date.now()}`;

const AI_WELCOME: ChatMessage = {
    id: newId(),
    sender: "ai",
    text: "Hi! I'm your AI Content Expert. Select items from the calendar and send them here — I can help you rewrite, rethink, or bulk-edit your content plan.",
    timestamp: Date.now(),
};

const ContentCalendarScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const router = useRouter();
    const styles = useMemo(() => useStyles(colors), [colors]);

    const { items: allContents, addContent } = useContents();
    const items = useMemo<CalendarItem[]>(
        () => allContents.filter((i) => !!i.date),
        [allContents]
    );

    const today = new Date();
    const [calView, setCalView] = useState<CalendarView>("month");
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());

    const [showAddModal, setShowAddModal] = useState(false);
    const [addInitialDate, setAddInitialDate] = useState<string | undefined>();

    // ── Right panel ───────────────────────────────────────────────────────────
    // 'chat'     → AI chat panel
    // 'comments' → Calendar comments panel (month or item level)
    // 'none'     → collapsed to 28px handle
    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("chat");

    // Which content item's comments are currently in focus.
    // null = month-level comments; set = item-level comments.
    const [selectedCommentItem, setSelectedCommentItem] = useState<CalendarItem | null>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([AI_WELCOME]);
    const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
    const [isAITyping, setIsAITyping] = useState(false);

    const hasItems = items.length > 0;

    const addMessage = useCallback((sender: "ai" | "user", text: string) => {
        setChatMessages((prev) => [
            ...prev,
            { id: newId(), sender, text, timestamp: Date.now() },
        ]);
    }, []);

    const handleChatSend = useCallback(
        (text: string) => {
            const refs = focusItems.map((f) => `[Ref: "${f.label}"]`).join(" ");
            const fullText = refs ? `${refs}\n${text}` : text;
            addMessage("user", fullText);
            setFocusItems([]);
            setIsAITyping(true);
            setTimeout(() => {
                setIsAITyping(false);
                addMessage(
                    "ai",
                    "Got it! I've noted your request. Once the backend is connected, I'll apply your changes directly to the calendar."
                );
            }, 1600);
        },
        [focusItems, addMessage]
    );

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

    // Month-level comment button in the calendar header.
    const handleMonthComment = useCallback(() => {
        setSelectedCommentItem(null); // no item = month mode
        setRightPanelMode("comments");
    }, []);

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
            // Week / Month view toggles
            <Pressable
                key="week"
                style={({ pressed }) => [
                    styles.viewToggleBtn,
                    calView === "week" && styles.viewToggleBtnActive,
                    pressed && styles.viewToggleBtnPressed,
                ]}
                onPress={() => setCalView("week")}
            >
                <FontAwesomeIcon
                    icon={faCalendarWeek}
                    size={13}
                    color={calView === "week" ? colors.onPrimary : colors.textSecondary}
                />
                <Text
                    style={[
                        styles.viewToggleText,
                        calView === "week" && styles.viewToggleTextActive,
                    ]}
                >
                    Week
                </Text>
            </Pressable>,
            <Pressable
                key="month"
                style={({ pressed }) => [
                    styles.viewToggleBtn,
                    calView === "month" && styles.viewToggleBtnActive,
                    pressed && styles.viewToggleBtnPressed,
                ]}
                onPress={() => setCalView("month")}
            >
                <FontAwesomeIcon
                    icon={faCalendarDays}
                    size={13}
                    color={calView === "month" ? colors.onPrimary : colors.textSecondary}
                />
                <Text
                    style={[
                        styles.viewToggleText,
                        calView === "month" && styles.viewToggleTextActive,
                    ]}
                >
                    Month
                </Text>
            </Pressable>,

            // 💬 Comments toggle
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
            </Pressable>,

            // 🤖 AI Chat toggle
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
            </Pressable>,

            // Add content
            hasItems ? (
                <Pressable
                    key="add"
                    style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                    onPress={() => handleOpenAddModal()}
                >
                    <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
                    <Text style={styles.addBtnText}>Add Content</Text>
                </Pressable>
            ) : null,
        ].filter(Boolean) as React.ReactElement[],
        [calView, hasItems, colors, rightPanelMode, handleOpenAddModal, handleCommentsToggle, handleChatToggle, styles]
    );

    return (
        <AppLayout>
            <PageHeader
                title="Content Calendar"
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
                                onAddWeek={(weekStartDate) => handleOpenAddModal(weekStartDate)}
                                onFocusChat={handleFocusChat}
                                onComment={handleComment}
                            />
                        ) : (
                            <MonthView
                                year={calYear}
                                month={calMonth}
                                items={items}
                                onMonthChange={(y, m) => {
                                    setCalYear(y);
                                    setCalMonth(m);
                                }}
                                onDayPress={(dateStr) => handleOpenAddModal(dateStr)}
                                onFocusChat={handleFocusChat}
                                onComment={handleComment}
                                onMonthComment={handleMonthComment}
                            />
                        )}
                    </View>

                    {/* ── Right: RightSidePanel (comments OR chat) ──────────────── */}
                    <View style={[
                        styles.rightPanel,
                        rightPanelMode === "none" && styles.rightPanelCollapsed,
                    ]}>
                        <RightSidePanel
                            mode={rightPanelMode}
                            onModeChange={setRightPanelMode}
                            commentsSlot={
                                <CalendarCommentsPanel
                                    year={calYear}
                                    month={calMonth}
                                    selectedItem={selectedCommentItem}
                                    onClearSelectedItem={() => setSelectedCommentItem(null)}
                                    onCollapse={() => setRightPanelMode("none")}
                                />
                            }
                            chatSlot={
                                <AIChatPanel
                                    messages={chatMessages}
                                    onSend={handleChatSend}
                                    focusItems={focusItems}
                                    onRemoveFocusItem={(id) =>
                                        setFocusItems((prev) => prev.filter((f) => f.id !== id))
                                    }
                                    isCompact
                                    isAITyping={isAITyping}
                                    placeholder="Ask the AI Expert..."
                                    onCollapse={() => setRightPanelMode("none")}
                                />
                            }
                        />
                    </View>
                </View>
            )}

            <AddContentModal
                visible={showAddModal}
                initialDate={addInitialDate}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddItem}
            />
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
                },
                calendarPanel: {
                    flex: 3,
                    overflow: "hidden",
                },
                rightPanel: {
                    flex: 1,
                    // overflow: visible so RightSidePanel's shadow renders unclipped.
                },
                rightPanelCollapsed: {
                    flex: 0,
                    width: 24,
                },
                viewToggleBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                viewToggleBtnActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                viewToggleBtnPressed: { opacity: 0.75 },
                viewToggleText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                viewToggleTextActive: { color: colors.onPrimary },
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
