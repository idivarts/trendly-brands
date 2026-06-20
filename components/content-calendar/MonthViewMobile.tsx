import {
    CONTENT_STATUS_LABELS,
    CONTENT_STATUS_ORDER,
    ContentStatus,
    contentStatusColors,
} from "@/components/contents/types";
import Colors from "@/shared-uis/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import CalendarHeader from "./CalendarHeader";
import ContentItemChip from "./ContentItemChip";
import { CalendarItem, CalendarView } from "./types";

interface MonthViewMobileProps {
    year: number;
    month: number; // 0-indexed
    items: CalendarItem[];
    view: CalendarView;
    onViewChange: (next: CalendarView) => void;
    onMonthChange: (year: number, month: number) => void;
    /** Open the Add Content modal pre-filled with this ISO date (empty-day CTA / "+"). */
    onAddOnDay: (dateStr: string) => void;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    onOpenItem: (item: CalendarItem) => void;
    /** Gates the "+ Schedule a post" affordances (manage_content capability). */
    canAdd: boolean;
}

// Single letters keep the seven columns readable inside a phone-width grid.
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// A cell shows at most this many status dots; the exact count always lives in the
// bottom section header once the day is tapped, so the dots only signal "how busy".
const MAX_DOTS = 3;

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

/** "Thursday, Jun 18" — full weekday for the selected-day header. */
function formatSelectedLabel(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "short",
    });
}

const statusDotColor = (
    status: ContentStatus | undefined,
    colors: ReturnType<typeof Colors>
) => contentStatusColors(status ?? "draft", colors).fg;

