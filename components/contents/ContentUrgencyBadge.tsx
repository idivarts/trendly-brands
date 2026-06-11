import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ContentItem, getPostingUrgency, postingUrgencyColors } from "./types";

/**
 * A small pill flagging an imminent posting deadline on a content card. Renders
 * nothing when the piece isn't due soon. Red for today/overdue, amber for the
 * next two days — the text label carries the meaning so the signal isn't
 * colour-only (a11y). Shared by the Board and Gallery cards.
 */
const ContentUrgencyBadge: React.FC<{ item: ContentItem }> = ({ item }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const urgency = useMemo(
        () => getPostingUrgency(item),
        [item.status, item.date, item.scheduledAt]
    );

    if (urgency.level === "none") return null;

    const { fg, bg } = postingUrgencyColors(urgency.level, colors);

    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <View style={[styles.dot, { backgroundColor: fg }]} />
            <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
                {urgency.label}
            </Text>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                badge: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 6,
                    flexShrink: 0,
                },
                dot: {
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                },
                label: {
                    fontSize: 10,
                    fontWeight: "700",
                },
            }),
        [colors]
    );
}

export default ContentUrgencyBadge;
