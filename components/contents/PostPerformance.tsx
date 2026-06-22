/**
 * Post-performance section shown on the Content details page once a content is
 * Posted. Composes two already-shipped capabilities (no logic rewritten):
 *   • Basic post analytics  → useContentPostInsights → /analytics/media/:id
 *   • Comments + replies     → <MediaCommentsThread> (shared with Inbox Media tab)
 *
 * The published media id (content.publishedIds[platform]) + the matching
 * destination's socialAccountId give the (mediaId, socialId, channel) triple
 * both the analytics and comment endpoints consume.
 */
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";

import { formatCompact } from "@/components/analytics/charts";
import MediaCommentsThread from "@/components/inbox/MediaCommentsThread";
import { InboxChannel, InboxMedia } from "@/components/inbox/types";
import { channelColor, channelIcon, channelLabel } from "@/components/inbox/utils";
import { Text } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import { useContentPostInsights } from "@/hooks/useContentPostInsights";
import Colors from "@/shared-uis/constants/Colors";
import { ContentItem } from "./types";

interface Props {
    content: ContentItem;
}

const PUBLISHABLE: InboxChannel[] = ["instagram", "facebook"];

/** Build the (mediaId, socialId, channel) targets from a posted content. */
function postedTargets(content: ContentItem): { platform: InboxChannel; media: InboxMedia }[] {
    const ids = content.publishedIds ?? {};
    const dests = content.destinations ?? [];
    const thumb = content.attachments?.find((a) => a.imageUrl || a.playUrl);
    const thumbUrl = thumb?.imageUrl ?? thumb?.playUrl;

    const out: { platform: InboxChannel; media: InboxMedia }[] = [];
    for (const platform of PUBLISHABLE) {
        const mediaId = ids[platform];
        if (!mediaId) continue;
        const dest = dests.find((d) => d.platform === platform);
        if (!dest) continue; // can't resolve the serving account
        out.push({
            platform,
            media: {
                id: mediaId,
                channel: platform,
                socialId: dest.socialAccountId,
                thumbnailUrl: thumbUrl,
                caption: content.caption,
                permalink: content.postedUrl,
                timestamp: 0,
                commentsCount: 0,
            },
        });
    }
    return out;
}

