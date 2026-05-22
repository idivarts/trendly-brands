import AddContentModal from "@/components/content-calendar/AddContentModal";
import EmptyCalendarView from "@/components/content-calendar/EmptyCalendarView";
import MonthView from "@/components/content-calendar/MonthView";
import QuickCommentModal from "@/components/content-calendar/QuickCommentModal";
import WeekView from "@/components/content-calendar/WeekView";
import { MOCK_CALENDAR_ITEMS } from "@/components/content-calendar/mock-data";
import { CalendarItem, CalendarView } from "@/components/content-calendar/types";
import AIChatPanel, { ChatMessage, FocusItem } from "@/components/shared/AIChatPanel";
import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faCalendarDays, faCalendarWeek, faPlus } from "@fortawesome/free-solid-svg-icons";
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

    const today = new Date();
    const [calView, setCalView] = useState<CalendarView>("month");
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [items, setItems] = useState<CalendarItem[]>(MOCK_CALENDAR_ITEMS);

    const [showAddModal, setShowAddModal] = useState(false);
    const [addInitialDate, setAddInitialDate] = useState<string | undefined>();
    const [commentItem, setCommentItem] = useState<CalendarItem | null>(null);

    const [chatCollapsed, setChatCollapsed] = useState(false);
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

    const handleFocusChat = useCallback((item: CalendarItem) => {
        const label =
            item.title.length > 80 ? item.title.slice(0, 80) + "..." : item.title;
        setFocusItems((prev) => {
            if (prev.find((f) => f.id === item.id)) return prev;
            return [...prev, { id: item.id, label }];
        });
        setChatCollapsed(false);
    }, []);

    const handleComment = useCallback((item: CalendarItem) => {
        setCommentItem(item);
    }, []);

    const handleAddItem = useCallback(
        (newItem: Omit<CalendarItem, "id">) => {
            setItems((prev) => [
                ...prev,
                { ...newItem, id: `item-${Date.now()}` },
            ]);
        },
        []
    );

    const handleOpenAddModal = useCallback((date?: string) => {
        setAddInitialDate(date);
        setShowAddModal(true);
    }, []);

    const headerActionButtons = useMemo(
        () => [
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
            hasItems ? (
                <Pressable
                    key="add"
                    style={({ pressed }) => [
                        styles.addBtn,
                        pressed && styles.addBtnPressed,
                    ]}
                    onPress={() => handleOpenAddModal()}
                >
                    <FontAwesomeIcon icon={faPlus} size={14} color={colors.onPrimary} />
                    <Text style={styles.addBtnText}>Add Content</Text>
                </Pressable>
            ) : null,
        ].filter(Boolean) as React.ReactElement[],
        [calView, hasItems, colors, handleOpenAddModal, styles]
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
                    onCreateStrategy={() => router.push("/(main)/(drawer)/(tabs)/(content)/content-strategies" as any)}
                    onCreateItem={() => handleOpenAddModal()}
                />
            ) : (
                <View style={styles.splitContainer}>
                    <View style={[styles.calendarPanel, chatCollapsed && styles.calendarPanelExpanded]}>
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
                            />
                        )}
                    </View>

                    <View style={[styles.chatPanel, chatCollapsed && styles.chatPanelCollapsed]}>
                        <AIChatPanel
                            messages={chatMessages}
                            onSend={handleChatSend}
                            focusItems={focusItems}
                            onRemoveFocusItem={(id) =>
                                setFocusItems((prev) => prev.filter((f) => f.id !== id))
                            }
                            isCompact
                            isCollapsible
                            isCollapsed={chatCollapsed}
                            onToggleCollapse={() => setChatCollapsed((v) => !v)}
                            isAITyping={isAITyping}
                            placeholder="Ask the AI Expert..."
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

            <QuickCommentModal
                visible={commentItem !== null}
                item={commentItem}
                onClose={() => setCommentItem(null)}
                onSubmit={(_itemId, _comment) => {
                    // TODO: persist comment via API
                    setCommentItem(null);
                }}
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
                calendarPanelExpanded: {
                    flex: 1,
                },
                chatPanel: {
                    flex: 1,
                    overflow: "hidden",
                },
                chatPanelCollapsed: {
                    flex: 0,
                    width: 40,
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
                viewToggleBtnPressed: {
                    opacity: 0.75,
                },
                viewToggleText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                viewToggleTextActive: {
                    color: colors.onPrimary,
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
                addBtnPressed: {
                    opacity: 0.75,
                },
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
