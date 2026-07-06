import SharedCommentsPanel, { PanelComment } from "@/components/shared/CommentsPanel";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { usePublicComments } from "@/hooks/use-public-comments";
import { ShareTier } from "@/hooks/use-public-share";
import { CONTENT_FORMAT_LABELS } from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import {
    Platform as SocialPlatform,
    normalizePlatform,
} from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { ContentStatus, IContent } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { IShareLink } from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendar,
    faChartSimple,
    faComments,
    faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import PublicMediaGallery from "./PublicMediaGallery";
import PublicRichText from "./PublicRichText";
import PublicVariations from "./PublicVariations";

interface Props {
    share: IShareLink & { token: string };
    tier: ShareTier;
    viewerId: string | null;
    viewerName: string | null;
}

/** Audience-safe status label — internal workflow states collapse to "Planned". */
function publicStatusLabel(status?: ContentStatus): string | null {
    switch (status) {
        case ContentStatus.Scheduled:
            return "Scheduled";
        case ContentStatus.Publishing:
            return "Publishing";
        case ContentStatus.Posted:
            return "Published";
        case ContentStatus.PartiallyFailed:
            return "Partially published";
        case ContentStatus.Draft:
        case ContentStatus.InProgress:
        case ContentStatus.PendingReview:
        case ContentStatus.Approved:
        case ContentStatus.Failed:
        case ContentStatus.Rejected:
            return "Planned";
        default:
            return null;
    }
}

/** Formatted schedule/posting date line, or null when unscheduled. */
function formatSchedule(content: IContent): string | null {
    const ts = content.scheduledAt ?? content.postingTimeStamp;
    if (!ts) return null;
    const d = new Date(ts);
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    let time: string | null = null;
    if (content.scheduledAt) {
        time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } else if (content.timeOfPosting) {
        time = content.timeOfPosting;
    }
    return time ? `${date} · ${time}` : date;
}

/** Compact number formatting for performance metrics (1.2k / 3.4M). */
function fmtNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(n);
}

