import Colors from "@/shared-uis/constants/Colors";
import { faComment, faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarItem, CONTENT_TYPE_LABELS } from "./types";

interface ContentItemChipProps {
    item: CalendarItem;
    compact?: boolean;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
}

const TYPE_COLORS: Record<string, string> = {
    reel: "rgb(83, 139, 166)",
    post: "rgb(5, 68, 99)",
    story: "rgb(157, 213, 134)",
    carousel: "rgb(236, 214, 148)",
    live: "rgb(232, 185, 49)",
};

const ContentItemChip: React.FC<ContentItemChipProps> = ({
    item,
    compact = false,
    onFocusChat,
    onComment,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const typeColor = TYPE_COLORS[item.type] ?? colors.primary;
    const styles = useMemo(
        () => useStyles(colors, typeColor, compact),
        [colors, typeColor, compact]
    );

    return (
        <View style={styles.chip}>
            <View style={styles.accentBar} />
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
                    {item.title}
                </Text>
                <View style={styles.footer}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>
                            {CONTENT_TYPE_LABELS[item.type]}
                        </Text>
                    </View>
                    <View style={styles.actions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionBtn,
                                pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => onComment(item)}
                            hitSlop={6}
                        >
                            <FontAwesomeIcon
                                icon={faComment}
                                size={11}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionBtn,
                                pressed && styles.actionBtnPressed,
                            ]}
                            onPress={() => onFocusChat(item)}
                            hitSlop={6}
                        >
                            <FontAwesomeIcon
                                icon={faCrosshairs}
                                size={11}
                                color={colors.primary}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};

function useStyles(
    colors: ReturnType<typeof Colors>,
    typeColor: string,
    compact: boolean
) {
    return useMemo(
        () =>
            StyleSheet.create({
                chip: {
                    flexDirection: "row",
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.07,
                    elevation: 2,
                    marginBottom: 4,
                },
                accentBar: {
                    width: 4,
                    backgroundColor: typeColor,
                },
                body: {
                    flex: 1,
                    paddingHorizontal: 8,
                    paddingVertical: compact ? 5 : 7,
                    gap: 4,
                },
                title: {
                    fontSize: compact ? 11 : 12,
                    fontWeight: "600",
                    color: colors.text,
                    lineHeight: compact ? 15 : 17,
                },
                footer: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                },
                typeBadge: {
                    backgroundColor: typeColor + "22",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                },
                typeText: {
                    fontSize: 10,
                    fontWeight: "600",
                    color: typeColor,
                },
                actions: {
                    flexDirection: "row",
                    gap: 4,
                },
                actionBtn: {
                    padding: 3,
                },
                actionBtnPressed: {
                    opacity: 0.6,
                },
            }),
        [colors, typeColor, compact]
    );
}

export default ContentItemChip;
