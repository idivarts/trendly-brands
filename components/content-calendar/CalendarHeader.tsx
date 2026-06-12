import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faCalendarWeek,
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MonthPickerModal from "./MonthPickerModal";
import { CalendarView } from "./types";

interface CalendarHeaderProps {
    year: number;
    month: number; // 0-indexed
    view: CalendarView;
    onMonthChange: (year: number, month: number) => void;
    onViewChange: (next: CalendarView) => void;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    year,
    month,
    view,
    onMonthChange,
    onViewChange,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const prevMonth = () => {
        if (month === 0) onMonthChange(year - 1, 11);
        else onMonthChange(year, month - 1);
    };

    const nextMonth = () => {
        if (month === 11) onMonthChange(year + 1, 0);
        else onMonthChange(year, month + 1);
    };

    return (
        <>
            <View style={styles.row}>
                <Pressable
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.btnPressed]}
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
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.btnPressed]}
                    onPress={nextMonth}
                >
                    <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.text} />
                </Pressable>

                <View style={styles.spacer} />

                <CoachmarkAnchor id="gt-calendar-view-toggle" shape="rect">
                    <View style={styles.toggleGroup}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.toggleBtn,
                                view === "week" && styles.toggleBtnActive,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={() => onViewChange("week")}
                        >
                            <FontAwesomeIcon
                                icon={faCalendarWeek}
                                size={13}
                                color={view === "week" ? colors.onPrimary : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.toggleText,
                                    view === "week" && styles.toggleTextActive,
                                ]}
                            >
                                Week
                            </Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.toggleBtn,
                                view === "month" && styles.toggleBtnActive,
                                pressed && styles.btnPressed,
                            ]}
                            onPress={() => onViewChange("month")}
                        >
                            <FontAwesomeIcon
                                icon={faCalendarDays}
                                size={13}
                                color={view === "month" ? colors.onPrimary : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.toggleText,
                                    view === "month" && styles.toggleTextActive,
                                ]}
                            >
                                Month
                            </Text>
                        </Pressable>
                    </View>
                </CoachmarkAnchor>
            </View>

            <MonthPickerModal
                visible={showMonthPicker}
                year={year}
                month={month}
                onSelect={onMonthChange}
                onClose={() => setShowMonthPicker(false)}
            />
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
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
                btnPressed: {
                    opacity: 0.6,
                },
                monthLabel: {
                    paddingHorizontal: 10,
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
                spacer: {
                    flex: 1,
                },
                toggleGroup: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
                toggleBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                toggleBtnActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                toggleText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                toggleTextActive: { color: colors.onPrimary },
            }),
        [colors]
    );
}

export default CalendarHeader;
