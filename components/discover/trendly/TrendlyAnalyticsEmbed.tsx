import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts/auth-context.provider";
import {
    ISocialAnalytics,
    ISocials,
} from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { View } from "@/shared-uis/components/theme/Themed";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { getTrustabilityLevel } from "@/utils/trustability";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Image, Linking, Platform, ScrollView, useWindowDimensions } from "react-native";
import {
    ActivityIndicator,
    Card,
    Divider,
    Icon,
    List,
    Text,
} from "react-native-paper";
import { Stars, qualityScoreToStars } from "@/shared-uis/components/rating-section";
import type { InfluencerItem } from "../discover-types";
import EditSocialMetricsModal from "./EditSocialMetricsModal";

interface IProps {
    influencer: InfluencerItem;
    selectedBrand: Brand;
    initialSocial?: ISocials | null;
    initialAnalytics?: ISocialAnalytics | null;
    onLoadingChange?: (loading: boolean) => void;
}

const ACCENT = {
    blue: "#3B82F6",
    purple: "#8B5CF6",
    pink: "#EC4899",
    amber: "#F59E0B",
    emerald: "#10B981",
    teal: "#14B8A6",
    rose: "#F43F5E",
    sky: "#0EA5E9",
};

const tintBg = (hex: string, opacity = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const NICHE_COLORS = [
    ACCENT.blue, ACCENT.purple, ACCENT.pink, ACCENT.emerald,
    ACCENT.amber, ACCENT.sky, ACCENT.rose, ACCENT.teal,
];

const TrendlyAnalyticsEmbed = React.forwardRef<any, IProps>(
    ({ influencer, selectedBrand, initialSocial, initialAnalytics, onLoadingChange }, ref) => {
        const { manager } = useAuthContext();
        const { width } = useWindowDimensions();
        const [loading, setLoading] = useState(false);
        const [social, setSocial] = useState<ISocials | null>(null);
        const [analytics, setAnalytics] = useState<ISocialAnalytics | null>(null);
        const [isEditModalVisible, setIsEditModalVisible] = useState(false);
        const [isSaving, setIsSaving] = useState(false);
        const [saveError, setSaveError] = useState<string | null>(null);
        const [editedSocial, setEditedSocial] = useState<Partial<ISocials>>({});
        const [isRescraping, setIsRescraping] = useState(false);
        const isAdmin = manager?.isAdmin === true;
        const hasChanges = Object.keys(editedSocial).length > 0;
        const theme = useTheme();
        const colors = Colors(theme);

        const loadInfluencer = async () => {
            try {
                onLoadingChange?.(true);
                setLoading(true);
                const body = await HttpWrapper.fetch(
                    `/discovery/brands/${selectedBrand?.id || ""}/influencers/${influencer.id
                    }`,
                    {
                        method: "GET",
                        headers: {
                            "content-type": "application/json",
                        },
                    }
                ).then(async (res) => res.json());

                const s = body.social as ISocials | undefined;
                const a = body.analysis as ISocialAnalytics | undefined;

                if (s) setSocial(s);
                if (a) setAnalytics(a);
            } catch (e) {
                // no-op
            } finally {
                setLoading(false);
                onLoadingChange?.(false);
            }
        };

        useEffect(() => {
            if (initialSocial || initialAnalytics) {
                setSocial(initialSocial ?? null);
                setAnalytics(initialAnalytics ?? null);
                setEditedSocial({});
                setSaveError(null);
                setLoading(false);
                onLoadingChange?.(false);
            }
        }, [initialSocial, initialAnalytics, onLoadingChange]);

        const handleSaveChanges = async () => {
            if (!social?.id || !selectedBrand?.id || !hasChanges) return;

            try {
                setIsSaving(true);
                setSaveError(null);
                const updatedSocial = { ...social, ...editedSocial };

                const requestBody = {
                    name: updatedSocial.name,
                    bio: updatedSocial.bio,
                    category: updatedSocial.category,
                    follower_count: updatedSocial.follower_count,
                    following_count: updatedSocial.following_count,
                    content_count: updatedSocial.content_count,
                    profile_verified: updatedSocial.profile_verified,
                    links: updatedSocial.links,
                    gender: updatedSocial.gender,
                    quality_score: updatedSocial.quality_score,
                    niches: updatedSocial.niches,
                    location: updatedSocial.location,
                };

                const response = await HttpWrapper.fetch(
                    `/discovery/brands/${selectedBrand.id}/influencers/${influencer.id}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.message || "Failed to save changes. Please try again."
                    );
                }

                setSocial(updatedSocial);
                setIsEditModalVisible(false);
                setEditedSocial({});
            } catch (e: any) {
                console.error("Error saving social data:", e);
                const errorMessage =
                    e?.message || "Failed to save changes. Please try again.";
                setSaveError(errorMessage);
            } finally {
                setIsSaving(false);
            }
        };

        const handleEditClick = () => {
            if (social) {
                setEditedSocial({});
                setSaveError(null);
                setIsEditModalVisible(true);
            }
        };

        const handleRescrape = async () => {
            if (!selectedBrand?.id) return;

            try {
                setIsRescraping(true);
                const response = await HttpWrapper.fetch(
                    `/discovery/brands/${selectedBrand.id}/influencers/${influencer.id}/rescrape`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.message || "Failed to rescrape. Please try again."
                    );
                }

                Toaster.success("Rescrape initiated successfully!");
                await loadInfluencer();
            } catch (e: any) {
                console.error("Error rescrapting influencer:", e);
                const errorMessage = e?.message || "Failed to rescrape. Please try again.";
                Toaster.error(errorMessage);
            } finally {
                setIsRescraping(false);
            }
        };

        React.useImperativeHandle(
            ref,
            () => ({
                handleEditClick,
                handleRescrape,
                isAdmin,
                openEditModal: handleEditClick,
            }),
            [handleEditClick, handleRescrape, isAdmin]
        );

        useEffect(() => {
            if (!selectedBrand?.id) {
                onLoadingChange?.(false);
                return;
            }

            if (initialSocial || initialAnalytics) return;

            loadInfluencer();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [selectedBrand, influencer.id, initialSocial, initialAnalytics, onLoadingChange]);

        const formatCompactNumber = (n: number) => {
            const abs = Math.abs(n);
            const formatWith1Decimal = (value: number) => {
                const rounded = value.toFixed(1);
                return rounded.endsWith(".0") ? rounded.slice(0, -2) : rounded;
            };
            if (abs < 1_000) return formatWith1Decimal(n);
            if (abs < 1_000_000) return `${formatWith1Decimal(n / 1_000)}K`;
            if (abs < 1_000_000_000) return `${formatWith1Decimal(n / 1_000_000)}M`;
            return `${formatWith1Decimal(n / 1_000_000_000)}B`;
        };

        const formatNumber = (n?: number | null) => {
            if (n === null || n === undefined) return "—";
            if (Platform.OS !== "web") return formatCompactNumber(n);
            try {
                const formatted = new Intl.NumberFormat(undefined, {
                    notation: "compact",
                    maximumFractionDigits: 1,
                }).format(n);
                if (Math.abs(n) >= 1_000 && !/[kKmMbB]/.test(formatted)) {
                    return formatCompactNumber(n);
                }
                return formatted;
            } catch {
                return formatCompactNumber(n);
            }
        };

        const formatPercent = (p?: number | null) => {
            if (p === null || p === undefined) return "—";
            return `${(p * 100).toFixed(2)}%`;
        };

        const formatCurrency = (n?: number | null) => {
            if (n === null || n === undefined) return "—";
            if (Platform.OS !== "web") return `₹${formatCompactNumber(n)}`;
            try {
                const formatted = new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: "INR",
                    notation: "compact",
                    maximumFractionDigits: 1,
                }).format(n);
                if (Math.abs(n) >= 1_000 && !/[kKmMbB]/.test(formatted)) {
                    return `₹${formatCompactNumber(n)}`;
                }
                return formatted;
            } catch {
                return `₹${formatCompactNumber(n)}`;
            }
        };

        const isNarrow = width < 520;
        const isDark = theme.dark;
        const cardBg = (hex: string) => tintBg(hex, isDark ? 0.15 : 0.08);
        const cardBorder = (hex: string) => tintBg(hex, isDark ? 0.25 : 0.15);

        // ──────────────────────────────────────────────
        // Visual sub-components
        // ──────────────────────────────────────────────

        const SectionLabel = ({ children }: { children: string }) => (
            <Text style={{
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase" as const,
                letterSpacing: 1.5,
                opacity: 0.35,
                marginBottom: 12,
                color: colors.text,
            }}>
                {children}
            </Text>
        );

        const MetricTile = ({
            value,
            label,
            color: accent,
            large,
        }: {
            value: string;
            label: string;
            color: string;
            large?: boolean;
        }) => (
            <View style={{
                flex: 1,
                backgroundColor: cardBg(accent),
                borderRadius: 20,
                paddingVertical: large ? 24 : 16,
                paddingHorizontal: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: cardBorder(accent),
            }}>
                <Text style={{
                    fontSize: large ? 28 : 20,
                    fontWeight: "800",
                    color: accent,
                    letterSpacing: -0.5,
                }}>
                    {value}
                </Text>
                <Text style={{
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase" as const,
                    letterSpacing: 1.2,
                    marginTop: 6,
                    color: colors.text,
                    opacity: 0.4,
                }}>
                    {label}
                </Text>
            </View>
        );

        const HeroMetrics = ({ s }: { s: ISocials }) => (
            <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                <SectionLabel>At a Glance</SectionLabel>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <MetricTile
                        value={formatNumber(s.follower_count)}
                        label="Followers"
                        color={ACCENT.blue}
                        large
                    />
                    <MetricTile
                        value={formatNumber(s.average_views)}
                        label="Avg Views"
                        color={ACCENT.purple}
                        large
                    />
                    <MetricTile
                        value={formatPercent(s.engagement_rate)}
                        label="ER"
                        color={ACCENT.pink}
                        large
                    />
                </View>
            </View>
        );

        const ScoreCards = ({ a }: { a: ISocialAnalytics }) => {
            const trustLevel = getTrustabilityLevel(a.trustablity);
            const trustColor = trustLevel?.color || ACCENT.emerald;
            return (
                <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                    <SectionLabel>Creator Scores</SectionLabel>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{
                            flex: 1,
                            backgroundColor: cardBg(ACCENT.amber),
                            borderRadius: 20,
                            padding: 18,
                            borderWidth: 1,
                            borderColor: cardBorder(ACCENT.amber),
                        }}>
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                backgroundColor: "transparent",
                            }}>
                                <Stars
                                    rating={qualityScoreToStars(a.quality)}
                                    size={isNarrow ? 14 : 18}
                                />
                                <Text style={{
                                    fontSize: 22,
                                    fontWeight: "800",
                                    color: ACCENT.amber,
                                }}>
                                    {qualityScoreToStars(a.quality).toFixed(1)}
                                </Text>
                            </View>
                            <Text style={{
                                fontSize: 10,
                                fontWeight: "700",
                                textTransform: "uppercase" as const,
                                letterSpacing: 1,
                                marginTop: 10,
                                color: colors.text,
                                opacity: 0.4,
                            }}>
                                Quality
                            </Text>
                            <Text style={{
                                fontSize: 11,
                                color: colors.text,
                                opacity: 0.5,
                                marginTop: 4,
                            }}>
                                Aesthetic & content quality
                            </Text>
                        </View>

                        <View style={{
                            flex: 1,
                            backgroundColor: tintBg(trustColor, isDark ? 0.15 : 0.08),
                            borderRadius: 20,
                            padding: 18,
                            borderWidth: 1,
                            borderColor: tintBg(trustColor, isDark ? 0.25 : 0.15),
                        }}>
                            <Text style={{
                                fontSize: 22,
                                fontWeight: "800",
                                color: trustColor,
                            }}>
                                {trustLevel?.label || "—"}
                            </Text>
                            <Text style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: trustColor,
                                opacity: 0.8,
                                marginTop: 2,
                            }}>
                                {a.trustablity}%
                            </Text>
                            <Text style={{
                                fontSize: 10,
                                fontWeight: "700",
                                textTransform: "uppercase" as const,
                                letterSpacing: 1,
                                marginTop: 8,
                                color: colors.text,
                                opacity: 0.4,
                            }}>
                                Trustability
                            </Text>
                            <Text style={{
                                fontSize: 11,
                                color: colors.text,
                                opacity: 0.5,
                                marginTop: 4,
                            }}>
                                Engagement & collab signals
                            </Text>
                        </View>
                    </View>
                </View>
            );
        };

        const PricingSection = ({ a }: { a: ISocialAnalytics }) => (
            <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                <SectionLabel>Pricing</SectionLabel>
                <View style={{
                    backgroundColor: cardBg(ACCENT.emerald),
                    borderRadius: 20,
                    padding: 22,
                    borderWidth: 1,
                    borderColor: cardBorder(ACCENT.emerald),
                    alignItems: "center",
                }}>
                    <Text style={{
                        fontSize: 26,
                        fontWeight: "800",
                        color: ACCENT.emerald,
                        letterSpacing: -0.5,
                    }}>
                        {formatCurrency(a.estimatedBudget?.min)}  —  {formatCurrency(a.estimatedBudget?.max)}
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: colors.text,
                        opacity: 0.45,
                        marginTop: 8,
                        fontWeight: "500",
                    }}>
                        Estimated budget per deliverable
                    </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <MetricTile
                        value={`${formatNumber(a.estimatedReach?.min)} — ${formatNumber(a.estimatedReach?.max)}`}
                        label="Est. Reach"
                        color={ACCENT.sky}
                    />
                    <MetricTile
                        value={formatCurrency(a.cpm)}
                        label="CPM"
                        color={ACCENT.teal}
                    />
                </View>
            </View>
        );

        const AudienceStats = ({ s }: { s: ISocials }) => {
            const stats = [
                { v: s.follower_count, l: "Followers", c: ACCENT.blue },
                { v: s.following_count, l: "Following", c: ACCENT.purple },
                { v: s.content_count, l: "Posts", c: ACCENT.pink },
                { v: s.views_count, l: "Total Views", c: ACCENT.sky },
                { v: s.engagement_count, l: "Engagements", c: ACCENT.rose },
            ];
            return (
                <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                    <SectionLabel>Audience</SectionLabel>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        {stats.map(({ v, l, c }) => (
                            <View key={l} style={{
                                backgroundColor: cardBg(c),
                                borderRadius: 16,
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                minWidth: isNarrow ? "46%" : "30%",
                                flex: 1,
                                borderWidth: 1,
                                borderColor: cardBorder(c),
                            }}>
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: "700",
                                    color: c,
                                }}>
                                    {formatNumber(v)}
                                </Text>
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: "600",
                                    textTransform: "uppercase" as const,
                                    letterSpacing: 0.8,
                                    color: colors.text,
                                    opacity: 0.4,
                                    marginTop: 4,
                                }}>
                                    {l}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            );
        };

        const PerformanceStats = ({ s }: { s: ISocials }) => (
            <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                <SectionLabel>Performance Medians</SectionLabel>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <MetricTile value={formatNumber(s.average_views)} label="Views" color={ACCENT.sky} />
                    <MetricTile value={formatNumber(s.average_likes)} label="Likes" color={ACCENT.rose} />
                    <MetricTile value={formatNumber(s.average_comments)} label="Comments" color={ACCENT.purple} />
                </View>
            </View>
        );

        const NicheTags = ({ s }: { s: ISocials }) => {
            if (!Array.isArray(s.niches) || s.niches.length === 0) return null;
            return (
                <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                    <SectionLabel>Niches</SectionLabel>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {s.niches.map((n, i) => {
                            const c = NICHE_COLORS[i % NICHE_COLORS.length];
                            return (
                                <View key={n} style={{
                                    backgroundColor: tintBg(c, isDark ? 0.2 : 0.1),
                                    borderRadius: 20,
                                    paddingVertical: 8,
                                    paddingHorizontal: 16,
                                }}>
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: "600",
                                        color: c,
                                    }}>
                                        {n}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            );
        };

        const ReelsShowcase = ({ s }: { s: ISocials }) => {
            if (!Array.isArray(s.reels) || s.reels.length === 0) return null;
            return (
                <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                    <SectionLabel>Recent Reels</SectionLabel>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: "row", gap: 12, backgroundColor: "transparent" }}>
                            {s.reels.map((r) => (
                                <Card
                                    key={r.id}
                                    style={{
                                        width: 160,
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                    onPress={() => r.url && Linking.openURL(r.url)}
                                >
                                    {(r.display_url || r.thumbnail_url) ? (
                                        <Image
                                            source={{ uri: r.display_url || r.thumbnail_url || "" }}
                                            style={{
                                                width: "100%",
                                                height: 220,
                                                borderTopLeftRadius: 16,
                                                borderTopRightRadius: 16,
                                            }}
                                        />
                                    ) : (
                                        <View style={{
                                            width: "100%",
                                            height: 220,
                                            backgroundColor: tintBg(ACCENT.purple, 0.1),
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}>
                                            <Icon source="play-circle" size={40} color={ACCENT.purple} />
                                        </View>
                                    )}
                                    <View style={{ padding: 12 }}>
                                        {r.caption ? (
                                            <Text
                                                numberOfLines={2}
                                                style={{ fontSize: 12, color: colors.text, marginBottom: 8 }}
                                            >
                                                {r.caption}
                                            </Text>
                                        ) : null}
                                        <View style={{
                                            flexDirection: "row",
                                            flexWrap: "wrap",
                                            gap: 8,
                                            backgroundColor: "transparent",
                                        }}>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 3,
                                                backgroundColor: "transparent",
                                            }}>
                                                <Icon source="play" size={13} color={ACCENT.sky} />
                                                <Text style={{
                                                    fontSize: 11,
                                                    fontWeight: "700",
                                                    color: colors.text,
                                                }}>
                                                    {formatNumber(r.views_count)}
                                                </Text>
                                            </View>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 3,
                                                backgroundColor: "transparent",
                                            }}>
                                                <Icon source="heart" size={13} color={ACCENT.rose} />
                                                <Text style={{
                                                    fontSize: 11,
                                                    fontWeight: "700",
                                                    color: colors.text,
                                                }}>
                                                    {formatNumber(r.likes_count)}
                                                </Text>
                                            </View>
                                            <View style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 3,
                                                backgroundColor: "transparent",
                                            }}>
                                                <Icon source="comment" size={13} color={ACCENT.purple} />
                                                <Text style={{
                                                    fontSize: 11,
                                                    fontWeight: "700",
                                                    color: colors.text,
                                                }}>
                                                    {formatNumber(r.comments_count)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            );
        };

        const LinksSection = ({ s }: { s: ISocials }) => {
            if (!Array.isArray(s.links) || s.links.length === 0) return null;
            return (
                <View style={{ marginHorizontal: 12, marginBottom: 24 }}>
                    <SectionLabel>Links</SectionLabel>
                    <View style={{
                        backgroundColor: cardBg(ACCENT.blue),
                        borderRadius: 16,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: cardBorder(ACCENT.blue),
                    }}>
                        {s.links.map((l, idx) => (
                            <React.Fragment key={`${l.url}-${idx}`}>
                                {idx > 0 && <Divider />}
                                <List.Item
                                    title={l.text || l.url}
                                    description={l.url}
                                    onPress={() => Linking.openURL(l.url)}
                                    left={(props) => (
                                        <List.Icon {...props} icon="link-variant" color={ACCENT.blue} />
                                    )}
                                    right={(props) => (
                                        <List.Icon {...props} icon="open-in-new" color={colors.text} />
                                    )}
                                    titleStyle={{ fontWeight: "600" }}
                                />
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            );
        };

        return (
            <>
                <Card.Content>
                    {loading && <ActivityIndicator size={"small"} />}

                    {!loading && !social && (
                        <Text
                            variant="bodyMedium"
                            style={{ opacity: 0.7, paddingHorizontal: 16, marginBottom: 12 }}
                        >
                            Detailed analytics are not available for this creator yet.
                        </Text>
                    )}

                    {!loading && social && (
                        <ScrollView contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}>
                            <HeroMetrics s={social} />
                            {analytics && <ScoreCards a={analytics} />}
                            {analytics && <PricingSection a={analytics} />}
                            <AudienceStats s={social} />
                            <PerformanceStats s={social} />
                            <NicheTags s={social} />
                            <ReelsShowcase s={social} />
                            <LinksSection s={social} />
                        </ScrollView>
                    )}
                </Card.Content>

                <EditSocialMetricsModal
                    visible={isEditModalVisible}
                    social={social}
                    editedSocial={editedSocial}
                    setEditedSocial={setEditedSocial}
                    saveError={saveError}
                    onClose={() => setIsEditModalVisible(false)}
                    onSave={handleSaveChanges}
                    isSaving={isSaving}
                    hasChanges={hasChanges}
                />
            </>
        );
    }
);

TrendlyAnalyticsEmbed.displayName = "TrendlyAnalyticsEmbed";
export default TrendlyAnalyticsEmbed;
