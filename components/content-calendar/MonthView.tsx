import Colors from "@/shared-uis/constants/Colors";
import { faChevronLeft, faChevronRight, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ContentItemChip from "./ContentItemChip";
import MonthPickerModal from "./MonthPickerModal";
import { CalendarItem } from "./types";

interface MonthViewProps {
    year: number;
    month: number; // 0-indexed
    items: CalendarItem[];
    onMonthChange: (year: number, month: number) => void;
    onDayPress: (dateStr: string) => void;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    /** Opens the month-level comment modal */
    onMonthComment?: () => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

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
    onMonthChange,
    onDayPress,
    onFocusChat,
    onComment,
    onMonthComment,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const rows = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, CalendarItem[]> = {};
        items.forEach((item) => {
            if (!map[item.date]) map[item.date] = [];
            map[item.date].push(item);
        });
        return map;
    }, [items]);

    const prevMonth = () => {
        if (month === 0) onMonthChange(year - 1, 11);
        else onMonthChange(year, month - 1);
    };

    const nextMonth = () => {
        if (month === 11) onMonthChange(year + 1, 0);
        else onMonthChange(year, month + 1);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowBtnPressed]}
                    onPress={prevMonth}
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={14} color={colors.text} />
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.monthLabel, pressed && styles.monthLabelPressed]}
                    onPress={() => setShowMonthPicker(true)}
                >
                    <Text style={styles.monthLabelText}>
                        {MONTH_NAMES[month]} {year}
                    </Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowBtnPressed]}
                    onPress={nextMonth}
                >
                    <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.text} />
                </Pressable>

                {onMonthComment && (
                    <Pressable
                        style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowBtnPressed]}
                        onPress={onMonthComment}
                    >
                        <FontAwesomeIcon icon={faCommentDots} size={15} color={colors.textSecondary} />
                    </Pressable>
                )}
            </View>

            <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((d) => (
                    <Text key={d} style={styles.dayLabelText}>
                        {d}
                    </Text>
                ))}
            </View>

            <ScrollView
                style={styles.gridScroll}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
            >
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
            </ScrollView>

            <MonthPickerModal
                visible={showMonthPicker}
                year={year}
                month={month}
                onSelect={onMonthChange}
                onClose={() => setShowMonthPicker(false)}
            />
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
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                arrowBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                arrowBtnPressed: {
                    opacity: 0.6,
                },
                monthLabel: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 6,
                    borderRadius: 8,
                },
                monthLabelPressed: {
                    backgroundColor: colors.tag,
                },
                monthLabelText: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
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
                gridScroll: {
                    flex: 1,
                },
                gridContent: {
                    paddingHorizontal: 8,
                    paddingBottom: 16,
                    gap: 4,
                },
                weekRow: {
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
