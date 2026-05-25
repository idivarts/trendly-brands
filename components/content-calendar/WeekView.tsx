import Colors from "@/shared-uis/constants/Colors";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ContentItemChip from "./ContentItemChip";
import { CalendarItem } from "./types";

interface WeekViewProps {
    year: number;
    month: number; // 0-indexed
    items: CalendarItem[];
    onAddWeek: (weekStartDate: string) => void;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
}

interface WeekBucket {
    label: string;
    startDate: Date;
    endDate: Date;
    items: CalendarItem[];
}

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function buildWeekBuckets(
    year: number,
    month: number,
    items: CalendarItem[]
): WeekBucket[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const buckets: WeekBucket[] = [];

    let current = new Date(firstDay);
    let weekIndex = 0;

    while (current <= lastDay) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());

        const startIso = toIso(weekStart);
        const endIso = toIso(weekEnd);

        const weekItems = items.filter((it) => it.date >= startIso && it.date <= endIso);

        const monthName = MONTH_NAMES[month];
        const label = `${ORDINALS[weekIndex]} Week of ${monthName} (${fmtDay(weekStart)}–${fmtDay(weekEnd)})`;

        buckets.push({
            label,
            startDate: weekStart,
            endDate: weekEnd,
            items: weekItems,
        });

        current.setDate(current.getDate() + 7);
        weekIndex++;
    }

    return buckets;
}

function toIso(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDay(d: Date) {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

const WeekView: React.FC<WeekViewProps> = ({
    year,
    month,
    items,
    onAddWeek,
    onFocusChat,
    onComment,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const buckets = useMemo(
        () => buildWeekBuckets(year, month, items),
        [year, month, items]
    );

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {buckets.map((bucket) => (
                <View key={bucket.label} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel} numberOfLines={1}>
                            {bucket.label}
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                styles.addBtn,
                                pressed && styles.addBtnPressed,
                            ]}
                            onPress={() => onAddWeek(toIso(bucket.startDate))}
                        >
                            <FontAwesomeIcon icon={faPlus} size={12} color={colors.primary} />
                        </Pressable>
                    </View>

                    {bucket.items.length === 0 ? (
                        <View style={styles.emptyWeek}>
                            <Text style={styles.emptyWeekText}>No content planned</Text>
                        </View>
                    ) : (
                        <View style={styles.itemsContainer}>
                            {bucket.items
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map((item) => (
                                    <ContentItemChip
                                        key={item.id}
                                        item={item}
                                        onFocusChat={onFocusChat}
                                        onComment={onComment}
                                    />
                                ))}
                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                scroll: {
                    flex: 1,
                },
                scrollContent: {
                    padding: 16,
                    gap: 20,
                },
                section: {
                    gap: 10,
                },
                sectionHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingBottom: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                sectionLabel: {
                    flex: 1,
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
                addBtn: {
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: colors.aliceBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.06,
                    elevation: 1,
                },
                addBtnPressed: {
                    opacity: 0.7,
                },
                emptyWeek: {
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    alignItems: "center",
                },
                emptyWeekText: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                },
                itemsContainer: {
                    gap: 6,
                },
            }),
        [colors]
    );
}

export default WeekView;
