import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { FEATURE_COSTS, ICampaign } from "@/types/Campaign";
import {
    faCheck,
    faPhone,
    faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";
const fmt = (n: number) => CURRENCY + n.toLocaleString("en-IN");

const RELATIONSHIP_MANAGER = "+91 76040 07256";

interface SpendBreakdown {
    trendlyFee: number;
    influencerBudget: number;
    adBudget: number;
    totalSpend: number;
}

function buildSpendBreakdown(campaign: Partial<ICampaign>): SpendBreakdown {
    const trendlyFee = campaign.estimatedBudget ?? 0;
    const influencerBudget =
        campaign.features?.contentCreation.enabled
            ? (campaign.features.contentCreation.influencerBudget ?? 0)
            : 0;
    const adBudget =
        campaign.features?.adSpend.enabled
            ? (campaign.features.adSpend.totalAdSpend ?? 0)
            : 0;
    return {
        trendlyFee,
        influencerBudget,
        adBudget,
        totalSpend: trendlyFee + influencerBudget + adBudget,
    };
}

function buildSummaryLines(campaign: Partial<ICampaign>): string[] {
    const lines: string[] = [];
    const f = campaign.features!;
    const freq = campaign.contentFrequency!;
    const monthlyPosts =
        freq.period === "week" ? freq.count * 4 : freq.count;

    if (f.conversionAudit)
        lines.push(`Conversion Audit — ${fmt(FEATURE_COSTS.conversionAudit)}`);

    if (f.contentStrategy) {
        const cost =
            monthlyPosts <= 8
                ? FEATURE_COSTS.contentStrategyPerPost.low
                : monthlyPosts <= 20
                    ? FEATURE_COSTS.contentStrategyPerPost.mid
                    : FEATURE_COSTS.contentStrategyPerPost.high;
        lines.push(`Content Strategy — ${fmt(cost)}`);
    }

    if (f.contentCreation.enabled && f.contentCreation.influencerBudget) {
        const fee = Math.round(
            f.contentCreation.influencerBudget * FEATURE_COSTS.contentCreationPct
        );
        lines.push(
            `Content Creation (15% of ${fmt(f.contentCreation.influencerBudget)}) — ${fmt(fee)}`
        );
    }

    if (f.adSpend.enabled && f.adSpend.totalAdSpend) {
        const fee = Math.round(
            f.adSpend.totalAdSpend * FEATURE_COSTS.adSpendPct
        );
        lines.push(
            `Ad Management (10% of ${fmt(f.adSpend.totalAdSpend)}) — ${fmt(fee)}`
        );
    }

    if (f.performanceMarketing.enabled)
        lines.push(`Performance Marketing — ${fmt(FEATURE_COSTS.performanceMarketing)}`);

    return lines;
}

interface StepFiveProps {
    campaign: Partial<ICampaign>;
    onBack: () => void;
    onSubmit: () => void;
    isSaving: boolean;
}

const StepFive: React.FC<StepFiveProps> = ({
    campaign,
    onBack,
    onSubmit,
    isSaving,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const summaryLines = buildSummaryLines(campaign);
    const spend = buildSpendBreakdown(campaign);
    const roi = campaign.estimatedROI ?? {};
    const hasDirectSpend = spend.influencerBudget > 0 || spend.adBudget > 0;

    return (
        <StepLayout
            step={5}
            title="Campaign Summary"
            subtitle="Review before you launch"
            onBack={onBack}
        >
            {/* Overview card */}
            <View style={styles.overviewCard}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                {campaign.description ? (
                    <Text style={styles.campaignDesc}>{campaign.description}</Text>
                ) : null}

                <View style={styles.metaRow}>
                    <MetaChip label={campaign.campaignType === "retainer" ? "Monthly Retainer" : "One-off Project"} colors={colors} />
                    <MetaChip label={campaign.budgetType === "fixed" ? "Fixed Budget" : "Needs-Based"} colors={colors} />
                    {campaign.platforms?.map((p) => (
                        <MetaChip key={p} label={p} colors={colors} />
                    ))}
                </View>

                <View style={styles.freqRow}>
                    <Text style={styles.freqText}>
                        {campaign.contentFrequency?.count} posts /{" "}
                        {campaign.contentFrequency?.period}
                    </Text>
                </View>
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

            {/* Budget breakdown */}
            <View style={styles.budgetSection}>
                {/* Trendly fee */}
                <View style={styles.trendlyFeeCard}>
                    <Text style={styles.budgetLabel}>Trendly's Management Fee</Text>
                    <Text style={styles.budgetAmount}>{fmt(spend.trendlyFee)}</Text>
                </View>

                {/* Direct spend rows */}
                {hasDirectSpend && (
                    <>
                        <View style={styles.directSpendSection}>
                            {spend.influencerBudget > 0 && (
                                <View style={styles.directSpendRow}>
                                    <Text style={styles.directSpendLabel}>
                                        → Towards Influencers
                                    </Text>
                                    <Text style={styles.directSpendValue}>
                                        {fmt(spend.influencerBudget)}
                                    </Text>
                                </View>
                            )}
                            {spend.adBudget > 0 && (
                                <View style={styles.directSpendRow}>
                                    <Text style={styles.directSpendLabel}>
                                        → Towards Ads
                                    </Text>
                                    <Text style={styles.directSpendValue}>
                                        {fmt(spend.adBudget)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.spendDivider} />

                        {/* Total marketing spend */}
                        <View style={styles.totalSpendCard}>
                            <Text style={styles.totalSpendLabel}>
                                Total Marketing Spend
                            </Text>
                            <Text style={styles.totalSpendAmount}>
                                {fmt(spend.totalSpend)}
                            </Text>
                        </View>
                    </>
                )}
            </View>

            {/* ROI */}
            {(roi.organicReach || roi.clickThrough || roi.conversions || roi.roas) && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Projected Monthly Returns</Text>
                    {roi.organicReach ? (
                        <ROIRow label="Organic Reach & Interactions" value={`${roi.organicReach.toLocaleString("en-IN")}+`} colors={colors} />
                    ) : null}
                    {roi.clickThrough ? (
                        <ROIRow label="Ad Click-throughs" value={`~${roi.clickThrough.toLocaleString("en-IN")}`} colors={colors} />
                    ) : null}
                    {roi.conversions ? (
                        <ROIRow label="Guaranteed Conversions" value={`~${roi.conversions.toLocaleString("en-IN")}`} colors={colors} />
                    ) : null}
                    {roi.roas ? (
                        <ROIRow
                            label="Return on Ad Spend (ROAS)"
                            value={(() => {
                                const v = Math.round(roi.roas * 10) / 10;
                                return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "X";
                            })()}
                            highlight
                            colors={colors}
                        />
                    ) : null}
                </View>
            )}

            {/* RM contact */}
            <View style={styles.rmCard}>
                <FontAwesomeIcon icon={faPhone} size={16} color={colors.primary} />
                <View style={styles.rmText}>
                    <Text style={styles.rmTitle}>
                        Your Relationship Manager
                    </Text>
                    <Text style={styles.rmNumber}>{RELATIONSHIP_MANAGER}</Text>
                    <Text style={styles.rmNote}>
                        Once you pay, a Trendly POC will contact you within 24 hours to
                        coordinate next steps. Feel free to call them directly too.
                    </Text>
                </View>
            </View>

            {/* Draft note */}
            <View style={styles.draftNote}>
                <Text style={styles.draftNoteText}>
                    💡 Your campaign details are already saved as a draft. You can come
                    back and pay later from your campaigns list.
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.buttons}>
                <Button mode="outlined" onPress={onBack} style={styles.backBtn} disabled={isSaving}>
                    Back
                </Button>
                <Button
                    mode="contained"
                    onPress={onSubmit}
                    style={styles.payBtn}
                    disabled={isSaving}
                    icon={isSaving ? undefined : ({ size, color }) => (
                        <FontAwesomeIcon icon={faRocket} size={size ?? 16} color={color} />
                    )}
                >
                    {isSaving ? <ActivityIndicator size="small" color={colors.white} /> : "Pay & Get Started"}
                </Button>
            </View>
        </StepLayout>
    );
};

const MetaChip: React.FC<{ label: string; colors: ReturnType<typeof Colors> }> = ({
    label,
    colors,
}) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
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
            }),
        [colors]
    );
    return (
        <View style={styles.chip}>
            <Text style={styles.chipText}>{label}</Text>
        </View>
    );
};

