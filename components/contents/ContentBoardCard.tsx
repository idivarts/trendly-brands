import { CONTENT_TYPE_LABELS, contentTypeColor } from "@/components/content-calendar/types";
import Colors from "@/shared-uis/constants/Colors";
import { faAlignLeft, faImage, faLayerGroup, faVideo } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ContentUrgencyBadge from "./ContentUrgencyBadge";
import TitleTooltip from "./TitleTooltip";
import { ContentItem } from "./types";

function typeGlyph(type: ContentItem["type"]): IconDefinition {
    switch (type) {
        case "carousel":
            return faLayerGroup;
        case "reel":
        case "live":
            return faVideo;
        case "text":
            return faAlignLeft;
        default:
            return faImage;
    }
}

/** Compact card shown inside a Board column. Status is implied by the column. */
const ContentBoardCard: React.FC<{ item: ContentItem }> = ({ item }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const typeColor = contentTypeColor(item.type, colors);
    const firstImage = item.attachments?.find((a) => a.imageUrl)?.imageUrl;
    const formattedDate = useMemo(() => {
        const d = item.scheduledAt ? new Date(item.scheduledAt) : new Date(item.date + "T00:00:00");
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    }, [item.date, item.scheduledAt]);

    return (
        <View style={styles.card}>
            <View style={styles.thumb}>
                {firstImage ? (
                    <Image source={{ uri: firstImage }} style={styles.thumbImg} resizeMode="cover" />
                ) : (
                    <FontAwesomeIcon icon={typeGlyph(item.type)} size={16} color={colors.textSecondary} />
                )}
            </View>

            <View style={styles.info}>
                <TitleTooltip text={item.title}>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.title}
                    </Text>
                </TitleTooltip>
                <View style={styles.metaRow}>
                    <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
                    <Text style={styles.meta} numberOfLines={1}>
                        {CONTENT_TYPE_LABELS[item.type]} · {formattedDate}
                    </Text>
                    <ContentUrgencyBadge item={item} />
                </View>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                card: {
                    flexDirection: "row",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.07,
                    elevation: 2,
                },
                thumb: {
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                },
                thumbImg: {
                    width: "100%",
                    height: "100%",
                },
                info: {
                    flex: 1,
                    gap: 5,
                    justifyContent: "center",
                },
                title: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.text,
                    lineHeight: 17,
                },
                metaRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                typeDot: {
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                },
                meta: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontWeight: "500",
                    flexShrink: 1,
                },
            }),
        [colors]
    );
}

export default ContentBoardCard;
