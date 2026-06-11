import Colors from "@/shared-uis/constants/Colors";
import { faComment, faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarItem, CONTENT_TYPE_LABELS } from "./types";

/**
 * On web, surface the full (possibly truncated) title as a native browser
 * tooltip via the HTML `title` attribute. RN-web strips `title` from View/Text,
 * so we wrap in a real element here. No-op on native, where hover doesn't exist.
 */
const TitleTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({
    text,
    children,
}) =>
    Platform.OS === "web"
        ? React.createElement(
              "div",
              { title: text, style: { display: "flex", flexDirection: "column", minWidth: 0 } },
              children
          )
        : (children as React.ReactElement);

interface ContentItemChipProps {
    item: CalendarItem;
    compact?: boolean;
    /**
     * How many lines the title may occupy before truncating with an ellipsis.
     * Defaults to the compact heuristic (1 when compact, else 2). MonthView
     * raises this to 2 on desktop where cells are tall enough to read more.
     */
    titleLines?: number;
    onFocusChat: (item: CalendarItem) => void;
    onComment: (item: CalendarItem) => void;
    /** Tapping the chip body opens the content details page for editing. */
    onOpen?: (item: CalendarItem) => void;
}

const TYPE_COLORS: Record<string, string> = {
    reel: "rgb(83, 139, 166)",
    post: "rgb(5, 68, 99)",
    story: "rgb(157, 213, 134)",
    carousel: "rgb(236, 214, 148)",
    live: "rgb(232, 185, 49)",
};

/**
 * Tint an `rgb(...)` token to a translucent `rgba(...)`. The old code appended
 * "22" to the rgb string, which is only valid for #hex colors — on rgb() strings
 * it produced an invalid color, so the badge background silently dropped out.
 */
function tint(rgb: string, alpha: number): string {
    const match = rgb.match(/rgba?\(([^)]+)\)/);
    if (!match) return rgb;
    const [r, g, b] = match[1].split(",").map((p) => p.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ContentItemChip: React.FC<ContentItemChipProps> = ({
    item,
    compact = false,
    titleLines,
    onFocusChat,
    onComment,
    onOpen,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const typeColor = TYPE_COLORS[item.type] ?? colors.primary;
    const styles = useStyles(colors, typeColor, compact);

    return (
        <TitleTooltip text={item.title}>
        <Pressable
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={onOpen ? () => onOpen(item) : undefined}
            disabled={!onOpen}
        >
            <View style={styles.accentBar} />
            <View style={styles.body}>
                <Text
                    style={styles.title}
                    numberOfLines={titleLines ?? (compact ? 1 : 2)}
                >
                    {item.title}
                </Text>
                <View style={styles.footer}>
                    <View style={styles.typeBadge}>
                        <View style={styles.typeDot} />
                        <Text style={styles.typeText} numberOfLines={1}>
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
                                size={16}
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
                                size={16}
                                color={colors.primary}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
        </Pressable>
        </TitleTooltip>
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
                chipPressed: {
                    opacity: 0.7,
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
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: tint(typeColor, 0.14),
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                },
                typeDot: {
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: typeColor,
                },
                typeText: {
                    fontSize: compact ? 9 : 10,
                    fontWeight: "700",
                    color: typeColor,
                },
                actions: {
                    flexDirection: "row",
                    // gap: 6,
                },
                actionBtn: {
                    padding: 5,
                },
                actionBtnPressed: {
                    opacity: 0.6,
                },
            }),
        [colors, typeColor, compact]
    );
}

export default ContentItemChip;
