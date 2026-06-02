import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { FEATURE_COSTS, IAgencyHire } from "@/types/AgencyHire";
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

function buildSpendBreakdown(hire: Partial<IAgencyHire>): SpendBreakdown {
    const trendlyFee = hire.estimatedBudget ?? 0;
    const influencerBudget =
        hire.features?.contentCreation.enabled
            ? (hire.features.contentCreation.influencerBudget ?? 0)
            : 0;
    const adBudget =
        hire.features?.adSpend.enabled
            ? (hire.features.adSpend.totalAdSpend ?? 0)
            : 0;
    return {
        trendlyFee,
        influencerBudget,
        adBudget,
        totalSpend: trendlyFee + influencerBudget + adBudget,
    };
}

function buildSummaryLines(hire: Partial<IAgencyHire>): string[] {
    const lines: string[] = [];
    const f = hire.features!;
    const freq = hire.contentFrequency!;
    const monthlyPosts =
        freq.period === "week" ? freq.count * 4 : freq.count;

    const inHousePieces = f.inHouseContent?.enabled
        ? (f.inHouseContent.period === "week"
            ? (f.inHouseContent.count ?? 0) * 4
            : (f.inHouseContent.count ?? 0))
        : 0;
    const totalContentVolume =
        (f.contentCreation.enabled ? monthlyPosts : 0) + inHousePieces;

    if (f.conversionAudit)
        lines.push(`Conversion Audit — ${fmt(FEATURE_COSTS.conversionAudit)}`);

    if (f.contentStrategy) {
        const cost =
            totalContentVolume <= 8
                ? FEATURE_COSTS.contentStrategyPerPost.low
                : totalContentVolume <= 20
                    ? FEATURE_COSTS.contentStrategyPerPost.mid
                    : FEATURE_COSTS.contentStrategyPerPost.high;
        lines.push(`Content Strategy — ${fmt(cost)}`);
    }

    if (f.inHouseContent?.enabled && inHousePieces > 0) {
        const fee = inHousePieces * FEATURE_COSTS.inHouseContentPerPiece;
        lines.push(
            `Trendly In-House Content (${inHousePieces} pieces/mo) — ${fmt(fee)}`
        );
    }

    if (f.contentCreation.enabled && f.contentCreation.influencerBudget) {
        const fee = Math.round(
            f.contentCreation.influencerBudget * FEATURE_COSTS.contentCreationPct
        );
        lines.push(
            `Influencer-led Content Creation (15% of ${fmt(f.contentCreation.influencerBudget)}) — ${fmt(fee)}`
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
    hire: Partial<IAgencyHire>;
    onBack: () => void;
    onSubmit: () => void;
    isSaving: boolean;
}

const StepFive: React.FC<StepFiveProps> = ({
    hire,
    onBack,
    onSubmit,
    isSaving,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl, width), [colors, xl, width]);

    const summaryLines = buildSummaryLines(hire);
    const spend = buildSpendBreakdown(hire);
    const roi = hire.estimatedROI ?? {};
    const hasDirectSpend = spend.influencerBudget > 0 || spend.adBudget > 0;

    return (
        <StepLayout
            step={3}
            title="Hire Summary"
            subtitle="Review your request before submitting"
            onBack={onBack}
        >
            {/* Overview card */}
            <View style={styles.overviewCard}>
                <Text style={styles.overviewHeading}>Your Agency Partnership</Text>
                <Text style={styles.overviewSub}>
                    Here's a summary of the plan you've configured. A Trendly POC will
                    review this and reach out within 24 hours.
                </Text>

                <View style={styles.metaRow}>
                    <MetaChip label="Monthly Retainer" colors={colors} />
                    <MetaChip
                        label={hire.budgetType === "fixed" ? "Fixed Budget" : "Custom Requirements"}
                        colors={colors}
                    />
                    {hire.contentFrequency ? (
                        <MetaChip
                            label={`${hire.contentFrequency.count} posts / ${hire.contentFrequency.period}`}
                            colors={colors}
                        />
                    ) : null}
                </View>
            </View>

            {/* Services */}
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
                <View style={styles.trendlyFeeCard}>
                    <Text style={styles.budgetLabel}>Trendly's Management Fee</Text>
                    <Text style={styles.budgetAmount}>{fmt(spend.trendlyFee)}</Text>
                </View>

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
                        Once you submit, a Trendly POC will contact you within 24 hours to
                        coordinate next steps. Feel free to call them directly too.
                    </Text>
                </View>
            </View>

            {/* Draft note */}
            <View style={styles.draftNote}>
                <Text style={styles.draftNoteText}>
                    💡 Your request details are already saved as a draft. You can come
                    back and finalise later.
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
                    style={styles.submitBtn}
                    disabled={isSaving}
                    icon={isSaving ? undefined : ({ size, color }) => (
                        <FontAwesomeIcon icon={faRocket} size={size ?? 16} color={color} />
                    )}
                >
                    {isSaving ? <ActivityIndicator size="small" color={colors.white} /> : "Submit & Get Started"}
                </Button>
            </View>
        </StepLayout>
    );
};

const MetaChip: React.FC<{ label: string; colors: ReturnType<typeof Colors> }> = ({
    label,
    colors,
}) => {
    const chipStyles = useMemo(
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
        <View style={chipStyles.chip}>
            <Text style={chipStyles.chipText}>{label}</Text>
        </View>
    );
};

const ROIRow: React.FC<{
    label: string;
    value: string;
    highlight?: boolean;
    colors: ReturnType<typeof Colors>;
}> = ({ label, value, highlight, colors }) => {
    const rowStyles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                    backgroundColor: "transparent",
                },
                label: { fontSize: 13, color: colors.textSecondary },
                value: { fontSize: 14, fontWeight: "700", color: colors.text },
                valueHighlight: { fontSize: 16, fontWeight: "800", color: colors.primary },
            }),
        [colors]
    );
    return (
        <View style={rowStyles.row}>
            <Text style={rowStyles.label}>{label}</Text>
            <Text style={highlight ? rowStyles.valueHighlight : rowStyles.value}>{value}</Text>
        </View>
    );
};

export default StepFive;

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean, width: number) =>
    StyleSheet.create({
        overviewCard: {
            borderRadius: 16,
            padding: 20,
            gap: 12,
            backgroundColor: colors.budgetCardBg,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        overviewHeading: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
        },
        overviewSub: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        metaRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            backgroundColor: "transparent",
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
            borderRadius: 16,
            padding: 20,
            gap: 4,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.15,
            elevation: 4,
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
            backgroundColor: colors.aliceBlue,
        },
        totalSpendCard: {
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.card,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
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
            borderRadius: 14,
            padding: 16,
            alignItems: "flex-start",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
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
            shadowColor: colors.green,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.1,
            elevation: 1,
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
        submitBtn: { flex: 2 },
    });
