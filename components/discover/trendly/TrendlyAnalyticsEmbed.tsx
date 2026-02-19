import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts/auth-context.provider";
import {
    ISocialAnalytics,
    ISocials,
} from "@/shared-libs/firestore/trendly-pro/models/bq-socials";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { View } from "@/shared-uis/components/theme/Themed";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { convertToMUnits } from "@/shared-uis/utils/conversion-million";
import { Brand } from "@/types/Brand";
import { getTrustabilityLevel } from "@/utils/trustability";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import {
    ActivityIndicator,
    Card,
    Chip,
    Divider,
    List,
    Text,
} from "react-native-paper";
import { Stars, qualityScoreToStars } from "@/shared-uis/components/rating-section";
import { StatChip } from "../StatChip";
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
        const PADDING = isNarrow ? 16 : 20;
        const cardRadius = 16;
        const heroRadius = 20;

        const cardBaseStyle = {
            marginBottom: 12,
            borderRadius: cardRadius,
            borderWidth: 1,
            borderColor: theme.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            backgroundColor: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
            marginHorizontal: PADDING,
            overflow: "hidden" as const,
        };

        const styles = StyleSheet.create({
            section: { marginBottom: 24 },
            sectionLabel: {
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: colors.gray300,
                marginBottom: 12,
                paddingHorizontal: PADDING,
            },
            heroCard: {
                marginHorizontal: PADDING,
                marginBottom: 16,
                borderRadius: heroRadius,
                overflow: "hidden",
                backgroundColor: theme.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                borderWidth: 1,
                borderColor: theme.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            },
            heroValue: { fontSize: isTiny ? 22 : isNarrow ? 26 : 32, fontWeight: "800" as const },
            heroLabel: { fontSize: 12, opacity: 0.7, marginTop: 4 },
            statPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
        });

        const HeroCard = ({ analytics }: { analytics: ISocialAnalytics }) => (
            <View style={[styles.heroCard, { padding: 20 }]}>
                <Text style={styles.sectionLabel}>Budget & Reach</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, backgroundColor: "transparent" }}>
                    <View style={{ flex: 1, minWidth: 140 }}>
                        <Text style={[styles.heroValue, { color: colors.text }]}>
                            {formatCurrency(analytics.estimatedBudget?.min)} — {formatCurrency(analytics.estimatedBudget?.max)}
                        </Text>
                        <Text style={[styles.heroLabel, { color: colors.text }]}>Estimated budget</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 140 }}>
                        <Text style={[styles.heroValue, { color: colors.text }]}>
                            {formatNumber(analytics.estimatedReach?.min)} — {formatNumber(analytics.estimatedReach?.max)}
                        </Text>
                        <Text style={[styles.heroLabel, { color: colors.text }]}>Estimated reach</Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                    <View style={[styles.statPill, { backgroundColor: getTrustabilityLevel(analytics.trustablity)?.color ? getTrustabilityLevel(analytics.trustablity)!.color + "20" : (theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)") }]}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: getTrustabilityLevel(analytics.trustablity)?.color || colors.text }}>
                            {getTrustabilityLevel(analytics.trustablity)?.label || "—"} ({analytics.trustablity}%)
                        </Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Stars rating={qualityScoreToStars(analytics.quality)} size={18} />
                            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                                {qualityScoreToStars(analytics.quality).toFixed(1)} Quality
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                            {formatCurrency(analytics.cpm)} CPM
                        </Text>
                    </View>
                </View>
            </View>
        );

        const SocialStatsCard = ({ social }: { social: ISocials }) => (
            <View style={[styles.section]}>
                <Text style={styles.sectionLabel}>Key metrics</Text>
                <View style={[cardBaseStyle, { padding: 16 }]}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, backgroundColor: "transparent" }}>
                        <StatChip label="Followers" value={social.follower_count} textColor={colors.text} />
                        <StatChip label="Views" value={convertToMUnits(social.views_count)} textColor={colors.text} />
                        <StatChip label="Engagements" value={social.engagement_count} textColor={colors.text} />
                        <StatChip label="ER %" value={social.engagement_rate || 0} textColor={colors.text} />
                        <StatChip label="Posts" value={social.content_count} textColor={colors.text} />
                    </View>
                </View>
            </View>
        );

        const ProfileOverviewCard = ({ social }: { social: ISocials }) => (
            <View style={[styles.section]}>
                <Text style={styles.sectionLabel}>About</Text>
                <View style={[cardBaseStyle, { padding: 16 }]}>
                    {(social.bio && social.bio !== "unknown") ? (
                        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: 12 }} numberOfLines={3}>
                            {social.bio}
                        </Text>
                    ) : null}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {!!social.location && social.location !== "unknown" && (
                            <Chip compact icon="map-marker" style={{ marginRight: 0 }}>
                                {social.location}
                            </Chip>
                        )}
                        {!!social.gender && social.gender !== "unknown" && (
                            <Chip compact icon="gender-male-female"
                            >
                                {social.gender}
                            </Chip>
                        )}
                        {social.profile_verified && (
                            <Chip compact icon="check-decagram">Verified</Chip>
                        )}
                    </View>
                    {Array.isArray(social.niches) && social.niches.length > 0 && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray300, marginBottom: 8 }}>Niches</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                                {social.niches.map((n) => (
                                    <Chip key={n} compact style={{ marginRight: 0 }}>{n}</Chip>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );

        const ReelsCard = ({ social }: { social: ISocials }) =>
            Array.isArray(social.reels) && social.reels.length > 0 ? (
                <View style={[styles.section]}>
                    <Text style={styles.sectionLabel}>Top Reels</Text>
                    <Card style={cardBaseStyle}>
                        <Card.Content style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} >
                            <View style={{ flexDirection: "row", backgroundColor: "transparent" }}>
                                {social.reels.map((r) => (
                                    <Card
                                        key={r.id}
                                        style={{
                                            width: 160,
                                            marginRight: 14,
                                            borderRadius: 14,
                                            overflow: "hidden",
                                            borderWidth: 1,
                                            borderColor: theme.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                        }}
                                        onPress={() => r.url && Linking.openURL(r.url)}
                                    >
                                        {!!r.thumbnail_url && (
                                            <Image
                                                source={{ uri: r.thumbnail_url }}
                                                style={{
                                                    width: "100%",
                                                    height: 200,
                                                    borderTopLeftRadius: 14,
                                                    borderTopRightRadius: 14,
                                                }}
                                            />
                                        )}
                                        <Card.Content style={{ padding: 10 }}>
                                            <Text
                                                numberOfLines={2}
                                                variant="bodySmall"
                                                style={{ marginTop: 4, color: colors.text }}
                                            >
                                                {r.caption || "Reel"}
                                            </Text>
                                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, backgroundColor: "transparent" }}>
                                                <Chip compact icon="play-circle" textStyle={{ color: colors.text, fontSize: 11 }}>
                                                    {formatNumber(r.views_count)}
                                                </Chip>
                                                <Chip compact icon="heart" textStyle={{ color: colors.text, fontSize: 11 }}>
                                                    {formatNumber(r.likes_count)}
                                                </Chip>
                                                <Chip compact icon="comment-text" textStyle={{ color: colors.text, fontSize: 11 }}>
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
                </View>
            ) : null;

        const LinksList = ({ social }: { social: ISocials }) =>
            Array.isArray(social.links) && social.links.length > 0 ? (
                <View style={[styles.section]}>
                    <Text style={styles.sectionLabel}>Links</Text>
                    <Card style={cardBaseStyle}>
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
                </View>
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
                        <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
                            {analytics && <HeroCard analytics={analytics} />}
                            <SocialStatsCard social={social} />
                            <ProfileOverviewCard social={social} />
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

TrendlyAnalyticsEmbed.displayName = "TrendlyAnalyticsEmbed";
export default TrendlyAnalyticsEmbed;