const ROIRow: React.FC<{
    label: string;
    value: string;
    highlight?: boolean;
    colors: ReturnType<typeof Colors>;
}> = ({ label, value, highlight, colors }) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: "transparent",
                },
                label: { fontSize: 13, color: colors.textSecondary },
                value: { fontSize: 14, fontWeight: "700", color: colors.text },
                valueHighlight: { fontSize: 16, fontWeight: "800", color: colors.primary },
            }),
        [colors]
    );
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={highlight ? styles.valueHighlight : styles.value}>{value}</Text>
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        overviewCard: {
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 16,
            padding: 20,
            gap: 12,
            backgroundColor: colors.budgetCardBg,
        },
        campaignName: {
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
        },
        campaignDesc: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        metaRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            backgroundColor: "transparent",
        },
        freqRow: {
            backgroundColor: "transparent",
        },
        freqText: {
            fontSize: 13,
            color: colors.textSecondary,
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
        budgetSection: {
            gap: 12,
            backgroundColor: "transparent",
        },
        trendlyFeeCard: {
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
            fontWeight: "500",
        },
        budgetAmount: {
            fontSize: 32,
            fontWeight: "800",
            color: colors.primary,
        },
        directSpendSection: {
            gap: 6,
            paddingHorizontal: 4,
            backgroundColor: "transparent",
        },
        directSpendRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        directSpendLabel: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        directSpendValue: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        spendDivider: {
            height: 1,
            backgroundColor: colors.border,
        },
        totalSpendCard: {
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.card,
        },
        totalSpendLabel: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        totalSpendAmount: {
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
        },
        rmCard: {
            flexDirection: "row",
            gap: 14,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 16,
            alignItems: "flex-start",
        },
        rmText: {
            flex: 1,
            gap: 4,
            backgroundColor: "transparent",
        },
        rmTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        rmNumber: {
            fontSize: 16,
            fontWeight: "800",
            color: colors.primary,
        },
        rmNote: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 18,
            marginTop: 4,
        },
        draftNote: {
            backgroundColor: colors.reachCardBg,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.reachCardBorder,
        },
        draftNoteText: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 19,
        },
        buttons: {
            flexDirection: "row",
            gap: 12,
            backgroundColor: "transparent",
        },
        backBtn: { flex: 1 },
        payBtn: { flex: 2 },
    });

export default StepFive;
