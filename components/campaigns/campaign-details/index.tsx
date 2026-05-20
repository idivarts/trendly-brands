import { Text, View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Colors from "@/shared-uis/constants/Colors";
import { Campaign, FEATURE_COSTS } from "@/types/Campaign";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
} from "react-native";
import { useBreakpoints } from "@/hooks";

const CURRENCY = "₹";
const fmt = (n: number) => CURRENCY + n.toLocaleString("en-IN");

function buildSummaryLines(campaign: Campaign): string[] {
    const lines: string[] = [];
    const f = campaign.features;
    const freq = campaign.contentFrequency;
    const monthlyPosts =
        freq?.period === "week" ? (freq.count ?? 0) * 4 : freq?.count ?? 0;

    if (f?.conversionAudit)
        lines.push(`Conversion Audit — ${fmt(FEATURE_COSTS.conversionAudit)}`);

    if (f?.contentStrategy) {
        const cost =
            monthlyPosts <= 8
                ? FEATURE_COSTS.contentStrategyPerPost.low
                : monthlyPosts <= 20
                ? FEATURE_COSTS.contentStrategyPerPost.mid
                : FEATURE_COSTS.contentStrategyPerPost.high;
        lines.push(`Content Strategy Creation — ${fmt(cost)}`);
    }

    if (f?.contentCreation?.enabled && f.contentCreation.influencerBudget) {
        const fee = Math.round(
            f.contentCreation.influencerBudget * FEATURE_COSTS.contentCreationPct
        );
        lines.push(`Content Creation (15%) — ${fmt(fee)}`);
    }

    if (f?.adSpend?.enabled && f.adSpend.totalAdSpend) {
        const fee = Math.round(
            f.adSpend.totalAdSpend * FEATURE_COSTS.adSpendPct
        );
        lines.push(`Ad Management (10%) — ${fmt(fee)}`);
    }

    if (f?.performanceMarketing?.enabled)
        lines.push(`Performance Marketing — ${fmt(FEATURE_COSTS.performanceMarketing)}`);

    return lines;
}

const StatusBanner: React.FC<{
    status: Campaign["status"];
    colors: ReturnType<typeof Colors>;
}> = ({ status, colors }) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                banner: {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor:
                        status === "active"
                            ? colors.reachCardBg
                            : status === "draft"
                            ? colors.aliceBlue
                            : colors.aliceBlue,
                    alignSelf: "flex-start",
                },
                text: {
                    fontWeight: "700",
                    fontSize: 13,
                    color:
                        status === "active"
                            ? colors.green
                            : colors.textSecondary,
                },
            }),
        [status, colors]
    );
    const label =
        status === "active"
            ? "Active Campaign"
            : status === "draft"
            ? "Draft — Payment Pending"
            : "Past Campaign";
    return (
        <View style={styles.banner}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );
};