const MonthViewMobile: React.FC<MonthViewMobileProps> = ({
    year,
    month,
    items,
    view,
    onViewChange,
    onMonthChange,
    onAddOnDay,
    onFocusChat,
    onComment,
    onOpenItem,
    canAdd,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // null → "Upcoming" default list; an ISO date → that day's tiles. Tapping the
    // already-selected day toggles back to Upcoming.
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Changing month should drop the previous month's selection so the bottom
    // section reverts to that month's Upcoming list.
    useEffect(() => {
        setSelectedDate(null);
    }, [year, month]);

    const rows = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, CalendarItem[]> = {};
        items.forEach((item) => {
            if (!map[item.date]) map[item.date] = [];
            map[item.date].push(item);
        });
        return map;
    }, [items]);

    // Every item in the displayed month, date-ascending — backs the "Upcoming" list.
    const monthItemsSorted = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
        return items
            .filter((i) => i.date.startsWith(prefix))
            .sort((a, b) =>
                a.date === b.date
                    ? a.title.localeCompare(b.title)
                    : a.date.localeCompare(b.date)
            );
    }, [items, year, month]);

    // Only legend rows for statuses that actually appear this month — keeps the
    // key short and relevant, and ensures dot colours are decodable (not colour-
    // alone) for accessibility.
    const presentStatuses = useMemo(() => {
        const set = new Set<ContentStatus>();
        monthItemsSorted.forEach((i) => set.add((i.status ?? "draft") as ContentStatus));
        return CONTENT_STATUS_ORDER.filter((s) => set.has(s));
    }, [monthItemsSorted]);

    const toggleSelect = (dateStr: string) =>
        setSelectedDate((cur) => (cur === dateStr ? null : dateStr));

    const renderDots = (dayItems: CalendarItem[], selected: boolean) => {
        const dots = dayItems.slice(0, MAX_DOTS);
        return (
            <View style={styles.dotsRow}>
                {dots.map((item, i) => (
                    <View
                        key={item.id + i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: selected
                                    ? colors.onPrimary
                                    : statusDotColor(item.status, colors),
                            },
                        ]}
                    />
                ))}
            </View>
        );
    };

    const selectedItems = selectedDate ? itemsByDate[selectedDate] ?? [] : [];

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
                {DAY_LETTERS.map((d, i) => (
                    <Text key={i} style={styles.dayLabelText}>
                        {d}
                    </Text>
                ))}
            </View>

            {/* ── Dot grid ─────────────────────────────────────────────────── */}
            <View style={styles.grid}>
                {rows.map((row, ri) => (
                    <View key={ri} style={styles.weekRow}>
                        {row.map((day, di) => {
                            if (day === null) {
                                return <View key={di} style={styles.dayCell} />;
                            }
                            const dateStr = toIso(year, month, day);
                            const today = isToday(year, month, day);
                            const selected = selectedDate === dateStr;
                            const dayItems = itemsByDate[dateStr] ?? [];
                            return (
                                <Pressable
                                    key={di}
                                    style={({ pressed }) => [
                                        styles.dayCell,
                                        styles.dayCellInner,
                                        today && !selected && styles.dayCellToday,
                                        selected && styles.dayCellSelected,
                                        pressed && !selected && styles.dayCellPressed,
                                    ]}
                                    onPress={() => toggleSelect(dateStr)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${formatSelectedLabel(dateStr)}, ${dayItems.length} ${
                                        dayItems.length === 1 ? "post" : "posts"
                                    }`}
                                >
                                    <Text
                                        style={[
                                            styles.dayNumber,
                                            today && !selected && styles.dayNumberToday,
                                            selected && styles.dayNumberSelected,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                    {renderDots(dayItems, selected)}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* ── Legend (only statuses present this month) ────────────────── */}
            {presentStatuses.length > 0 && (
                <View style={styles.legendRow}>
                    {presentStatuses.map((s) => (
                        <View key={s} style={styles.legendItem}>
                            <View
                                style={[
                                    styles.legendDot,
                                    { backgroundColor: statusDotColor(s, colors) },
                                ]}
                            />
                            <Text style={styles.legendText}>
                                {CONTENT_STATUS_LABELS[s]}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* ── Bottom section: selected day's tiles, else Upcoming ──────── */}
            <View style={styles.bottomSection}>
                <View style={styles.bottomHeader}>
                    <View style={styles.bottomHeaderText}>
                        <Text style={styles.bottomTitle}>
                            {selectedDate ? formatSelectedLabel(selectedDate) : "Upcoming"}
                        </Text>
                        <Text style={styles.bottomSubtitle}>
                            {selectedDate
                                ? `${selectedItems.length} ${
                                      selectedItems.length === 1 ? "post" : "posts"
                                  }`
                                : `${monthItemsSorted.length} this month`}
                        </Text>
                    </View>
                    {selectedDate && canAdd && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.addOnDayBtn,
                                pressed && styles.addOnDayBtnPressed,
                            ]}
                            onPress={() => onAddOnDay(selectedDate)}
                            accessibilityLabel="Add content on this day"
                        >
                            <FontAwesomeIcon icon={faPlus} size={12} color={colors.onPrimary} />
                        </Pressable>
                    )}
                </View>

                <ScrollView
                    style={styles.bottomScroll}
                    contentContainerStyle={styles.bottomScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {selectedDate ? (
                        selectedItems.length > 0 ? (
                            selectedItems.map((item) => (
                                <ContentItemChip
                                    key={item.id}
                                    item={item}
                                    onFocusChat={onFocusChat}
                                    onComment={onComment}
                                    onOpen={onOpenItem}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyDay}>
                                <Text style={styles.emptyDayText}>
                                    No posts on {formatSelectedLabel(selectedDate)}
                                </Text>
                                {canAdd && (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.emptyDayCta,
                                            pressed && styles.emptyDayCtaPressed,
                                        ]}
                                        onPress={() => onAddOnDay(selectedDate)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPlus}
                                            size={12}
                                            color={colors.onPrimary}
                                        />
                                        <Text style={styles.emptyDayCtaText}>
                                            Schedule a post
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        )
                    ) : monthItemsSorted.length > 0 ? (
                        monthItemsSorted.map((item) => (
                            <ContentItemChip
                                key={item.id}
                                item={item}
                                onFocusChat={onFocusChat}
                                onComment={onComment}
                                onOpen={onOpenItem}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyDay}>
                            <Text style={styles.emptyDayText}>
                                Nothing planned this month
                            </Text>
                        </View>
                    )}
                </ScrollView>
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
                    paddingTop: 10,
                    paddingBottom: 4,
                },
                dayLabelText: {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
                grid: {
                    paddingHorizontal: 8,
                    gap: 4,
                },
                weekRow: {
                    flexDirection: "row",
                    gap: 4,
                },
                dayCell: {
                    flex: 1,
                    minHeight: 46,
                },
                dayCellInner: {
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 5,
                    gap: 4,
                    borderRadius: 12,
                },
                dayCellToday: {
                    backgroundColor: colors.aliceBlue,
                },
                dayCellSelected: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                dayCellPressed: {
                    opacity: 0.6,
                },
                dayNumber: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                },
                dayNumberToday: {
                    color: colors.primary,
                    fontWeight: "700",
                },
                dayNumberSelected: {
                    color: colors.onPrimary,
                    fontWeight: "700",
                },
                // Fixed-height row so day numbers stay aligned whether or not a
                // day carries dots.
                dotsRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    height: 6,
                },
                dot: {
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                },
                legendRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 12,
                    paddingTop: 12,
                    paddingBottom: 4,
                },
                legendItem: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                },
                legendDot: {
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                },
                legendText: {
                    fontSize: 10,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                // Elevated surface that owns the day's content tiles; the upward
                // shadow separates it from the grid without a divider border.
                bottomSection: {
                    flex: 1,
                    marginTop: 8,
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.06,
                    elevation: 6,
                },
                bottomHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 10,
                },
                bottomHeaderText: {
                    flexShrink: 1,
                    minWidth: 0,
                },
                bottomTitle: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                },
                bottomSubtitle: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                addOnDayBtn: {
                    width: 32,
                    height: 32,
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
                addOnDayBtnPressed: {
                    opacity: 0.75,
                },
                bottomScroll: {
                    flex: 1,
                },
                bottomScrollContent: {
                    paddingHorizontal: 16,
                    paddingBottom: 16,
                },
                emptyDay: {
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 36,
                    gap: 14,
                },
                emptyDayText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                emptyDayCta: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                emptyDayCtaPressed: {
                    opacity: 0.8,
                },
                emptyDayCtaText: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default MonthViewMobile;
