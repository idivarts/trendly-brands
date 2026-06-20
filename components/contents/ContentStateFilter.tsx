import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CONTENT_STATUS_LABELS, ContentItem, ContentStatus } from "./types";

export type ContentStateFilterValue = ContentStatus | "all";

interface ContentStateFilterProps {
    /** Items being displayed — used to compute per-status counts. */
    items: ContentItem[];
    /** Which statuses to offer as chips, in display order. */
    statuses: ContentStatus[];
    value: ContentStateFilterValue;
    onChange: (value: ContentStateFilterValue) => void;
}

/**
 * Horizontal chip row to filter the Gallery by content state. Shown only in
 * Gallery view (the Board's columns already represent state).
 */
const ContentStateFilter: React.FC<ContentStateFilterProps> = ({
    items,
    statuses,
    value,
    onChange,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const counts = useMemo(() => {
        const map: Record<string, number> = {};
        items.forEach((i) => {
            map[i.status] = (map[i.status] ?? 0) + 1;
        });
        return map;
    }, [items]);

    const chips: { key: ContentStateFilterValue; label: string; count: number }[] = [
        { key: "all", label: "All", count: items.length },
        ...statuses.map((s) => ({
            key: s as ContentStateFilterValue,
            label: CONTENT_STATUS_LABELS[s],
            count: counts[s] ?? 0,
        })),
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
        >
            {chips.map((chip) => {
                const active = value === chip.key;
                return (
                    <Pressable
                        key={chip.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => onChange(chip.key)}
                    >
                        <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                            {chip.label}
                        </Text>
                        <View style={[styles.count, active && styles.countActive]}>
                            <Text style={[styles.countText, active && styles.countTextActive]}>
                                {chip.count}
                            </Text>
                        </View>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                },
                chip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 9,
                    backgroundColor: colors.tag,
                },
                chipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                chipLabel: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                chipLabelActive: {
                    color: colors.onPrimary,
                },
                count: {
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    paddingHorizontal: 5,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                },
                countActive: {
                    backgroundColor: "rgba(255,255,255,0.25)",
                },
                countText: {
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
                countTextActive: {
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default ContentStateFilter;
