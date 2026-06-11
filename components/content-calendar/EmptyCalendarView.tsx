import Colors from "@/shared-uis/constants/Colors";
import { faCalendarDays, faLayerGroup, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EmptyCalendarViewProps {
    onCreateStrategy: () => void;
    onCreateItem: () => void;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const GHOST_ROWS = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
    [29, 30, 31, null, null, null, null],
];

const EmptyCalendarView: React.FC<EmptyCalendarViewProps> = ({
    onCreateStrategy,
    onCreateItem,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.ghostCalendar} pointerEvents="none">
                <View style={styles.ghostHeader}>
                    {DAYS.map((d, i) => (
                        <Text key={i} style={styles.ghostDayLabel}>
                            {d}
                        </Text>
                    ))}
                </View>
                {GHOST_ROWS.map((row, ri) => (
                    <View key={ri} style={styles.ghostRow}>
                        {row.map((day, di) => (
                            <View key={di} style={styles.ghostCell}>
                                {day !== null && (
                                    <Text style={styles.ghostDayNum}>{day}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <FontAwesomeIcon
                            icon={faCalendarDays}
                            size={32}
                            color={colors.primary}
                        />
                    </View>
                    <Text style={styles.title}>Your content calendar is empty</Text>
                    <Text style={styles.subtitle}>
                        Plan your posts, Reels, and Stories all in one place. Start by
                        filling your calendar from a strategy, or add individual items
                        one at a time.
                    </Text>

                    <View style={styles.ctaRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.ctaPrimary,
                                pressed && styles.ctaPressed,
                            ]}
                            onPress={onCreateStrategy}
                        >
                            <FontAwesomeIcon
                                icon={faLayerGroup}
                                size={15}
                                color={colors.onPrimary}
                            />
                            <Text style={styles.ctaPrimaryText}>Create a Strategy</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.ctaOutline,
                                pressed && styles.ctaPressed,
                            ]}
                            onPress={onCreateItem}
                        >
                            <FontAwesomeIcon
                                icon={faPlus}
                                size={14}
                                color={colors.primary}
                            />
                            <Text style={styles.ctaOutlineText}>Add Individual Item</Text>
                        </Pressable>
                    </View>
                </View>
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
                    position: "relative",
                },
                ghostCalendar: {
                    ...StyleSheet.absoluteFillObject,
                    padding: 16,
                    opacity: 0.12,
                },
                ghostHeader: {
                    flexDirection: "row",
                    marginBottom: 8,
                },
                ghostDayLabel: {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.text,
                },
                ghostRow: {
                    flexDirection: "row",
                    marginBottom: 4,
                },
                ghostCell: {
                    flex: 1,
                    aspectRatio: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                    margin: 2,
                    borderRadius: 6,
                },
                ghostDayNum: {
                    fontSize: 13,
                    color: colors.text,
                },
                overlay: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                card: {
                    width: "100%",
                    maxWidth: 460,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 28,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.1,
                    elevation: 8,
                },
                iconWrap: {
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.aliceBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.15,
                    elevation: 3,
                },
                title: {
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 10,
                },
                subtitle: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 21,
                    marginBottom: 24,
                },
                ctaRow: {
                    flexDirection: "row",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "center",
                },
                ctaPrimary: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaPrimaryText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.onPrimary,
                },
                ctaOutline: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    borderRadius: 10,
                    backgroundColor: colors.aliceBlue,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                ctaOutlineText: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.primary,
                },
                ctaPressed: {
                    opacity: 0.72,
                },
            }),
        [colors]
    );
}

export default EmptyCalendarView;
