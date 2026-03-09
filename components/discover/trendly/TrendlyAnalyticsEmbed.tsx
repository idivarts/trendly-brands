import Colors from "@/shared-uis/constants/Colors";
import { useAuthContext } from "@/contexts/auth-context.provider";
import {
    ISocialAnalytics,
    ISocials,
} from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useBreakpoints } from "@/hooks";
import { View } from "@/shared-uis/components/theme/Themed";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { convertToMUnits } from "@/shared-uis/utils/conversion-million";
import { Brand } from "@/types/Brand";
import { getTrustabilityLevel } from "@/utils/trustability";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, Platform, ScrollView, StyleSheet, View as RNView } from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
    ActivityIndicator,
    Card,
    Chip,
    Divider,
    List,
    Text,
} from "react-native-paper";
import {
    faArrowDown,
    faArrowTrendDown,
    faArrowTrendUp,
    faArrowUp,
    faChartLine,
    faIndianRupee,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
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

const TrendlyAnalyticsEmbed = React.forwardRef<any, IProps>(
    ({ influencer, selectedBrand, initialSocial, initialAnalytics, onLoadingChange }, ref) => {
        const { manager } = useAuthContext();
        const { width, xl } = useBreakpoints();
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
                // no-op; you can hook to your toast/snackbar here
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

                // Prepare the request body with the API format
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

                // Call the API using HttpWrapper
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
                // Optionally reload the influencer data
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

        const formatDate = (epoch?: number | null) => {
            if (!epoch) return "—";
            try {
                return new Date(epoch * 1000).toLocaleString();
            } catch {
                return `${epoch}`;
            }
        };

        const isNarrow = width < 520;
        const isTiny = width < 360;
        const smallCardWidth = "48%";
        const wideCardWidth = isNarrow ? "100%" : "48%";
        const labelVariant = isTiny ? "labelSmall" : isNarrow ? "labelMedium" : "labelLarge";
        const valueVariant = isTiny ? "titleLarge" : isNarrow ? "headlineSmall" : "displaySmall";
        const rangeVariant = isTiny ? "titleLarge" : isNarrow ? "headlineSmall" : "headlineLarge";
        const contentPadding = isNarrow ? 12 : 16;
        const cardSpacing = isNarrow ? 10 : 12;

        const CIRCLE_R = 32;
        const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

        const HeaderCards = ({ analytics }: { analytics: ISocialAnalytics }) => {
            const trustLevel = getTrustabilityLevel(analytics.trustablity);
            const trustColor = trustLevel?.color || colors.primary;
            const trustPercent = analytics.trustablity ?? 0;
            const strokeDashLength = (trustPercent / 100) * CIRCLE_CIRCUMFERENCE;

            return (
            <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: cardSpacing,
                    }}
                >
                    <Card style={{ width: smallCardWidth, marginBottom: cardSpacing }}>
                        <Card.Content style={{ padding: contentPadding, alignItems: "center" }}>
                            <Text
                                variant={labelVariant}
                                style={{ opacity: 0.7, marginBottom: 8 }}
                            >
                                TRUSTABILITY
                            </Text>
                            <RNView style={{ position: "relative", width: 80, height: 80, alignItems: "center", justifyContent: "center" }}>
                                <Svg width={80} height={80} viewBox="0 0 80 80" style={{ position: "absolute" }}>
                                    <Circle
                                        cx={40}
                                        cy={40}
                                        r={CIRCLE_R}
                                        stroke={colors.tag}
                                        strokeWidth={6}
                                        fill="none"
                                    />
                                    <Circle
                                        cx={40}
                                        cy={40}
                                        r={CIRCLE_R}
                                        stroke={trustColor}
                                        strokeWidth={6}
                                        fill="none"
                                        strokeDasharray={`${strokeDashLength} ${CIRCLE_CIRCUMFERENCE}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 40 40)"
                                    />
                                </Svg>
                                <RNView style={{ alignItems: "center", justifyContent: "center" }}>
                                    <Text variant="titleLarge" style={{ fontWeight: "bold", color: trustColor }}>
                                        {trustPercent}%
                                    </Text>
                                </RNView>
                            </RNView>
                            <Text variant="labelMedium" style={{ fontWeight: "600", marginTop: 8, color: trustColor }}>
                                {trustLevel?.label || "—"}
                            </Text>
                            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
                                Based on engagement quality
                            </Text>
                        </Card.Content>
                    </Card>
                    <Card style={{ width: smallCardWidth, marginBottom: cardSpacing }}>
                        <Card.Content style={{ padding: contentPadding }}>
                            <Text
                                variant={labelVariant}
                                style={{ opacity: 0.7, marginBottom: 6 }}
                            >
                                CPM
                            </Text>
                            <Text variant={valueVariant}>
                                {formatCurrency(analytics.cpm)}{" "}
                            </Text>
                            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 6 }}>
                                Cost per Mille (1000 views)
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card
                        style={[
                            { width: wideCardWidth, marginBottom: cardSpacing },
                            {
                                backgroundColor: colors.budgetCardBg,
                                borderWidth: 1,
                                borderColor: colors.budgetCardBorder,
                                borderRadius: 12,
                            },
                        ]}
                    >
                        <Card.Content style={{ padding: contentPadding, flexDirection: "row" }}>
                            <RNView
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    backgroundColor: colors.white,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faIndianRupee}
                                    size={22}
                                    color={colors.primary}
                                />
                            </RNView>
                            <RNView style={{ flex: 1 }}>
                                <Text
                                    variant="labelSmall"
                                    style={{
                                        color: colors.primary,
                                        opacity: 0.85,
                                        marginBottom: 4,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    ESTIMATED BUDGET
                                </Text>
                                <Text
                                    variant={rangeVariant}
                                    style={{
                                        fontWeight: "bold",
                                        color: colors.text,
                                        marginBottom: 8,
                                    }}
                                >
                                    {analytics.estimatedBudget
                                        ? formatCurrency(
                                              (analytics.estimatedBudget.min + analytics.estimatedBudget.max) / 2
                                          )
                                        : "—"}
                                </Text>
                                <RNView style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                                    <FontAwesomeIcon icon={faArrowDown} size={10} color={colors.textSecondary} />
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        {analytics.estimatedBudget
                                            ? formatCurrency(analytics.estimatedBudget.min) + " min"
                                            : "—"}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary, marginHorizontal: 4 }}>
                                        •
                                    </Text>
                                    <FontAwesomeIcon icon={faArrowUp} size={10} color={colors.textSecondary} />
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        {analytics.estimatedBudget
                                            ? formatCurrency(analytics.estimatedBudget.max) + " max"
                                            : "—"}
                                    </Text>
                                </RNView>
                            </RNView>
                        </Card.Content>
                    </Card>

                    <Card
                        style={[
                            { width: wideCardWidth, marginBottom: cardSpacing },
                            {
                                backgroundColor: colors.reachCardBg,
                                borderWidth: 1,
                                borderColor: colors.reachCardBorder,
                                borderRadius: 12,
                            },
                        ]}
                    >
                        <Card.Content style={{ padding: contentPadding, flexDirection: "row" }}>
                            <RNView
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 10,
                                    backgroundColor: colors.white,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faChartLine}
                                    size={22}
                                    color={colors.green}
                                />
                            </RNView>
                            <RNView style={{ flex: 1 }}>
                                <Text
                                    variant="labelSmall"
                                    style={{
                                        color: colors.green,
                                        opacity: 0.85,
                                        marginBottom: 4,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    ESTIMATED REACH
                                </Text>
                                <Text
                                    variant={rangeVariant}
                                    style={{
                                        fontWeight: "bold",
                                        color: colors.text,
                                        marginBottom: 8,
                                    }}
                                >
                                    {analytics.estimatedReach
                                        ? formatNumber(
                                              (analytics.estimatedReach.min + analytics.estimatedReach.max) / 2
                                          )
                                        : "—"}
                                </Text>
                                <RNView style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                                    <FontAwesomeIcon
                                        icon={faArrowTrendDown}
                                        size={10}
                                        color={colors.textSecondary}
                                    />
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        {analytics.estimatedReach
                                            ? formatNumber(analytics.estimatedReach.min) + " min"
                                            : "—"}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary, marginHorizontal: 4 }}>
                                        •
                                    </Text>
                                    <FontAwesomeIcon
                                        icon={faArrowTrendUp}
                                        size={10}
                                        color={colors.textSecondary}
                                    />
                                    <Text variant="bodySmall" style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        {analytics.estimatedReach
                                            ? formatNumber(analytics.estimatedReach.max) + " max"
                                            : "—"}
                                    </Text>
                                </RNView>
                            </RNView>
                        </Card.Content>
                    </Card>
                </View>
            </View>
            );
        };

        const ProfileOverviewCard = ({ social }: { social: ISocials }) => (
            <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                <Card.Title
                    title={social.name || social.username}
                    subtitle={[
                        social.username ? `@${social.username}` : "",
                        social.category,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                    right={(props) => (
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingRight: 12,
                            }}
                        >
                            {social.profile_verified && (
                                <Chip compact icon="check-decagram" style={{ marginRight: 6 }}>
                                    Verified
                                </Chip>
                            )}
                        </View>
                    )}
                />

                <Card.Content>
                    <Text
                        variant="bodyMedium"
                        style={{ marginBottom: 8 }}
                        numberOfLines={2}
                    >
                        {social.bio != "unknown" ? social.bio : ""}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {!!social.location && social.location != "unknown" && (
                            <Chip
                                style={{ marginRight: 8, marginBottom: 8 }}
                                icon="map-marker"
                            >
                                {social.location}
                            </Chip>
                        )}
                        {!!social.gender && social.gender != "unknown" && (
                            <Chip
                                style={{ marginRight: 8, marginBottom: 8 }}
                                icon="gender-male-female"
                            >
                                {social.gender}
                            </Chip>
                        )}
                        {typeof social.quality_score === "number" && (
                            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8, marginBottom: 0, backgroundColor: "transparent" }}>
                                <Stars rating={qualityScoreToStars(social.quality_score)} size={14} />
                                <Text variant="bodySmall" style={{ marginLeft: 4 }}>
                                    {qualityScoreToStars(social.quality_score).toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {Array.isArray(social.niches) && social.niches.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <Text variant="labelLarge" style={{ marginBottom: 6 }}>
                                Niches
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {social.niches.map((n) => (
                                    <Chip key={n} style={{ marginRight: 8, marginBottom: 8 }}>
                                        {n}
                                    </Chip>
                                ))}
                            </View>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );

        const sectionStyles = useMemo(
            () =>
                makeTotalsAndRatesStyles(colors, xl),
            [colors, xl]
        );

        const TotalsAndRatesSection = ({ social }: { social: ISocials }) => (
            <RNView style={sectionStyles.container}>
                <RNView style={sectionStyles.column}>
                    <Text style={sectionStyles.sectionHeading}>TOTALS</Text>
                    <RNView style={sectionStyles.totalsGrid}>
                        <RNView style={sectionStyles.miniCard}>
                            <Text style={sectionStyles.value}>
                                {formatNumber(social.follower_count)}
                            </Text>
                            <Text style={sectionStyles.label}>FOLLOWERS</Text>
                        </RNView>
                        <RNView style={sectionStyles.miniCard}>
                            <Text style={sectionStyles.value}>
                                {social.views_count >= 1_000_000
                                    ? convertToMUnits(social.views_count)
                                    : formatNumber(social.views_count)}
                            </Text>
                            <Text style={sectionStyles.label}>TOTAL VIEWS</Text>
                        </RNView>
                        <RNView style={sectionStyles.miniCard}>
                            <Text style={sectionStyles.value}>
                                {formatNumber(social.following_count)}
                            </Text>
                            <Text style={sectionStyles.label}>FOLLOWING</Text>
                        </RNView>
                        <RNView style={sectionStyles.miniCard}>
                            <Text style={sectionStyles.value}>
                                {formatNumber(social.content_count)}
                            </Text>
                            <Text style={sectionStyles.label}>POSTS</Text>
                        </RNView>
                    </RNView>
                </RNView>
                <RNView style={sectionStyles.column}>
                    <Text style={sectionStyles.sectionHeading}>PERFORMANCE RATES</Text>
                    <RNView style={sectionStyles.engagementCard}>
                        <Text style={sectionStyles.engagementLabel}>ENGAGEMENT RATE</Text>
                        <Text style={sectionStyles.engagementValue}>
                            {formatPercent(social.engagement_rate ?? 0)}
                        </Text>
                    </RNView>
                    <RNView style={sectionStyles.ratesRow}>
                        <RNView style={sectionStyles.miniCard}>
                            <Text style={sectionStyles.value}>
                                {formatNumber(social.average_views)}
                            </Text>
                            <Text style={sectionStyles.label}>MEDIAN VIEWS</Text>
                        </RNView>
                        <RNView style={sectionStyles.miniCard}>
                            <Text style={sectionStyles.value}>
                                {formatNumber(social.average_likes)}
                            </Text>
                            <Text style={sectionStyles.label}>MEDIAN LIKES</Text>
                        </RNView>
                    </RNView>
                </RNView>
            </RNView>
        );

        const ReelsCard = ({ social }: { social: ISocials }) =>
            Array.isArray(social.reels) && social.reels.length > 0 ? (
                <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                    <Card.Title title={`Reels`} />
                    <Card.Content>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} >
                            <View style={{ flexDirection: "row", backgroundColor: "transparent" }}>
                                {social.reels.map((r) => (
                                    <Card
                                        key={r.id}
                                        style={{ width: 140, marginRight: 12, borderWidth: 1, borderColor: colors.border }}
                                        onPress={() => r.url && Linking.openURL(r.url)}
                                    >
                                        {(r.display_url || r.thumbnail_url) ? (
                                            <Image
                                                source={{ uri: r.display_url || r.thumbnail_url || "" }}
                                                style={{
                                                    width: "100%",
                                                    height: 180,
                                                    borderTopLeftRadius: 12,
                                                    borderTopRightRadius: 12,
                                                }}
                                            />
                                        ) : null}
                                        <Card.Content>
                                            <Text
                                                numberOfLines={2}
                                                variant="bodySmall"
                                                style={{ marginTop: 6 }}
                                            >
                                                {r.caption || "Reel"}
                                            </Text>
                                            <Divider style={{ marginVertical: 6 }} />
                                            <View style={{ flexDirection: "row", flexWrap: "wrap", backgroundColor: "transparent" }}>
                                                <Chip
                                                    compact
                                                    style={{ marginRight: 6, marginBottom: 6 }}
                                                    icon="play-circle"
                                                    textStyle={{ color: colors.black }}
                                                >
                                                    {formatNumber(r.video_view_count ?? r.video_play_count ?? r.views_count ?? 0)}
                                                </Chip>
                                                <Chip
                                                    compact
                                                    style={{ marginRight: 6, marginBottom: 6 }}
                                                    icon="heart"
                                                    textStyle={{ color: colors.black }}
                                                >
                                                    {formatNumber(r.likes_count)}
                                                </Chip>
                                                <Chip
                                                    compact
                                                    style={{ marginRight: 6, marginBottom: 6 }}
                                                    icon="comment-text"
                                                    textStyle={{ color: colors.black }}
                                                >
                                                    {formatNumber(r.comments_count)}
                                                </Chip>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                ))}
                            </View>
                        </ScrollView>
                    </Card.Content>
                </Card>
            ) : null;

        const LinksList = ({ social }: { social: ISocials }) =>
            Array.isArray(social.links) && social.links.length > 0 ? (
                <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                    <Card.Title title="Links" />
                    <Card.Content>
                        <List.Section>
                            {social.links.map((l, idx) => (
                                <List.Item
                                    key={`${l.url}-${idx}`}
                                    title={l.text || l.url}
                                    description={l.url}
                                    onPress={() => Linking.openURL(l.url)}
                                    left={(props) => <List.Icon {...props} icon="link-variant" />}
                                    right={(props) => <List.Icon {...props} icon="open-in-new" />}
                                />
                            ))}
                        </List.Section>
                    </Card.Content>
                </Card>
            ) : null;

        const MetaCard = ({ social }: { social: ISocials }) => (
            <Card style={{ marginHorizontal: 12, marginBottom: 12 }}>
                <Card.Title title="Meta" />
                <Card.Content>
                    <List.Section>
                        <List.Item
                            title="ID"
                            description={social.id}
                            left={(p) => <List.Icon {...p} icon="identifier" />}
                        />
                        <List.Item
                            title="Last Updated"
                            description={formatDate(social.last_update_time / 1000000)}
                            left={(p) => <List.Icon {...p} icon="update" />}
                        />
                        <List.Item
                            title="Platform"
                            description={social.social_type || "—"}
                            left={(p) => <List.Icon {...p} icon="target" />}
                        />
                    </List.Section>
                </Card.Content>
            </Card>
        );

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
                        <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
                            {analytics && <HeaderCards analytics={analytics} />}
                            <TotalsAndRatesSection social={social} />
                            <ReelsCard social={social} />
                            <LinksList social={social} />
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

function makeTotalsAndRatesStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean
) {
    return StyleSheet.create({
        container: {
            flexDirection: xl ? "row" : "column",
            paddingHorizontal: 20,
            marginBottom: 20,
            gap: 24,
        },
        column: {
            flex: xl ? 1 : undefined,
        },
        sectionHeading: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            letterSpacing: 0.5,
            marginBottom: 12,
        },
        totalsGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        miniCard: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            flex: 1,
            minWidth: 120,
            minHeight: 80,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
        },
        value: {
            fontSize: 20,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 4,
        },
        label: {
            fontSize: 11,
            fontWeight: "500",
            color: colors.textSecondary,
            letterSpacing: 0.5,
        },
        engagementCard: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: colors.border,
        },
        engagementLabel: {
            fontSize: 14,
            color: colors.textSecondary,
            letterSpacing: 0.5,
        },
        engagementValue: {
            fontSize: 18,
            fontWeight: "bold",
            color: colors.primary,
        },
        ratesRow: {
            flexDirection: "row",
            gap: 12,
        },
    });
}

TrendlyAnalyticsEmbed.displayName = "TrendlyAnalyticsEmbed";
export default TrendlyAnalyticsEmbed;
