import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import CalendarHeader from "./CalendarHeader";
import ContentItemChip from "./ContentItemChip";
import { CalendarItem, CalendarView } from "./types";

interface MonthViewProps {
    year: number;
    month: number; // 0-indexed
    items: CalendarItem[];
    view: CalendarView;
    onViewChange: (next: CalendarView) => void;
    onMonthChange: (year: number, month: number) => void;
    onDayPress: (dateStr: string) => void;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    onOpenItem: (item: CalendarItem) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);

    const rows: (number | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
        rows.push(grid.slice(i, i + 7));
    }
    return rows;
}

function toIso(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number) {
    const now = new Date();
    return (
        now.getFullYear() === year &&
        now.getMonth() === month &&
        now.getDate() === day
    );
}

const MonthView: React.FC<MonthViewProps> = ({
    year,
    month,
    items,
    view,
    onViewChange,
    onMonthChange,
    onDayPress,
    onFocusChat,
    onComment,
    onOpenItem,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const rows = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, CalendarItem[]> = {};
        items.forEach((item) => {
            if (!map[item.date]) map[item.date] = [];
            map[item.date].push(item);
        });
        return map;
    }, [items]);

    return (
        <View style={styles.container}>
            <CalendarHeader
                year={year}
                month={month}
                view={view}
                onMonthChange={onMonthChange}
                onViewChange={onViewChange}
            />

            <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((d) => (
                    <Text key={d} style={styles.dayLabelText}>
                        {d}
                    </Text>
                ))}
            </View>

            <View style={styles.gridContent}>
                {rows.map((row, ri) => (
                    <View key={ri} style={styles.weekRow}>
                        {row.map((day, di) => {
                            if (day === null) {
                                return <View key={di} style={styles.dayCell} />;
                            }
                            const dateStr = toIso(year, month, day);
                            const dayItems = itemsByDate[dateStr] ?? [];
                            const today = isToday(year, month, day);

                            return (
                                <Pressable
                                    key={di}
                                    style={({ pressed }) => [
                                        styles.dayCell,
                                        styles.dayCellActive,
                                        today && styles.dayCellToday,
                                        pressed && styles.dayCellPressed,
                                    ]}
                                    onPress={() => onDayPress(dateStr)}
                                >
                                    <Text
                                        style={[
                                            styles.dayNumber,
                                            today && styles.dayNumberToday,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                    {dayItems.slice(0, 2).map((item) => (
                                        <ContentItemChip
                                            key={item.id}
                                            item={item}
                                            compact
                                            onFocusChat={onFocusChat}
                                            onComment={onComment}
                                            onOpen={onOpenItem}
                                        />
                                    ))}
                                    {dayItems.length > 2 && (
                                        <Text style={styles.moreText}>
                                            +{dayItems.length - 2} more
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                },
                dayLabelsRow: {
                    flexDirection: "row",
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                },
                dayLabelText: {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                gridContent: {
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingBottom: 8,
                    gap: 4,
                },
                weekRow: {
                    flex: 1,
                    flexDirection: "row",
                    gap: 4,
                    minHeight: 80,
                },
                dayCell: {
                    flex: 1,
                    borderRadius: 10,
                    padding: 6,
                    overflow: "hidden",
                },
                dayCellActive: {
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                dayCellToday: {
                    backgroundColor: colors.aliceBlue,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.15,
                    elevation: 2,
                },
                dayCellPressed: {
                    opacity: 0.75,
                },
                dayNumber: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 4,
                },
                dayNumberToday: {
                    color: colors.primary,
                },
                moreText: {
                    fontSize: 10,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                    marginTop: 2,
                },
            }),
        [colors]
    );
}

export default MonthView;
