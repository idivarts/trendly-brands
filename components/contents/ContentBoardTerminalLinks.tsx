import Colors from "@/shared-uis/constants/Colors";
import {
    faBoxArchive,
    faCalendarCheck,
    faChevronRight,
    faPaperPlane,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { contentStatusColors } from "./types";

export interface TerminalCounts {
    scheduled: number;
    posted: number;
    archived: number;
}

interface ContentBoardTerminalLinksProps {
    counts: TerminalCounts;
    /** Navigate to one of the gallery-only library pages. */
    onOpen: (path: string) => void;
}

type LinkSpec = {
    key: keyof TerminalCounts;
    label: string;
    caption: string;
    path: string;
    icon: IconDefinition;
    /** Tint for the leading icon chip; falls back to neutral when undefined. */
    tint?: { fg: string; bg: string };
};

/**
 * Trailing rail on the Content Board for the three *terminal* states that aren't
 * part of the authoring funnel: Scheduled, Posted, Archived. They navigate to
 * their gallery-only library pages rather than acting as drag targets, so they
 * are styled as elevated nav pills (icon + label + count + chevron) — distinct
 * from the tinted, droppable columns to their left. Mirrors the links in the
 * Contents overflow menu, but surfaced with live counts.
 */
const ContentBoardTerminalLinks: React.FC<ContentBoardTerminalLinksProps> = ({
    counts,
    onOpen,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const links: LinkSpec[] = [
        {
            key: "scheduled",
            label: "Scheduled",
            caption: "Queued to publish",
            path: "/contents/scheduled",
            icon: faCalendarCheck,
            tint: contentStatusColors("scheduled", colors),
        },
        {
            key: "posted",
            label: "Posted",
            caption: "Already live",
            path: "/contents/posted",
            icon: faPaperPlane,
            tint: contentStatusColors("posted", colors),
        },
        {
            key: "archived",
            label: "Archived",
            caption: "Archived / deleted",
            path: "/contents/archived",
            icon: faBoxArchive,
        },
    ];

    return (
        <View style={styles.rail}>
            <Text style={styles.railHeading}>Beyond the board</Text>

            {links.map((link) => {
                const iconFg = link.tint?.fg ?? colors.textSecondary;
                const iconBg = link.tint?.bg ?? colors.tag;
                const count = counts[link.key];

                return (
                    <Pressable
                        key={link.key}
                        accessibilityRole="link"
                        accessibilityLabel={`${link.label}, ${count} ${
                            count === 1 ? "item" : "items"
                        }`}
                        style={({ pressed, hovered }: any) => [
                            styles.pill,
                            hovered && styles.pillHovered,
                            pressed && styles.pillPressed,
                        ]}
                        onPress={() => onOpen(link.path)}
                    >
                        <View style={[styles.iconChip, { backgroundColor: iconBg }]}>
                            <FontAwesomeIcon icon={link.icon} size={14} color={iconFg} />
                        </View>

                        <View style={styles.pillText}>
                            <Text style={styles.pillLabel} numberOfLines={1}>
                                {link.label}
                            </Text>
                            <Text style={styles.pillCaption} numberOfLines={1}>
                                {link.caption}
                            </Text>
                        </View>

                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{count}</Text>
                        </View>

                        <FontAwesomeIcon
                            icon={faChevronRight}
                            size={12}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                rail: {
                    width: 230,
                    flexShrink: 0,
                    gap: 10,
                    paddingTop: 2,
                },
                railHeading: {
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                    opacity: 0.8,
                    marginBottom: 2,
                    marginLeft: 4,
                },
                pill: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                pillHovered: {
                    shadowOpacity: 0.12,
                    transform: [{ translateY: -1 }],
                },
                pillPressed: {
                    opacity: 0.7,
                },
                iconChip: {
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                },
                pillText: {
                    flex: 1,
                    minWidth: 0,
                },
                pillLabel: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
                pillCaption: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 1,
                },
                countBadge: {
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    paddingHorizontal: 6,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    justifyContent: "center",
                },
                countText: {
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
            }),
        [colors]
    );
}

export default ContentBoardTerminalLinks;