interface CampaignDetailsProps {
    campaignId: string;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({ campaignId }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            doc(FirestoreDB, "campaigns", campaignId),
            (snap) => {
                if (snap.exists()) {
                    setCampaign({ id: snap.id, ...(snap.data() as any) });
                }
                setIsLoading(false);
            },
            (err) => {
                Console.error(err, "CampaignDetails snapshot error");
                setIsLoading(false);
            }
        );
        return unsub;
    }, [campaignId]);

    if (isLoading) {
        return (
            <AppLayout>
                <PageHeader title="Campaign" showBackButton />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </AppLayout>
        );
    }

    if (!campaign) {
        return (
            <AppLayout>
                <PageHeader title="Campaign" showBackButton />
                <View style={styles.center}>
                    <Text style={styles.errorText}>Campaign not found.</Text>
                </View>
            </AppLayout>
        );
    }

    const summaryLines = buildSummaryLines(campaign);
    const budget = campaign.estimatedBudget || campaign.totalBudget || 0;
    const roi = campaign.estimatedROI ?? {};
    const freq = campaign.contentFrequency;
    const monthlyPosts =
        freq?.period === "week" ? freq.count * 4 : freq?.count ?? 0;

    return (
        <AppLayout safeAreaEdges={["left", "right"]}>
            <PageHeader title={campaign.name} showBackButton />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <StatusBanner status={campaign.status} colors={colors} />

                {/* Meta chips */}
                <View style={styles.chipRow}>
                    <View style={styles.chip}>
                        <Text style={styles.chipText}>
                            {campaign.campaignType === "retainer"
                                ? "Monthly Retainer"
                                : "One-off Project"}
                        </Text>
                    </View>
                    <View style={styles.chip}>
                        <Text style={styles.chipText}>
                            {campaign.budgetType === "fixed"
                                ? "Fixed Budget"
                                : "Needs-Based"}
                        </Text>
                    </View>
                    {campaign.platforms?.map((p) => (
                        <View key={p} style={styles.chip}>
                            <Text style={styles.chipText}>{p}</Text>
                        </View>
                    ))}
                </View>

                {/* Description */}
                {campaign.description ? (
                    <Text style={styles.description}>{campaign.description}</Text>
                ) : null}

                {/* Budget card */}
                <View style={styles.budgetCard}>
                    <Text style={styles.budgetLabel}>
                        {campaign.budgetType === "fixed"
                            ? "Total Marketing Budget"
                            : "Estimated Monthly Investment"}
                    </Text>
                    <Text style={styles.budgetAmount}>{fmt(budget)}</Text>
                </View>

                {/* Content frequency */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Content Plan</Text>
                    <Text style={styles.infoText}>
                        {freq.count} posts / {freq.period} ({monthlyPosts} posts/month)
                    </Text>
                </View>

                {/* Features */}
                {summaryLines.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Selected Services</Text>
                        {summaryLines.map((line, i) => (
                            <View key={i} style={styles.checkRow}>
                                <FontAwesomeIcon
                                    icon={faCheck}
                                    size={14}
                                    color={colors.primary}
                                />
                                <Text style={styles.checkText}>{line}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Content creation details */}
                {campaign.features?.contentCreation?.enabled && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Influencer Preferences</Text>
                        {campaign.features.contentCreation.influencerFollowerRange && (
                            <InfoRow
                                label="Follower Range"
                                value={`${campaign.features.contentCreation.influencerFollowerRange[0].toLocaleString("en-IN")} – ${campaign.features.contentCreation.influencerFollowerRange[1].toLocaleString("en-IN")}`}
                                colors={colors}
                            />
                        )}
                        {campaign.features.contentCreation.minReach ? (
                            <InfoRow
                                label="Min Reach / Post"
                                value={campaign.features.contentCreation.minReach.toLocaleString("en-IN")}
                                colors={colors}
                            />
                        ) : null}
                        {campaign.features.contentCreation.niches?.length ? (
                            <InfoRow
                                label="Niches"
                                value={campaign.features.contentCreation.niches.join(", ")}
                                colors={colors}
                            />
                        ) : null}
                        {campaign.features.contentCreation.genderPreference?.length ? (
                            <InfoRow
                                label="Gender Preference"
                                value={campaign.features.contentCreation.genderPreference.join(", ")}
                                colors={colors}
                            />
                        ) : null}
                    </View>
                )}

                {/* ROI */}
                {(roi.organicReach || roi.clickThrough || roi.conversions) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Projected Monthly Returns</Text>
                        {roi.organicReach ? (
                            <InfoRow
                                label="Organic Reach"
                                value={`${roi.organicReach.toLocaleString("en-IN")}+`}
                                colors={colors}
                            />
                        ) : null}
                        {roi.clickThrough ? (
                            <InfoRow
                                label="Ad Click-throughs"
                                value={`~${roi.clickThrough.toLocaleString("en-IN")}`}
                                colors={colors}
                            />
                        ) : null}
                        {roi.conversions ? (
                            <InfoRow
                                label="Guaranteed Conversions"
                                value={`~${roi.conversions.toLocaleString("en-IN")}`}
                                colors={colors}
                            />
                        ) : null}
                    </View>
                )}
            </ScrollView>
        </AppLayout>
    );
};

const InfoRow: React.FC<{
    label: string;
    value: string;
    colors: ReturnType<typeof Colors>;
}> = ({ label, value, colors }) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: "transparent",
                },
                label: { fontSize: 13, color: colors.textSecondary },
                value: { fontSize: 13, fontWeight: "600", color: colors.text, flexShrink: 1, textAlign: "right" },
            }),
        [colors]
    );
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        center: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        errorText: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        scroll: {
            padding: 16,
            gap: 20,
            paddingBottom: 40,
            alignSelf: "center",
            width: "100%",
            maxWidth: xl ? 800 : undefined,
        },
        chipRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            backgroundColor: "transparent",
        },
        chip: {
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: colors.aliceBlue,
        },
        chipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.primary,
        },
        description: {
            fontSize: 15,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        budgetCard: {
            backgroundColor: colors.budgetCardBg,
            borderWidth: 1,
            borderColor: colors.budgetCardBorder,
            borderRadius: 16,
            padding: 20,
            gap: 4,
        },
        budgetLabel: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        budgetAmount: {
            fontSize: 28,
            fontWeight: "800",
            color: colors.primary,
        },
        section: {
            gap: 10,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        infoText: {
            fontSize: 14,
            color: colors.text,
        },
        checkRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            backgroundColor: "transparent",
        },
        checkText: {
            flex: 1,
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
        },
    });

export default CampaignDetails;
