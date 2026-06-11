import { CONTENT_TYPE_LABELS, contentTypeColor } from "@/components/content-calendar/types";
import Colors from "@/shared-uis/constants/Colors";
import {
    faFacebookF,
    faInstagram,
    faLinkedinIn,
    faXTwitter,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
    faCalendarDays,
    faGlobe,
    faImage,
    faLayerGroup,
    faVideo,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ContentUrgencyBadge from "./ContentUrgencyBadge";
import TitleTooltip from "./TitleTooltip";
import { CONTENT_STATUS_LABELS, ContentItem, contentStatusColors } from "./types";

interface ContentGalleryCardProps {
    item: ContentItem;
    onPress: (item: ContentItem) => void;
}

/** Map a content type to a placeholder glyph shown when no media is attached. */
function typeGlyph(type: ContentItem["type"]): IconDefinition {
    switch (type) {
        case "carousel":
            return faLayerGroup;
        case "reel":
        case "live":
            return faVideo;
        default:
            return faImage;
    }
}

/** Map a destination platform to its brand glyph. */
function platformGlyph(platform: string): IconDefinition {
    switch (platform) {
        case "instagram":
            return faInstagram;
        case "facebook":
            return faFacebookF;
        case "youtube":
            return faYoutube;
        case "linkedin":
            return faLinkedinIn;
        case "twitter":
            return faXTwitter;
        default:
            return faGlobe;
    }
}

/**
 * Media-first card used by the Gallery (grid) view. The thumbnail leads, with
 * the content type overlaid on the media and the status / title / destinations
 * below it.
 */
const ContentGalleryCard: React.FC<ContentGalleryCardProps> = ({ item, onPress }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const statusColor = contentStatusColors(item.status, colors);
    const typeColor = contentTypeColor(item.type, colors);
    const firstImage = item.attachments?.find((a) => a.imageUrl)?.imageUrl;

    const dateSource = item.scheduledAt
        ? new Date(item.scheduledAt)
        : new Date(item.date + "T00:00:00");
    const formattedDate = useMemo(
        () =>
            dateSource.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            }),
        [item.date, item.scheduledAt]
    );

    const destinations = item.destinations ?? [];

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => onPress(item)}
        >
            <View style={styles.media}>
                {firstImage ? (
                    <Image
                        source={{ uri: firstImage }}
                        style={styles.mediaImg}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.mediaPlaceholder}>
                        <FontAwesomeIcon
                            icon={typeGlyph(item.type)}
                            size={26}
                            color={colors.textSecondary}
                        />
                    </View>
                )}

                <View style={[styles.typeChip, { backgroundColor: colors.backdrop }]}>
                    <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
                    <Text style={styles.typeChipText}>{CONTENT_TYPE_LABELS[item.type]}</Text>
                </View>
            </View>

            <View style={styles.body}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.fg }]}>
                        {CONTENT_STATUS_LABELS[item.status]}
                    </Text>
                </View>

                <TitleTooltip text={item.title}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>
                </TitleTooltip>

                {item.idea ? (
                    <Text style={styles.idea} numberOfLines={1}>
                        {item.idea}
                    </Text>
                ) : null}

                <View style={styles.footer}>
                    <View style={styles.dateRow}>
                        <FontAwesomeIcon
                            icon={faCalendarDays}
                            size={11}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.dateText}>{formattedDate}</Text>
                        <ContentUrgencyBadge item={item} />
                    </View>

                    {destinations.length > 0 ? (
                        <View style={styles.destRow}>
                            {destinations.slice(0, 3).map((d, i) => (
                                <FontAwesomeIcon
                                    key={`${d.socialAccountId}-${i}`}
                                    icon={platformGlyph(d.platform)}
                                    size={12}
                                    color={colors.textSecondary}
                                />
                            ))}
                            {destinations.length > 3 ? (
                                <Text style={styles.destMore}>+{destinations.length - 3}</Text>
                            ) : null}
                        </View>
                    ) : null}
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
                    width: "100%",
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                cardPressed: {
                    opacity: 0.78,
                },
                media: {
                    width: "100%",
                    aspectRatio: 4 / 3,
                    backgroundColor: colors.tag,
                },
                mediaImg: {
                    width: "100%",
                    height: "100%",
                },
                mediaPlaceholder: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                },
                typeChip: {
                    position: "absolute",
                    top: 8,
                    left: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 7,
                },
                typeDot: {
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                },
                typeChipText: {
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: colors.white,
                },
                body: {
                    padding: 11,
                    gap: 5,
                },
                statusBadge: {
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                },
                statusText: {
                    fontSize: 11,
                    fontWeight: "600",
                },
                title: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                    lineHeight: 19,
                },
                idea: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 16,
                },
                footer: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 3,
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
                destRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                },
                destMore: {
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontWeight: "600",
                },
            }),
        [colors]
    );
}

export default ContentGalleryCard;
