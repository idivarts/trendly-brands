import { CONTENT_TYPE_LABELS } from "@/components/content-calendar/types";
import Colors from "@/shared-uis/constants/Colors";
import { faCalendarDays, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CONTENT_STATUS_LABELS, ContentItem } from "./types";

interface ContentCardProps {
    item: ContentItem;
    onPress: (item: ContentItem) => void;
}

const TYPE_COLORS: Record<string, string> = {
    reel: "#6C47FF",
    post: "#1A7A3A",
    story: "#E07A00",
    carousel: "#0070CC",
    live: "#CC0044",
};

const STATUS_BG: Record<string, string> = {
    draft: "rgba(139,139,139,0.12)",
    review_pending: "rgba(224,122,0,0.12)",
    approved: "rgba(26,122,58,0.12)",
};

const STATUS_TEXT: Record<string, string> = {
    draft: "#8B8B8B",
    review_pending: "#E07A00",
    approved: "#1A7A3A",
};

const ContentCard: React.FC<ContentCardProps> = ({ item, onPress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const formattedDate = useMemo(() => {
        const d = new Date(item.date + "T00:00:00");
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }, [item.date]);

    const typeColor = TYPE_COLORS[item.type] ?? colors.primary;

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => onPress(item)}
        >
            <View style={[styles.typeAccent, { backgroundColor: typeColor }]} />

            <View style={styles.body}>
                <View style={styles.topRow}>
                    <View style={[styles.typeChip, { backgroundColor: typeColor + "1A" }]}>
                        <Text style={[styles.typeChipText, { color: typeColor }]}>
                            {CONTENT_TYPE_LABELS[item.type]}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[item.status] }]}>
                        <Text style={[styles.statusText, { color: STATUS_TEXT[item.status] }]}>
                            {CONTENT_STATUS_LABELS[item.status]}
                        </Text>
                    </View>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                </Text>

                {item.idea ? (
                    <Text style={styles.idea} numberOfLines={1}>
                        {item.idea}
                    </Text>
                ) : null}

                <View style={styles.footer}>
                    <View style={styles.dateRow}>
                        <FontAwesomeIcon icon={faCalendarDays} size={11} color={colors.textSecondary} />
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={12} color={colors.textSecondary} />
                </View>
            </View>
        </Pressable>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                card: {
                    flexDirection: "row",
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    overflow: "hidden",
                    marginHorizontal: 16,
                    marginVertical: 5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                cardPressed: {
                    opacity: 0.76,
                },
                typeAccent: {
                    width: 4,
                    flexShrink: 0,
                },
                body: {
                    flex: 1,
                    padding: 14,
                    gap: 6,
                },
                topRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                },
                typeChip: {
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 6,
                },
                typeChipText: {
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                statusBadge: {
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 6,
                },
                statusText: {
                    fontSize: 11,
                    fontWeight: "600",
                },
                title: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                    lineHeight: 21,
                },
                idea: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                },
                footer: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 4,
                },
                dateRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                },
                dateText: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
            }),
        [colors]
    );
}

export default ContentCard;
