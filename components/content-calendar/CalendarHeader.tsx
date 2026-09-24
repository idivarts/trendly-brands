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
import { useBreakpoints } from "@/hooks";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MonthPickerModal from "./MonthPickerModal";
import { CalendarView } from "./types";
import { fs } from "@/constants/Typography";

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

const MONTH_NAMES_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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
    // The full header — 36px arrows + "September 2026" at fs(16) + two labelled
    // pills — needs ~459px of row width. No phone has that, so the view switcher
    // used to be pushed past the right edge and clipped away entirely (~29px lost
    // on a 430px Pro Max, ~99px on a 360px Android). Below `xl` we therefore drop
    // to a short month name and an icon-only segmented switcher, which needs
    // ~301px and so clears even a 320px viewport with room to spare.
    const { xl: isWide } = useBreakpoints();
    const styles = useStyles(colors, isWide);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const prevMonth = () => {
        if (month === 0) onMonthChange(year - 1, 11);
        else onMonthChange(year, month - 1);
    };

    const nextMonth = () => {
        if (month === 11) onMonthChange(year + 1, 0);
        else onMonthChange(year, month + 1);
    };

    const monthLabel = `${(isWide ? MONTH_NAMES : MONTH_NAMES_SHORT)[month]} ${year}`;

    const renderToggle = (
        target: CalendarView,
        icon: typeof faCalendarWeek,
        label: string
    ) => {
        const active = view === target;
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.toggleBtn,
                    active && styles.toggleBtnActive,
                    pressed && styles.btnPressed,
                ]}
                onPress={() => onViewChange(target)}
                accessibilityRole="button"
                accessibilityLabel={`${label} view`}
                accessibilityState={{ selected: active }}
            >
                <FontAwesomeIcon
                    icon={icon}
                    size={isWide ? 13 : 15}
                    color={
                        active
                            ? colors.onPrimary
                            : // Compact drops the label, so the glyph is the only
                              // signal and has to clear 3:1 against the track —
                              // textSecondary is only 2.47:1 on the dark `tag`.
                              isWide
                              ? colors.textSecondary
                              : colors.tagForeground
                    }
                />
                {isWide && (
                    <Text
                        style={[styles.toggleText, active && styles.toggleTextActive]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                )}
            </Pressable>
        );
    };

    return (
        <>
            <View style={styles.row}>
                <Pressable
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.btnPressed]}
                    onPress={prevMonth}
                    accessibilityRole="button"
                    accessibilityLabel="Previous month"
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={14} color={colors.text} />
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.monthLabel, pressed && styles.monthLabelPressed]}
                    onPress={() => setShowMonthPicker(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`${MONTH_NAMES[month]} ${year}, change month`}
                >
                    {/* Last line of defence: if the label still cannot fit (long
                        locale, large system font scale), it ellipsizes instead of
                        shoving the switcher off-screen. */}
                    <Text style={styles.monthLabelText} numberOfLines={1} ellipsizeMode="tail">
                        {monthLabel}
                    </Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.arrowBtn, pressed && styles.btnPressed]}
                    onPress={nextMonth}
                    accessibilityRole="button"
                    accessibilityLabel="Next month"
                >
                    <FontAwesomeIcon icon={faChevronRight} size={14} color={colors.text} />
                </Pressable>

                <View style={styles.spacer} />

                <View style={styles.toggleAnchor}>
                    <CoachmarkAnchor id="gt-calendar-view-toggle" shape="rect">
                        <View style={styles.toggleGroup}>
                            {renderToggle("week", faCalendarWeek, "Week")}
                            {renderToggle("month", faCalendarDays, "Month")}
                        </View>
                    </CoachmarkAnchor>
                </View>
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

function useStyles(colors: ReturnType<typeof Colors>, isWide: boolean) {
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
                    flexShrink: 0,
                },
                btnPressed: {
                    opacity: 0.6,
                },
                monthLabel: {
                    paddingHorizontal: isWide ? 10 : 8,
                    paddingVertical: 6,
                    borderRadius: 8,
                    // The only element allowed to give up width when the row is
                    // tight — everything else is flexShrink: 0.
                    flexShrink: 1,
                    minWidth: 0,
                },
                monthLabelPressed: {
                    backgroundColor: colors.tag,
                },
                monthLabelText: {
                    fontSize: fs(16),
                    fontWeight: "700",
                    color: colors.text,
                    flexShrink: 1,
                },
                spacer: {
                    flex: 1,
                },
                toggleAnchor: {
                    flexShrink: 0,
                },
                toggleGroup: {
                    flexDirection: "row",
                    alignItems: "center",
                    flexShrink: 0,
                    // Compact: a single segmented track so two icon-only buttons
                    // still read as one switcher. Wide: unchanged loose pills.
                    ...(isWide
                        ? { gap: 8 }
                        : {
                              gap: 0,
                              padding: 2,
                              borderRadius: 10,
                              backgroundColor: colors.tag,
                          }),
                },
                toggleBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    ...(isWide
                        ? {
                              gap: 5,
                              paddingHorizontal: 11,
                              paddingVertical: 7,
                              backgroundColor: colors.tag,
                          }
                        : {
                              // Square target inside the track; no label, so the
                              // width is fixed and can never be squeezed.
                              width: 36,
                              height: 36,
                              backgroundColor: "transparent",
                          }),
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
                    fontSize: fs(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                toggleTextActive: { color: colors.onPrimary },
            }),
        [colors, isWide]
    );
}

export default CalendarHeader;