const PostPerformance: React.FC<Props> = ({ content }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    const targets = useMemo(() => postedTargets(content), [content]);
    const [activePlatform, setActivePlatform] = useState<InboxChannel>(
        targets[0]?.platform ?? "instagram"
    );

    if (targets.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.heading}>Post performance</Text>
                <Text style={styles.muted}>
                    Performance and comments will appear here once this post is live on a
                    connected account.
                </Text>
            </View>
        );
    }

    const active = targets.find((t) => t.platform === activePlatform) ?? targets[0];

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.heading}>Post performance</Text>
                {targets.length > 1 ? (
                    <View style={styles.tabs}>
                        {targets.map((t) => {
                            const on = t.platform === active.platform;
                            return (
                                <Pressable
                                    key={t.platform}
                                    onPress={() => setActivePlatform(t.platform)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: on }}
                                    accessibilityLabel={`Show ${channelLabel(t.platform)} performance`}
                                    style={[
                                        styles.tab,
                                        on && { backgroundColor: channelColor(t.platform, colors) },
                                    ]}
                                >
                                    <FontAwesomeIcon
                                        icon={channelIcon(t.platform)}
                                        size={12}
                                        color={on ? colors.white : colors.textSecondary}
                                    />
                                    <Text style={[styles.tabText, on && { color: colors.white }]}>
                                        {channelLabel(t.platform)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ) : null}
            </View>

            <PostAnalyticsPanel media={active.media} embedHeight={xl ? 460 : 380} />
        </View>
    );
};

/**
 * Analytics (basic post insights) + comments for one published media. The common
 * module reused by the Content details page and the Inbox Media "expand" modal —
 * pass any InboxMedia (mediaId + socialId + channel) and it renders the full
 * post-performance view.
 */
export const PostAnalyticsPanel: React.FC<{
    media: InboxMedia;
    embedHeight: number;
    /** When true, the comments area flexes to fill the parent (for a bounded
     * modal) instead of reserving a fixed `embedHeight` block. */
    fillHeight?: boolean;
}> = ({ media, embedHeight, fillHeight }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const { data, loading, error } = useContentPostInsights(media.id, media.socialId, media.channel);
    const permalink = data?.permalink || media.permalink;

    const openPost = () => {
        if (permalink) Linking.openURL(permalink);
    };

    return (
        <View style={fillHeight ? styles.panelFill : undefined}>
            {/* Post preview header */}
            <View style={styles.previewRow}>
                {media.thumbnailUrl ? (
                    <Image source={{ uri: media.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
                ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <FontAwesomeIcon
                            icon={channelIcon(media.channel)}
                            size={16}
                            color={colors.textSecondary}
                        />
                    </View>
                )}
                <View style={styles.previewMeta}>
                    <Text style={styles.previewCaption} numberOfLines={2}>
                        {media.caption || "(no caption)"}
                    </Text>
                    {permalink ? (
                        <Pressable
                            onPress={openPost}
                            style={styles.viewLink}
                            hitSlop={8}
                            accessibilityRole="link"
                            accessibilityLabel={`View this post on ${channelLabel(media.channel)}`}
                        >
                            <Text style={styles.viewLinkText}>
                                View on {channelLabel(media.channel)}
                            </Text>
                            <FontAwesomeIcon
                                icon={faArrowUpRightFromSquare}
                                size={11}
                                color={colors.primary}
                            />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* KPI cards */}
            {loading ? (
                <View style={styles.kpiLoading}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : error || !data ? (
                <Text style={styles.muted}>{error ?? "Couldn’t load analytics for this post."}</Text>
            ) : (
                <>
                    <View style={styles.kpiGrid}>
                        {data.metrics.map((m) => (
                            <View key={m.key} style={styles.kpi}>
                                <Text style={[styles.kpiValue, !m.available && styles.kpiUnavailable]}>
                                    {m.available ? formatCompact(m.value) : "—"}
                                </Text>
                                <Text style={styles.kpiLabel}>{m.label}</Text>
                            </View>
                        ))}
                    </View>
                    {data.metrics.some((m) => !m.available) ? (
                        <Text style={styles.footnote}>
                            “—” metrics need an Instagram Business/Creator account with insights
                            access.
                        </Text>
                    ) : null}
                </>
            )}

            {/* Comments + replies (shared thread) */}
            <Text style={styles.subheading}>Comments</Text>
            <View
                style={[
                    styles.commentsWrap,
                    fillHeight ? styles.commentsFill : { height: embedHeight },
                ]}
            >
                <MediaCommentsThread media={media} />
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: colors.card ?? colors.background,
                    borderRadius: 16,
                    padding: 16,
                    gap: 14,
                    // Lift off the page with a shadow (no border).
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                headerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                },
                heading: { fontSize: 16, fontWeight: "700", color: colors.text },
                subheading: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.textSecondary,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    marginTop: 4,
                },
                muted: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

                // Platform tabs
                tabs: { flexDirection: "row", gap: 8 },
                tab: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: colors.tag,
                },
                tabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },

                // Post preview
                previewRow: { flexDirection: "row", gap: 12, alignItems: "center" },
                thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.tag },
                thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
                previewMeta: { flex: 1, gap: 4 },
                previewCaption: { fontSize: 14, fontWeight: "600", color: colors.text },
                viewLink: { flexDirection: "row", alignItems: "center", gap: 6 },
                viewLinkText: { fontSize: 13, fontWeight: "600", color: colors.primary },

                // KPI cards
                kpiLoading: { paddingVertical: 24, alignItems: "center" },
                kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
                kpi: {
                    flexGrow: 1,
                    flexBasis: "30%",
                    maxWidth: "33.33%",
                    minWidth: 92,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    gap: 4,
                },
                kpiValue: { fontSize: 20, fontWeight: "800", color: colors.text },
                kpiUnavailable: { color: colors.textSecondary, fontWeight: "600" },
                kpiLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
                footnote: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },

                // Embedded comments
                commentsWrap: {
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.background,
                },
                // Fill mode (bounded modal): panel + comments flex to fit.
                panelFill: { flex: 1, minHeight: 0 },
                commentsFill: { flex: 1, minHeight: 0 },
            }),
        [colors]
    );
}

export default PostPerformance;
