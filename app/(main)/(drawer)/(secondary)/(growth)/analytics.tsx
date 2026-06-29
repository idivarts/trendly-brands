import { LockedOverlay } from "@/components/billing/EntitlementGate";
import { BarList, formatCompact, MiniLineChart } from "@/components/analytics/charts";
import ResyncInline from "@/components/inbox/ResyncInline";
import { useEntitlements } from "@/hooks/use-entitlements";
import PageHeader from "@/components/ui/page-header";
import { useBrandAnalytics } from "@/hooks/useBrandAnalytics";
import AppLayout from "@/layouts/app-layout";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { AnalyticsRange, IAccountAnalytics } from "@/types/Analytics";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const RANGES: { key: AnalyticsRange; label: string }[] = [
    { key: "7d", label: "7 days" },
    { key: "28d", label: "28 days" },
    { key: "90d", label: "90 days" },
];

const DETAIL_METRICS = ["reach", "impressions", "views", "engagement"];
const DIM_LABEL: Record<string, string> = {
    age: "Age",
    gender: "Gender",
    country: "Top countries",
    city: "Top cities",
};

const AnalyticsScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 900;
    const styles = useMemo(() => makeStyles(colors, isWide), [colors, isWide]);

    const { analyticsLocked } = useEntitlements();
    const [range, setRange] = useState<AnalyticsRange>("28d");
    const [selectedId, setSelectedId] = useState<string>("all");
    const { data, loading, error, reload, resyncAccount } = useBrandAnalytics(range);

    const platformMeta = (platform: string): { label: string; color: string } => {
        switch (platform) {
            case "instagram": return { label: "Instagram", color: colors.socialInstagram };
            case "facebook": return { label: "Facebook", color: colors.socialFacebook };
            case "youtube": return { label: "YouTube", color: colors.socialYoutube };
            case "linkedin": return { label: "LinkedIn", color: colors.socialLinkedin };
            case "linkedin_page": return { label: "LinkedIn Page", color: colors.socialLinkedin };
            case "twitter": return { label: "X", color: colors.socialTwitter };
            case "reddit": return { label: "Reddit", color: colors.socialReddit };
            default: return { label: platform, color: colors.primary };
        }
    };

    const accounts = data?.accounts ?? [];
    const selectedAccount =
        selectedId === "all" ? null : accounts.find((a) => a.socialId === selectedId) ?? null;

    // ── Summary KPI cards from unified totals ─────────────────────────────────
    const renderSummary = () => {
        const t = data?.totals ?? {};
        const cards = [
            { label: "Followers", value: t.followers ?? 0 },
            { label: "Reach", value: t.reach ?? 0 },
            { label: "Impressions", value: t.impressions ?? 0 },
            { label: "Engagement", value: t.engagement ?? 0 },
        ];
        return (
            <View style={styles.kpiRow}>
                {cards.map((c) => (
                    <View key={c.label} style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{formatCompact(c.value)}</Text>
                        <Text style={styles.kpiLabel}>{c.label}</Text>
                    </View>
                ))}
            </View>
        );
    };

    // ── Account header (avatar + name + platform + followers) ─────────────────
    const renderAccountHeader = (a: IAccountAnalytics) => {
        const meta = platformMeta(a.platform);
        return (
            <View style={styles.acctHeader}>
                {a.profileImageUrl ? (
                    <Image source={{ uri: a.profileImageUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>
                            {(a.displayName || a.username || "?").slice(0, 1).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={styles.acctHeaderText}>
                    <Text style={styles.acctName} numberOfLines={1}>
                        {a.displayName || a.username}
                    </Text>
                    <View style={styles.acctMetaRow}>
                        <View style={[styles.platformPill, { backgroundColor: meta.color }]}>
                            <Text style={styles.platformPillText}>{meta.label}</Text>
                        </View>
                        <Text style={styles.acctFollowers}>
                            {formatCompact(a.followerCount)} followers
                        </Text>
                        {a.stale && <Text style={styles.staleTag}>cached</Text>}
                    </View>
                </View>
                <ResyncInline
                    watch={data?.generatedAt}
                    action={() => resyncAccount(a.socialId)}
                    label="Resync insights"
                />
            </View>
        );
    };

    const renderTopMedia = (a: IAccountAnalytics) => {
        if (!a.topMedia || a.topMedia.length === 0) return null;
        return (
            <View style={styles.block}>
                <Text style={styles.blockTitle}>Top performing content</Text>
                <View style={styles.mediaGrid}>
                    {a.topMedia.map((m) => (
                        <Pressable
                            key={m.id}
                            style={styles.mediaCard}
                            onPress={() => m.permalink && Linking.openURL(m.permalink)}
                        >
                            {m.thumbnailUrl || m.mediaUrl ? (
                                <Image
                                    source={{ uri: m.thumbnailUrl || m.mediaUrl }}
                                    style={styles.mediaThumb}
                                />
                            ) : (
                                <View style={[styles.mediaThumb, styles.mediaThumbFallback]}>
                                    <Text style={styles.mediaFallbackText} numberOfLines={3}>
                                        {m.caption || "Post"}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.mediaStats}>
                                <Text style={styles.mediaStat}>♥ {formatCompact(m.likes)}</Text>
                                <Text style={styles.mediaStat}>💬 {formatCompact(m.comments)}</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    };

    const renderDemographics = (a: IAccountAnalytics) => {
        if (!a.demographics || a.demographics.length === 0) return null;
        return (
            <View style={styles.block}>
                <Text style={styles.blockTitle}>Audience</Text>
                <View style={[styles.demoRow, isWide && styles.demoRowWide]}>
                    {a.demographics.map((d) => (
                        <View key={d.dimension} style={[styles.demoCard, isWide && styles.demoCardWide]}>
                            <Text style={styles.demoTitle}>{DIM_LABEL[d.dimension] ?? d.dimension}</Text>
                            <BarList entries={d.entries} color={platformMeta(a.platform).color} />
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    // ── Full account detail ───────────────────────────────────────────────────
    const renderAccountDetail = (a: IAccountAnalytics) => {
        const meta = platformMeta(a.platform);
        return (
            <View style={styles.card}>
                {renderAccountHeader(a)}
                {!a.supported && (
                    <Text style={styles.unsupportedNote}>
                        Deeper analytics for {meta.label} are coming in a later phase. For now we
                        show your follower count.
                    </Text>
                )}
                {a.error && <Text style={styles.errorNote}>{a.error}</Text>}

                {a.supported &&
                    DETAIL_METRICS.map((key) => {
                        const m = a.metrics?.[key];
                        if (!m || !m.available) return null;
                        const series = (m.series ?? []).map((p) => p.value);
                        return (
                            <View key={key} style={styles.metricBlock}>
                                <View style={styles.metricHead}>
                                    <Text style={styles.metricLabel}>{m.label}</Text>
                                    <Text style={styles.metricTotal}>{formatCompact(m.total)}</Text>
                                </View>
                                {series.length > 1 && (
                                    <MiniLineChart values={series} color={meta.color} height={120} />
                                )}
                            </View>
                        );
                    })}

                {a.supported && renderDemographics(a)}
                {a.supported && renderTopMedia(a)}
            </View>
        );
    };

    // ── Compact account card (All view) ───────────────────────────────────────
    const renderAccountCompact = (a: IAccountAnalytics) => {
        const meta = platformMeta(a.platform);
        const reach = a.metrics?.reach;
        const series = (reach?.series ?? []).map((p) => p.value);
        return (
            <Pressable
                key={a.socialId}
                style={styles.card}
                onPress={() => setSelectedId(a.socialId)}
            >
                {renderAccountHeader(a)}
                {!a.supported ? (
                    <Text style={styles.unsupportedNote}>
                        Deeper analytics coming soon — tap to view profile stats.
                    </Text>
                ) : (
                    <>
                        {series.length > 1 ? (
                            <View style={styles.metricBlock}>
                                <View style={styles.metricHead}>
                                    <Text style={styles.metricLabel}>Reach</Text>
                                    <Text style={styles.metricTotal}>
                                        {formatCompact(reach?.total ?? 0)}
                                    </Text>
                                </View>
                                <MiniLineChart values={series} color={meta.color} height={90} />
                            </View>
                        ) : (
                            <Text style={styles.compactHint}>Tap to view full report ›</Text>
                        )}
                    </>
                )}
            </Pressable>
        );
    };

    const renderBody = () => {
        if (loading && !data) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            );
        }
        if (error) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.errorNote}>{error}</Text>
                    <Pressable style={styles.retryBtn} onPress={reload}>
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            );
        }
        if (accounts.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>No connected accounts yet</Text>
                    <Text style={styles.emptyBody}>
                        Connect your Instagram or Facebook page to see unified analytics here.
                    </Text>
                </View>
            );
        }

        return (
            <>
                {renderSummary()}

                {/* Account switcher */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    {[{ socialId: "all", displayName: "All accounts" } as any, ...accounts].map(
                        (a) => {
                            const active = selectedId === a.socialId;
                            return (
                                <Pressable
                                    key={a.socialId}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setSelectedId(a.socialId)}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                        {a.socialId === "all"
                                            ? "All accounts"
                                            : a.displayName || a.username}
                                    </Text>
                                </Pressable>
                            );
                        }
                    )}
                </ScrollView>

                {selectedAccount
                    ? renderAccountDetail(selectedAccount)
                    : accounts.map((a) => renderAccountCompact(a))}
            </>
        );
    };

    return (
        <AppLayout>
            <PageHeader title="Reporting & Analytics" />
            {analyticsLocked ? (
                <LockedOverlay
                    title="Analytics is a Pro feature"
                    subtitle="Upgrade to unlock follower, reach, engagement & audience insights across your connected socials."
                >
                    <ScrollView
                        contentContainerStyle={styles.page}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderSummary()}
                    </ScrollView>
                </LockedOverlay>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.page}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Range selector */}
                    <View style={styles.rangeRow}>
                        {RANGES.map((r) => {
                            const active = range === r.key;
                            return (
                                <Pressable
                                    key={r.key}
                                    style={[styles.rangeBtn, active && styles.rangeBtnActive]}
                                    onPress={() => setRange(r.key)}
                                >
                                    <Text style={[styles.rangeText, active && styles.rangeTextActive]}>
                                        {r.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {renderBody()}
                </ScrollView>
            )}
        </AppLayout>
    );
};

function makeStyles(colors: ReturnType<typeof Colors>, isWide: boolean) {
    const maxWidth = isWide ? 960 : undefined;
    const cardShadow = {
        shadowColor: colors.black,
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        ...Platform.select({ android: { elevation: 3 } }),
    };
    return StyleSheet.create({
        page: {
            paddingHorizontal: isWide ? 32 : 16,
            paddingTop: 16,
            paddingBottom: 48,
            ...(maxWidth ? { maxWidth, alignSelf: "center" as const, width: "100%" } : {}),
        },
        centered: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 64,
            gap: 10,
        },
        emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
        emptyBody: {
            color: colors.subtitleGray,
            fontSize: 14,
            textAlign: "center",
            maxWidth: 360,
            lineHeight: 21,
        },

        // Range selector
        rangeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
        rangeBtn: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        rangeBtnActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primaryShadow,
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            ...Platform.select({ android: { elevation: 3 } }),
        },
        rangeText: { color: colors.subtitleGray, fontSize: 13, fontWeight: "700" },
        rangeTextActive: { color: colors.onPrimary },

        // KPI cards
        kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 18 },
        kpiCard: {
            flexGrow: 1,
            flexBasis: isWide ? "22%" : "44%",
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            ...cardShadow,
        },
        kpiValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
        kpiLabel: { color: colors.subtitleGray, fontSize: 12, marginTop: 4, fontWeight: "600" },

        // Account chips
        chipRow: { gap: 8, paddingBottom: 4, marginBottom: 14 },
        chip: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        chipActive: { backgroundColor: colors.primary },
        chipText: { color: colors.subtitleGray, fontSize: 13, fontWeight: "700" },
        chipTextActive: { color: colors.onPrimary },

        // Account card
        card: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: isWide ? 20 : 16,
            marginBottom: 16,
            ...cardShadow,
        },
        acctHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
        avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tag },
        avatarFallback: { alignItems: "center", justifyContent: "center" },
        avatarInitial: { color: colors.text, fontSize: 18, fontWeight: "800" },
        acctHeaderText: { flex: 1 },
        acctName: { color: colors.text, fontSize: 16, fontWeight: "800" },
        acctMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
        platformPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
        platformPillText: { color: colors.white, fontSize: 10, fontWeight: "800" },
        acctFollowers: { color: colors.subtitleGray, fontSize: 12 },
        staleTag: { color: colors.subtitleGray, fontSize: 11, fontStyle: "italic" },

        unsupportedNote: {
            color: colors.subtitleGray,
            fontSize: 13,
            marginTop: 12,
            lineHeight: 19,
        },
        compactHint: { color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 12 },
        errorNote: { color: colors.red, fontSize: 13, marginTop: 10 },

        // Metric block
        metricBlock: { marginTop: 16 },
        metricHead: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
        },
        metricLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },
        metricTotal: { color: colors.text, fontSize: 16, fontWeight: "800" },

        // Generic block
        block: { marginTop: 18 },
        blockTitle: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 10 },

        // Demographics
        demoRow: { gap: 12 },
        demoRowWide: { flexDirection: "row" },
        demoCard: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 14,
            ...cardShadow,
        },
        demoCardWide: { flex: 1 },
        demoTitle: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 10 },

        // Media grid
        mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
        mediaCard: {
            width: isWide ? 130 : 104,
            backgroundColor: colors.card,
            borderRadius: 12,
            overflow: "hidden",
            ...cardShadow,
        },
        mediaThumb: { width: "100%", height: isWide ? 130 : 104, backgroundColor: colors.tag },
        mediaThumbFallback: { alignItems: "center", justifyContent: "center", padding: 8 },
        mediaFallbackText: { color: colors.subtitleGray, fontSize: 11, textAlign: "center" },
        mediaStats: { flexDirection: "row", justifyContent: "space-between", padding: 8 },
        mediaStat: { color: colors.subtitleGray, fontSize: 11, fontWeight: "600" },

        // Retry
        retryBtn: {
            paddingHorizontal: 18,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: colors.primary,
        },
        retryText: { color: colors.onPrimary, fontSize: 13, fontWeight: "700" },
    });
}

export default AnalyticsScreen;