const PublicContentView: React.FC<Props> = ({ share, tier, viewerId, viewerName }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [content, setContent] = useState<IContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!share.resourceId) return;
        const ref = doc(FirestoreDB, "brands", share.brandId, "contents", share.resourceId);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) setNotFound(true);
                else setContent(snap.data() as IContent);
                setLoading(false);
            },
            () => {
                setNotFound(true);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [share.brandId, share.resourceId]);

    const comments = usePublicComments({
        brandId: share.brandId,
        resource: "contents",
        resourceId: share.resourceId,
        viewerId,
        viewerName,
    });

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }
    if (notFound || !content || content.isArchived) {
        return (
            <View style={styles.center}>
                <Text style={styles.notFound}>This content is no longer available.</Text>
            </View>
        );
    }

    // ── Derived display data ─────────────────────────────────────────────────
    const platformKeys: SocialPlatform[] = content.platforms?.length
        ? content.platforms
        : ([normalizePlatform(content.platform)].filter(Boolean) as SocialPlatform[]);

    const statusLabel = publicStatusLabel(content.status);
    const schedule = formatSchedule(content);

    const hashtags = (content.hashtags ?? "")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`));

    const m = content.metrics;
    const metricRows: { label: string; value: string }[] = [];
    if (m) {
        if (m.views != null) metricRows.push({ label: "Views", value: fmtNum(m.views) });
        if (m.likes != null) metricRows.push({ label: "Likes", value: fmtNum(m.likes) });
        if (m.comments != null) metricRows.push({ label: "Comments", value: fmtNum(m.comments) });
        if (m.shares != null) metricRows.push({ label: "Shares", value: fmtNum(m.shares) });
        if (m.reach != null) metricRows.push({ label: "Reach", value: fmtNum(m.reach) });
        if (m.impressions != null) metricRows.push({ label: "Impressions", value: fmtNum(m.impressions) });
        if (m.saves != null) metricRows.push({ label: "Saves", value: fmtNum(m.saves) });
        if (m.engagementRate != null)
            metricRows.push({ label: "Engagement", value: `${m.engagementRate.toFixed(1)}%` });
    }

    // Live post links — prefer per-destination results, fall back to postedUrl.
    const liveLinks: { platform?: string; url: string }[] = [];
    (content.publishResults ?? []).forEach((r) => {
        if (r.status === "published" && r.url) liveLinks.push({ platform: r.platform, url: r.url });
    });
    if (!liveLinks.length && content.postedUrl) liveLinks.push({ url: content.postedUrl });

    const destinations = (content.destinations ?? []).filter((d) => d.username);

    const panelComments: PanelComment[] = comments.comments.map((c) => ({
        id: c.id,
        authorId: c.authorId,
        authorName: c.authorName,
        text: c.text,
        createdAt: c.createdAt,
        parentId: c.parentId,
        resolved: c.resolved,
        snippet: c.snippet,
    }));

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.doc}>
                <Text style={styles.title}>{content.title}</Text>

                {/* Format + platform chips */}
                <View style={styles.chipRow}>
                    {content.contentFormat ? (
                        <View style={styles.formatChip}>
                            <Text style={styles.formatChipText}>
                                {CONTENT_FORMAT_LABELS[content.contentFormat] ?? content.contentFormat}
                            </Text>
                        </View>
                    ) : null}
                    {platformKeys.map((p) => {
                        const meta = SOCIAL_PLATFORM_MAP[p];
                        if (!meta) return null;
                        return (
                            <View key={p} style={styles.platformChip}>
                                <FontAwesomeIcon icon={meta.icon} size={12} color={colors[meta.colorKey]} />
                                <Text style={styles.platformChipText}>{meta.label}</Text>
                            </View>
                        );
                    })}
                    {statusLabel ? (
                        <View style={styles.statusChip}>
                            <Text style={styles.statusChipText}>{statusLabel}</Text>
                        </View>
                    ) : null}
                </View>

                {schedule ? (
                    <View style={styles.scheduleRow}>
                        <FontAwesomeIcon icon={faCalendar} size={12} color={colors.textSecondary} />
                        <Text style={styles.scheduleText}>{schedule}</Text>
                    </View>
                ) : null}

                {/* Media */}
                {content.attachments?.length ? (
                    <View style={styles.mediaWrap}>
                        <PublicMediaGallery attachments={content.attachments} />
                    </View>
                ) : null}

                {/* Copy */}
                {content.description ? (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Brief</Text>
                        <PublicRichText value={content.description} />
                    </View>
                ) : null}

                {content.caption ? (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Caption</Text>
                        <Text style={styles.captionText}>{content.caption}</Text>
                    </View>
                ) : null}

                {hashtags.length ? (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Hashtags</Text>
                        <View style={styles.hashtagWrap}>
                            {hashtags.map((h, i) => (
                                <View key={`${h}-${i}`} style={styles.hashtagChip}>
                                    <Text style={styles.hashtagText}>{h}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {content.script ? (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Script</Text>
                        <PublicRichText value={content.script} />
                    </View>
                ) : null}

                {/* Publishing destinations */}
                {destinations.length ? (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Publishing to</Text>
                        <View style={styles.hashtagWrap}>
                            {destinations.map((d, i) => {
                                const meta = SOCIAL_PLATFORM_MAP[d.platform];
                                return (
                                    <View key={`${d.socialAccountId}-${i}`} style={styles.destChip}>
                                        {meta ? (
                                            <FontAwesomeIcon
                                                icon={meta.icon}
                                                size={12}
                                                color={colors[meta.colorKey]}
                                            />
                                        ) : null}
                                        <Text style={styles.destChipText}>@{d.username}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Per-platform variations */}
                {share.resourceId ? (
                    <PublicVariations
                        brandId={share.brandId}
                        contentId={share.resourceId}
                        content={content}
                    />
                ) : null}

                {/* Performance metrics */}
                {metricRows.length ? (
                    <View style={styles.field}>
                        <View style={styles.metricsHead}>
                            <FontAwesomeIcon icon={faChartSimple} size={13} color={colors.textSecondary} />
                            <Text style={styles.fieldLabel}>Performance</Text>
                        </View>
                        <View style={styles.metricsWrap}>
                            {metricRows.map((mr) => (
                                <View key={mr.label} style={styles.metricPill}>
                                    <Text style={styles.metricValue}>{mr.value}</Text>
                                    <Text style={styles.metricLabel}>{mr.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Live post links */}
                {liveLinks.length ? (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Live post</Text>
                        <View style={styles.hashtagWrap}>
                            {liveLinks.map((l, i) => {
                                const meta = l.platform
                                    ? SOCIAL_PLATFORM_MAP[l.platform as SocialPlatform]
                                    : undefined;
                                return (
                                    <Pressable
                                        key={`${l.url}-${i}`}
                                        style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
                                        onPress={() => Linking.openURL(l.url).catch(() => {})}
                                    >
                                        <FontAwesomeIcon
                                            icon={faUpRightFromSquare}
                                            size={12}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.linkBtnText}>
                                            {meta ? `View on ${meta.label}` : "View live post"}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {tier !== "anon" && (
                    <View style={styles.commentsWrap}>
                        <SharedCommentsPanel
                            comments={panelComments}
                            loading={comments.loading}
                            onAddComment={comments.addComment}
                            onAddReply={comments.addReply}
                            onDeleteComment={comments.deleteComment}
                            title="Comments"
                            titleIcon={faComments}
                            currentUserId={viewerId ?? ""}
                            emptyText="No comments yet. Start the conversation."
                            placeholder="Add a comment…"
                        />
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        scroll: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            alignItems: "center",
            paddingVertical: 24,
            paddingHorizontal: 16,
        },
        doc: {
            width: "100%",
            maxWidth: 760,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 12,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        title: {
            fontSize: 24,
            fontWeight: "800",
            color: colors.text,
        },
        chipRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
        },
        formatChip: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 7,
            backgroundColor: colors.primary,
        },
        formatChipText: {
            fontSize: 11.5,
            fontWeight: "800",
            letterSpacing: 0.3,
            color: colors.onPrimary,
        },
        platformChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 7,
            backgroundColor: colors.tag,
        },
        platformChipText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.text,
        },
        statusChip: {
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 7,
            backgroundColor: colors.aliceBlue,
        },
        statusChipText: {
            fontSize: 11.5,
            fontWeight: "700",
            color: colors.primary,
        },
        scheduleRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            marginTop: 10,
        },
        scheduleText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        mediaWrap: {
            marginTop: 18,
        },
        field: {
            marginTop: 20,
        },
        fieldLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 8,
        },
        captionText: {
            fontSize: 15,
            lineHeight: 23,
            color: colors.text,
        },
        hashtagWrap: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        hashtagChip: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: colors.aliceBlue,
        },
        hashtagText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.primary,
        },
        destChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.tag,
        },
        destChipText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        metricsHead: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            marginBottom: 8,
        },
        metricsWrap: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
        },
        metricPill: {
            minWidth: 84,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: colors.background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 4,
            shadowOpacity: 0.05,
            elevation: 1,
        },
        metricValue: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
        },
        metricLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 2,
        },
        linkBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9,
            backgroundColor: colors.aliceBlue,
        },
        linkBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        commentsWrap: {
            marginTop: 28,
            height: 480,
        },
        center: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        notFound: {
            fontSize: 15,
            color: colors.textSecondary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PublicContentView;
