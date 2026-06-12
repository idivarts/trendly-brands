import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { INFLUENCER_CATEGORIES } from "@/constants/ItemsList";
import { useBreakpoints } from "@/hooks";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import {
    AgencyHireFeatures,
    ContentFrequency,
    ContentFrequencyPeriod,
    FEATURE_COSTS,
    FEATURE_MIN_BUDGETS,
    IAgencyHire,
} from "@/types/AgencyHire";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Switch } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";
const fmt = (n: number) => CURRENCY + n.toLocaleString("en-IN");

// ─── Influencer budget calculator ────────────────────────────────────────────
function calcInfluencerBudgetFromInputs(
    followerRange: [number, number] | undefined,
    minReach: number | undefined,
    monthlyPosts: number
): number {
    if (!followerRange || !monthlyPosts) return 0;
    const [minF, maxF] = followerRange;
    const avgFollowers = (minF + maxF) / 2;
    if (avgFollowers === 0) return 0;

    let ratePerPost: number;
    if (avgFollowers < 10_000) ratePerPost = 1_500;
    else if (avgFollowers < 50_000) ratePerPost = 5_000;
    else if (avgFollowers < 100_000) ratePerPost = 12_000;
    else if (avgFollowers < 500_000) ratePerPost = 35_000;
    else ratePerPost = 80_000;

    if (minReach) {
        const reachRatio = minReach / avgFollowers;
        if (reachRatio > 0.3) ratePerPost = Math.round(ratePerPost * 1.5);
        else if (reachRatio > 0.15) ratePerPost = Math.round(ratePerPost * 1.2);
    }

    return Math.round(ratePerPost * monthlyPosts);
}

// Monthly count of in-house content pieces produced by Trendly's team.
function inHouseMonthlyPieces(f: AgencyHireFeatures): number {
    if (!f.inHouseContent?.enabled) return 0;
    const count = f.inHouseContent.count ?? 0;
    return f.inHouseContent.period === "week" ? count * 4 : count;
}

// ─── Budget breakdown ─────────────────────────────────────────────────────────
interface BudgetBreakdown {
    trendlyFee: number;
    influencerBudget: number;
    adBudget: number;
    totalSpend: number;
}

function calcBreakdown(hire: Partial<IAgencyHire>): BudgetBreakdown {
    const freq = hire.contentFrequency ?? { count: 4, period: "month" };
    const monthlyPosts = freq.period === "week" ? freq.count * 4 : freq.count;
    const f = hire.features!;
    const isRetainer = hire.hireType === "retainer";

    let trendlyFee = 0;
    const influencerBudget = f.contentCreation.enabled
        ? (f.contentCreation.influencerBudget ?? 0)
        : 0;
    const adBudget = f.adSpend.enabled ? (f.adSpend.totalAdSpend ?? 0) : 0;

    // Total monthly content volume drives content-strategy pricing — both the
    // influencer-led posts and the in-house produced pieces count towards it.
    const inHousePieces = inHouseMonthlyPieces(f);
    const totalContentVolume =
        (f.contentCreation.enabled ? monthlyPosts : 0) + inHousePieces;

    if (f.conversionAudit && !isRetainer) {
        trendlyFee += FEATURE_COSTS.conversionAudit;
    }

    if (f.contentStrategy) {
        trendlyFee +=
            totalContentVolume <= 8
                ? FEATURE_COSTS.contentStrategyPerPost.low
                : totalContentVolume <= 20
                    ? FEATURE_COSTS.contentStrategyPerPost.mid
                    : FEATURE_COSTS.contentStrategyPerPost.high;
    }

    if (f.inHouseContent?.enabled && inHousePieces) {
        trendlyFee += inHousePieces * FEATURE_COSTS.inHouseContentPerPiece;
    }

    if (f.contentCreation.enabled && influencerBudget) {
        trendlyFee += Math.round(influencerBudget * FEATURE_COSTS.contentCreationPct);
    }

    if (f.adSpend.enabled && adBudget) {
        trendlyFee += Math.round(adBudget * FEATURE_COSTS.adSpendPct);
    }

    if (f.performanceMarketing.enabled) {
        trendlyFee += FEATURE_COSTS.performanceMarketing;
    }

    return {
        trendlyFee,
        influencerBudget,
        adBudget,
        totalSpend: trendlyFee + influencerBudget + adBudget,
    };
}

function calcBudget(hire: Partial<IAgencyHire>): number {
    return calcBreakdown(hire).trendlyFee;
}

// ─── Auto-suggest features for fixed-budget hires ────────────────────────────
function autoSuggestFeatures(
    totalBudget: number,
    monthlyPosts: number,
    isRetainer: boolean
): AgencyHireFeatures {
    const posts = Math.max(monthlyPosts, 1);

    if (totalBudget < 25_000) {
        const range: [number, number] = [1_000, 10_000];
        return {
            conversionAudit: isRetainer,
            contentStrategy: false,
            inHouseContent: { enabled: false, count: 4, period: "month" },
            contentCreation: {
                enabled: true,
                influencerFollowerRange: range,
                minReach: undefined,
                influencerBudget: calcInfluencerBudgetFromInputs(range, undefined, posts),
            },
            adSpend: { enabled: false },
            performanceMarketing: { enabled: false },
        };
    }

    if (totalBudget < 60_000) {
        const range: [number, number] = [5_000, 30_000];
        return {
            conversionAudit: isRetainer,
            contentStrategy: true,
            inHouseContent: { enabled: false, count: 4, period: "month" },
            contentCreation: {
                enabled: true,
                influencerFollowerRange: range,
                minReach: 1_000,
                influencerBudget: calcInfluencerBudgetFromInputs(range, 1_000, posts),
            },
            adSpend: { enabled: false },
            performanceMarketing: { enabled: false },
        };
    }

    if (totalBudget < 120_000) {
        const range: [number, number] = [10_000, 50_000];
        return {
            conversionAudit: true,
            contentStrategy: true,
            inHouseContent: { enabled: false, count: 4, period: "month" },
            contentCreation: {
                enabled: true,
                influencerFollowerRange: range,
                minReach: 3_000,
                influencerBudget: calcInfluencerBudgetFromInputs(range, 3_000, posts),
            },
            adSpend: { enabled: false },
            performanceMarketing: { enabled: false },
        };
    }

    if (totalBudget < 250_000) {
        const range: [number, number] = [20_000, 100_000];
        const adSpend = Math.round(totalBudget * 0.25);
        return {
            conversionAudit: true,
            contentStrategy: true,
            inHouseContent: { enabled: false, count: 4, period: "month" },
            contentCreation: {
                enabled: true,
                influencerFollowerRange: range,
                minReach: 5_000,
                influencerBudget: calcInfluencerBudgetFromInputs(range, 5_000, posts),
            },
            adSpend: { enabled: true, totalAdSpend: adSpend },
            performanceMarketing: { enabled: false },
        };
    }

    const range: [number, number] = [50_000, 300_000];
    const adSpend = Math.round(totalBudget * 0.3);
    return {
        conversionAudit: true,
        contentStrategy: true,
        inHouseContent: { enabled: false, count: 4, period: "month" },
        contentCreation: {
            enabled: true,
            influencerFollowerRange: range,
            minReach: 10_000,
            influencerBudget: calcInfluencerBudgetFromInputs(range, 10_000, posts),
        },
        adSpend: { enabled: true, totalAdSpend: adSpend },
        performanceMarketing: { enabled: true },
    };
}

function calcROI(hire: Partial<IAgencyHire>) {
    const f = hire.features!;
    const freq = hire.contentFrequency ?? { count: 4, period: "month" };
    const monthlyPosts = freq.period === "week" ? freq.count * 4 : freq.count;
    const influencerBudget = f.contentCreation.influencerBudget ?? 0;

    let organicReach: number | undefined;
    let clickThrough: number | undefined;
    let conversions: number | undefined;
    let roas: number | undefined;

    if (f.contentCreation.enabled && influencerBudget) {
        const minReach = f.contentCreation.minReach ?? 5_000;
        organicReach = minReach * monthlyPosts;
    }
    if (f.adSpend.enabled && f.adSpend.totalAdSpend) {
        clickThrough = Math.floor(f.adSpend.totalAdSpend / 15);
    }
    if (f.performanceMarketing.enabled && clickThrough) {
        conversions = Math.floor(clickThrough * 0.02);
    }
    if (f.performanceMarketing.enabled && conversions && f.performanceMarketing.avgSaleValue) {
        const revenue = conversions * f.performanceMarketing.avgSaleValue;
        const { totalSpend } = calcBreakdown(hire);
        if (totalSpend > 0) {
            roas = revenue / totalSpend;
        }
    }
    return { organicReach, clickThrough, conversions, roas };
}

// ─── PeriodPill ───────────────────────────────────────────────────────────────
interface PeriodPillProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
}

const PeriodPill: React.FC<PeriodPillProps> = ({ label, selected, onPress, colors }) => {
    const pillStyles = useMemo(
        () =>
            StyleSheet.create({
                pill: {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.budgetCardBg : colors.tag,
                    shadowColor: selected ? colors.primary : "#000",
                    shadowOffset: { width: 0, height: selected ? 2 : 1 },
                    shadowRadius: selected ? 6 : 3,
                    shadowOpacity: selected ? 0.25 : 0.04,
                    elevation: selected ? 2 : 1,
                },
                label: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: selected ? colors.primary : colors.textSecondary,
                },
            }),
        [selected, colors]
    );
    return (
        <Pressable onPress={onPress} style={pillStyles.pill}>
            <Text style={pillStyles.label}>{label}</Text>
        </Pressable>
    );
};

// ─── FeatureRow ───────────────────────────────────────────────────────────────
interface FeatureRowProps {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    disabled?: boolean;
    disabledReason?: string;
    lockedEnabled?: boolean;
    lockedBadge?: string;
    children?: React.ReactNode;
    colors: ReturnType<typeof Colors>;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
    title,
    description,
    enabled,
    onToggle,
    disabled,
    disabledReason,
    lockedEnabled,
    lockedBadge,
    children,
    colors,
}) => {
    const isOn = lockedEnabled || (enabled && !disabled);

    const rowStyles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    borderRadius: 14,
                    backgroundColor: disabled ? colors.aliceBlue : colors.card,
                    padding: 16,
                    gap: 8,
                    opacity: disabled ? 0.55 : 1,
                    shadowColor: isOn ? colors.primary : "#000",
                    shadowOffset: { width: 0, height: isOn ? 3 : 2 },
                    shadowRadius: isOn ? 10 : 6,
                    shadowOpacity: isOn ? 0.2 : 0.06,
                    elevation: isOn ? 3 : 2,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    backgroundColor: "transparent",
                },
                textBlock: {
                    flex: 1,
                    backgroundColor: "transparent",
                },
                title: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.text,
                },
                desc: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 18,
                    marginTop: 2,
                },
                disabledHint: {
                    fontSize: 12,
                    color: colors.errorBannerText,
                    marginTop: 4,
                },
                lockedBadgeView: {
                    alignSelf: "flex-start",
                    marginTop: 6,
                    backgroundColor: colors.reachCardBg,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                },
                lockedBadgeText: {
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.green,
                },
                subfields: {
                    marginTop: 4,
                    gap: 10,
                    backgroundColor: "transparent",
                },
            }),
        [isOn, disabled, colors]
    );

    return (
        <View style={rowStyles.card}>
            <View style={rowStyles.header}>
                <View style={rowStyles.textBlock}>
                    <Text style={rowStyles.title}>{title}</Text>
                    <Text style={rowStyles.desc}>{description}</Text>
                    {disabled && disabledReason ? (
                        <Text style={rowStyles.disabledHint}>{disabledReason}</Text>
                    ) : null}
                    {lockedEnabled && lockedBadge ? (
                        <View style={rowStyles.lockedBadgeView}>
                            <Text style={rowStyles.lockedBadgeText}>{lockedBadge}</Text>
                        </View>
                    ) : null}
                </View>
                {lockedEnabled ? (
                    <Switch
                        value={true}
                        disabled
                        trackColor={{ false: colors.border, true: colors.green }}
                        thumbColor={colors.white}
                        ios_backgroundColor={colors.border}
                    />
                ) : (
                    <Switch
                        value={isOn}
                        onValueChange={(v) => { if (!disabled) onToggle(v); }}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.white}
                        ios_backgroundColor={colors.border}
                        disabled={disabled}
                    />
                )}
            </View>
            {isOn && children ? (
                <View style={rowStyles.subfields}>{children}</View>
            ) : null}
        </View>
    );
};

// ─── BudgetPanel ──────────────────────────────────────────────────────────────
interface BudgetPanelProps {
    breakdown: BudgetBreakdown;
    roi: ReturnType<typeof calcROI>;
    isFixed: boolean;
    isRetainer: boolean;
    declaredBudget?: number;
    colors: ReturnType<typeof Colors>;
}

const BudgetPanel: React.FC<BudgetPanelProps> = ({
    breakdown,
    roi,
    isFixed,
    isRetainer,
    declaredBudget,
    colors,
}) => {
    const panelStyles = useMemo(
        () =>
            StyleSheet.create({
                panel: {
                    gap: 16,
                    backgroundColor: "transparent",
                },
                trendlyCard: {
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
                trendlyLabel: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                },
                trendlyAmount: {
                    fontSize: 30,
                    fontWeight: "800",
                    color: colors.primary,
                },
                trendlySub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                directSection: {
                    gap: 6,
                    backgroundColor: "transparent",
                },
                directRow: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 4,
                    backgroundColor: "transparent",
                },
                directLabel: {
                    fontSize: 13,
                    color: colors.textSecondary,
                },
                directValue: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                },
                totalCard: {
                    borderRadius: 14,
                    padding: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                totalLabel: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                },
                totalAmount: {
                    fontSize: 20,
                    fontWeight: "800",
                    color: colors.text,
                },
                divider: {
                    height: 1,
                    backgroundColor: colors.aliceBlue,
                },
                roiCard: {
                    backgroundColor: colors.reachCardBg,
                    borderRadius: 16,
                    padding: 20,
                    gap: 12,
                    shadowColor: colors.green,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.15,
                    elevation: 2,
                },
                roiTitle: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
                roiRow: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "transparent",
                },
                roiMetric: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    flex: 1,
                },
                roiValue: {
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                },
                roiEmpty: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontStyle: "italic",
                },
                roasValue: {
                    color: colors.primary,
                    fontSize: 16,
                },
                declaredRef: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: colors.aliceBlue,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                },
                declaredRefLabel: {
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                declaredRefValue: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.text,
                },
                overBudgetBox: {
                    backgroundColor: colors.errorBannerBg,
                    borderRadius: 10,
                    padding: 10,
                    shadowColor: colors.errorBannerText,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.12,
                    elevation: 2,
                },
                overBudgetText: {
                    fontSize: 12,
                    color: colors.errorBannerText,
                    lineHeight: 18,
                },
            }),
        [colors]
    );

    const { trendlyFee, influencerBudget, adBudget, totalSpend } = breakdown;
    const hasDirectSpend = influencerBudget > 0 || adBudget > 0;
    const hasROI = roi.organicReach || roi.clickThrough || roi.conversions || roi.roas;
    const isOverBudget = isFixed && declaredBudget && totalSpend > declaredBudget;

    const fmtROAS = (r: number) => {
        const v = Math.round(r * 10) / 10;
        return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "X";
    };

    return (
        <View style={panelStyles.panel}>
            {isFixed && declaredBudget ? (
                <View style={panelStyles.declaredRef}>
                    <Text style={panelStyles.declaredRefLabel}>Your budget target</Text>
                    <Text style={panelStyles.declaredRefValue}>{fmt(declaredBudget)}</Text>
                </View>
            ) : null}

            <View style={panelStyles.trendlyCard}>
                <Text style={panelStyles.trendlyLabel}>Trendly's Cost</Text>
                <Text style={panelStyles.trendlyAmount}>{fmt(trendlyFee)}</Text>
                <Text style={panelStyles.trendlySub}>
                    Our management fee for selected services
                    {isRetainer ? " · per month" : " · one-off"}
                </Text>
            </View>

            {hasDirectSpend && (
                <>
                    <View style={panelStyles.directSection}>
                        {influencerBudget > 0 && (
                            <View style={panelStyles.directRow}>
                                <Text style={panelStyles.directLabel}>
                                    → Towards Influencers
                                </Text>
                                <Text style={panelStyles.directValue}>
                                    {fmt(influencerBudget)}
                                </Text>
                            </View>
                        )}
                        {adBudget > 0 && (
                            <View style={panelStyles.directRow}>
                                <Text style={panelStyles.directLabel}>
                                    → Towards Ads
                                </Text>
                                <Text style={panelStyles.directValue}>
                                    {fmt(adBudget)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={panelStyles.divider} />

                    <View style={panelStyles.totalCard}>
                        <Text style={panelStyles.totalLabel}>Total Marketing Spend</Text>
                        <Text style={panelStyles.totalAmount}>{fmt(totalSpend)}</Text>
                    </View>
                </>
            )}

            {isOverBudget && (
                <View style={panelStyles.overBudgetBox}>
                    <Text style={panelStyles.overBudgetText}>
                        ⚠️ Your selected services total {fmt(totalSpend)}, which exceeds your declared budget of {fmt(declaredBudget!)}. You can adjust the features or increase your budget in the previous step.
                    </Text>
                </View>
            )}

            <View style={panelStyles.roiCard}>
                <Text style={panelStyles.roiTitle}>Approx. Monthly ROI</Text>
                {hasROI ? (
                    <>
                        {roi.organicReach ? (
                            <View style={panelStyles.roiRow}>
                                <Text style={panelStyles.roiMetric}>
                                    Organic Reach & Interactions
                                </Text>
                                <Text style={panelStyles.roiValue}>
                                    {roi.organicReach.toLocaleString("en-IN")}+
                                </Text>
                            </View>
                        ) : null}
                        {roi.clickThrough ? (
                            <View style={panelStyles.roiRow}>
                                <Text style={panelStyles.roiMetric}>
                                    Ad Click-throughs / Profile Visits
                                </Text>
                                <Text style={panelStyles.roiValue}>
                                    ~{roi.clickThrough.toLocaleString("en-IN")}
                                </Text>
                            </View>
                        ) : null}
                        {roi.conversions ? (
                            <View style={panelStyles.roiRow}>
                                <Text style={panelStyles.roiMetric}>
                                    Guaranteed Conversions / Sales
                                </Text>
                                <Text style={panelStyles.roiValue}>
                                    ~{roi.conversions.toLocaleString("en-IN")}
                                </Text>
                            </View>
                        ) : null}
                        {roi.roas ? (
                            <View style={panelStyles.roiRow}>
                                <Text style={panelStyles.roiMetric}>
                                    Return on Ad Spend (ROAS)
                                </Text>
                                <Text style={[panelStyles.roiValue, panelStyles.roasValue]}>
                                    {fmtROAS(roi.roas)}
                                </Text>
                            </View>
                        ) : null}
                    </>
                ) : (
                    <Text style={panelStyles.roiEmpty}>
                        Enable content creation, ad spend, or performance marketing to
                        see estimated returns.
                    </Text>
                )}
            </View>
        </View>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
interface StepFourProps {
    hire: Partial<IAgencyHire>;
    setHire: React.Dispatch<React.SetStateAction<Partial<IAgencyHire>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepFour: React.FC<StepFourProps> = ({
    hire,
    setHire,
    onNext,
    onBack,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useStyles(colors, xl, width);

    const features = hire.features!;
    const isRetainer = hire.hireType === "retainer";
    const isFixed = hire.budgetType === "fixed";
    const breakdown = calcBreakdown(hire);
    const roi = calcROI(hire);

    const monthlyPosts = useMemo(() => {
        const freq = hire.contentFrequency ?? { count: 4, period: "month" };
        return freq.period === "week" ? freq.count * 4 : freq.count;
    }, [hire.contentFrequency]);

    useEffect(() => {
        if (isRetainer && !features.conversionAudit) {
            setHire((prev) => ({
                ...prev,
                features: { ...prev.features!, conversionAudit: true },
            }));
        }
    }, [isRetainer]);

    const autoSuggestDone = useRef(false);
    useEffect(() => {
        if (!isFixed || autoSuggestDone.current) return;
        if (!hire.totalBudget || hire.totalBudget <= 0) return;
        autoSuggestDone.current = true;
        const suggested = autoSuggestFeatures(hire.totalBudget, monthlyPosts, isRetainer);
        setHire((prev) => {
            const updated = { ...prev, features: suggested };
            const bd = calcBreakdown(updated);
            return { ...updated, estimatedBudget: bd.trendlyFee, estimatedROI: calcROI(updated) };
        });
    }, [isFixed, hire.totalBudget, monthlyPosts]);

    const patchFeatures = useCallback(
        (patch: Partial<AgencyHireFeatures>) =>
            setHire((prev) => {
                const newFeatures = { ...prev.features!, ...patch };

                if (newFeatures.contentCreation.enabled) {
                    const calculated = calcInfluencerBudgetFromInputs(
                        newFeatures.contentCreation.influencerFollowerRange,
                        newFeatures.contentCreation.minReach,
                        monthlyPosts
                    );
                    newFeatures.contentCreation = {
                        ...newFeatures.contentCreation,
                        influencerBudget: calculated,
                    };
                }

                const updated = { ...prev, features: newFeatures };
                const bd = calcBreakdown(updated);
                return {
                    ...updated,
                    estimatedBudget: bd.trendlyFee,
                    estimatedROI: calcROI(updated),
                };
            }),
        [setHire, monthlyPosts]
    );

    const setFreq = useCallback(
        (patch: Partial<ContentFrequency>) =>
            setHire((prev) => {
                const newFreq = { ...prev.contentFrequency!, ...patch };
                const newMonthlyPosts =
                    newFreq.period === "week" ? newFreq.count * 4 : newFreq.count;
                const newFeatures = { ...prev.features! };
                if (newFeatures.contentCreation.enabled) {
                    newFeatures.contentCreation = {
                        ...newFeatures.contentCreation,
                        influencerBudget: calcInfluencerBudgetFromInputs(
                            newFeatures.contentCreation.influencerFollowerRange,
                            newFeatures.contentCreation.minReach,
                            newMonthlyPosts
                        ),
                    };
                }
                const updated = { ...prev, contentFrequency: newFreq, features: newFeatures };
                const bd = calcBreakdown(updated);
                return { ...updated, estimatedBudget: bd.trendlyFee, estimatedROI: calcROI(updated) };
            }),
        [setHire]
    );

    const isDisabled = (minBudget: number) =>
        isFixed && ((hire.totalBudget ?? 10000) < minBudget);

    const genderOptions = ["Male", "Female", "Non-binary"];

    const calculatedInfluencerBudget = features.contentCreation.enabled
        ? (features.contentCreation.influencerBudget ?? 0)
        : 0;

    const inHousePieces = inHouseMonthlyPieces(features);
    const inHouseCost = inHousePieces * FEATURE_COSTS.inHouseContentPerPiece;

    const FeaturesPanel = (
        <View style={styles.featuresList}>
            <FeatureRow
                title="Conversion Audit"
                description="End-to-end audit of your IG page aesthetic, website load speed, and remarketing setup to identify drop-off points."
                enabled={features.conversionAudit}
                onToggle={(v) => patchFeatures({ conversionAudit: v })}
                disabled={!isRetainer && isDisabled(FEATURE_MIN_BUDGETS.conversionAudit)}
                disabledReason={`Requires budget ≥ ${fmt(FEATURE_MIN_BUDGETS.conversionAudit)}`}
                lockedEnabled={isRetainer}
                lockedBadge="✦ Included free for Monthly Retainer"
                colors={colors}
            />

            <FeatureRow
                title="Content Strategy Creation"
                description="A tailored content calendar and strategy aligned to your brand voice and campaign goals. Cost varies from ₹15k–50k based on monthly content volume."
                enabled={features.contentStrategy}
                onToggle={(v) => patchFeatures({ contentStrategy: v })}
                disabled={isDisabled(FEATURE_MIN_BUDGETS.contentStrategy)}
                disabledReason={`Requires budget ≥ ${fmt(FEATURE_MIN_BUDGETS.contentStrategy)}`}
                colors={colors}
            />

            <FeatureRow
                title="Trendly (In House) Content Creation"
                description={`Hand over your content needs to our in-house designers & team. We produce images, videos, and motion graphics to advertise your brand — just tell us how much content you need. ${fmt(FEATURE_COSTS.inHouseContentPerPiece)} per content piece.`}
                enabled={features.inHouseContent?.enabled ?? false}
                onToggle={(v) =>
                    patchFeatures({
                        inHouseContent: { ...features.inHouseContent, enabled: v },
                    })
                }
                disabled={isDisabled(FEATURE_MIN_BUDGETS.inHouseContent)}
                disabledReason={`Requires budget ≥ ${fmt(FEATURE_MIN_BUDGETS.inHouseContent)}`}
                colors={colors}
            >
                <View style={styles.freqRow}>
                    <TextInput
                        label="Content count"
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.freqCountInput}
                        value={
                            (features.inHouseContent?.count ?? 0) > 0
                                ? features.inHouseContent!.count!.toString()
                                : ""
                        }
                        onChangeText={(text) =>
                            patchFeatures({
                                inHouseContent: {
                                    ...features.inHouseContent,
                                    enabled: true,
                                    count: parseInt(text) || 0,
                                },
                            })
                        }
                    />
                    <View style={styles.freqPills}>
                        <PeriodPill
                            label="/ week"
                            selected={
                                (features.inHouseContent?.period ?? "month") === "week"
                            }
                            onPress={() =>
                                patchFeatures({
                                    inHouseContent: {
                                        ...features.inHouseContent,
                                        enabled: true,
                                        period: "week" as ContentFrequencyPeriod,
                                    },
                                })
                            }
                            colors={colors}
                        />
                        <PeriodPill
                            label="/ month"
                            selected={
                                (features.inHouseContent?.period ?? "month") === "month"
                            }
                            onPress={() =>
                                patchFeatures({
                                    inHouseContent: {
                                        ...features.inHouseContent,
                                        enabled: true,
                                        period: "month" as ContentFrequencyPeriod,
                                    },
                                })
                            }
                            colors={colors}
                        />
                    </View>
                </View>
                {inHouseCost > 0 && (
                    <View style={styles.calcBudgetBox}>
                        <Text style={styles.calcBudgetLabel}>
                            In-House Production Fee
                        </Text>
                        <Text style={styles.calcBudgetValue}>
                            {fmt(inHouseCost)} / month
                        </Text>
                        <Text style={styles.calcBudgetNote}>
                            {inHousePieces} content {inHousePieces === 1 ? "piece" : "pieces"} / month ×{" "}
                            {fmt(FEATURE_COSTS.inHouseContentPerPiece)} per piece.
                        </Text>
                    </View>
                )}
            </FeatureRow>

            <FeatureRow
                title="Influencer led Content Creation"
                description={`We shortlist and coordinate with influencers to deliver content. Our fee is 15% of the influencer budget — we calculate the budget from your follower and reach requirements. Total content target: ${monthlyPosts} posts/month.`}
                enabled={features.contentCreation.enabled}
                onToggle={(v) =>
                    patchFeatures({
                        contentCreation: { ...features.contentCreation, enabled: v },
                    })
                }
                colors={colors}
            >
                <View style={styles.freqRow}>
                    <TextInput
                        label="Posts count"
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.freqCountInput}
                        value={
                            (hire.contentFrequency?.count ?? 0) > 0
                                ? hire.contentFrequency!.count.toString()
                                : ""
                        }
                        onChangeText={(text) =>
                            setFreq({ count: parseInt(text) || 0 })
                        }
                    />
                    <View style={styles.freqPills}>
                        <PeriodPill
                            label="/ week"
                            selected={
                                (hire.contentFrequency?.period ?? "month") === "week"
                            }
                            onPress={() =>
                                setFreq({ period: "week" as ContentFrequencyPeriod })
                            }
                            colors={colors}
                        />
                        <PeriodPill
                            label="/ month"
                            selected={
                                (hire.contentFrequency?.period ?? "month") === "month"
                            }
                            onPress={() =>
                                setFreq({ period: "month" as ContentFrequencyPeriod })
                            }
                            colors={colors}
                        />
                    </View>
                </View>

                <View style={styles.subRow}>
                    <TextInput
                        label="Min Followers"
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.halfInput}
                        value={
                            features.contentCreation.influencerFollowerRange?.[0]
                                ? features.contentCreation.influencerFollowerRange[0].toString()
                                : ""
                        }
                        onChangeText={(text) =>
                            patchFeatures({
                                contentCreation: {
                                    ...features.contentCreation,
                                    influencerFollowerRange: [
                                        parseInt(text) || 0,
                                        features.contentCreation.influencerFollowerRange?.[1] ?? 100_000,
                                    ],
                                },
                            })
                        }
                    />
                    <TextInput
                        label="Max Followers"
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.halfInput}
                        value={
                            features.contentCreation.influencerFollowerRange?.[1]
                                ? features.contentCreation.influencerFollowerRange[1].toString()
                                : ""
                        }
                        onChangeText={(text) =>
                            patchFeatures({
                                contentCreation: {
                                    ...features.contentCreation,
                                    influencerFollowerRange: [
                                        features.contentCreation.influencerFollowerRange?.[0] ?? 0,
                                        parseInt(text) || 100_000,
                                    ],
                                },
                            })
                        }
                    />
                </View>
                <TextInput
                    label="Min Reach / Views per Post (e.g. 5000)"
                    mode="outlined"
                    keyboardType="number-pad"
                    value={
                        features.contentCreation.minReach
                            ? features.contentCreation.minReach.toString()
                            : ""
                    }
                    onChangeText={(text) =>
                        patchFeatures({
                            contentCreation: {
                                ...features.contentCreation,
                                minReach: parseInt(text) || 0,
                            },
                        })
                    }
                />
                <MultiSelectExtendable
                    buttonLabel="Add Niche"
                    closeOnSelect
                    initialMultiselectItemsList={INFLUENCER_CATEGORIES}
                    initialItemsList={INFLUENCER_CATEGORIES}
                    onSelectedItemsChange={(value) =>
                        patchFeatures({
                            contentCreation: {
                                ...features.contentCreation,
                                niches: value,
                            },
                        })
                    }
                    selectedItems={features.contentCreation.niches || []}
                    theme={theme}
                />
                <MultiSelectExtendable
                    buttonLabel="Add Gender Preference"
                    closeOnSelect
                    initialMultiselectItemsList={genderOptions}
                    initialItemsList={genderOptions}
                    onSelectedItemsChange={(value) =>
                        patchFeatures({
                            contentCreation: {
                                ...features.contentCreation,
                                genderPreference: value,
                            },
                        })
                    }
                    selectedItems={features.contentCreation.genderPreference || []}
                    theme={theme}
                />
                {calculatedInfluencerBudget > 0 && (
                    <View style={styles.calcBudgetBox}>
                        <Text style={styles.calcBudgetLabel}>
                            Estimated Influencer Budget
                        </Text>
                        <Text style={styles.calcBudgetValue}>
                            {fmt(calculatedInfluencerBudget)} / month
                        </Text>
                        <Text style={styles.calcBudgetNote}>
                            Based on your follower range &amp; reach requirements ×{" "}
                            {monthlyPosts} posts. Our fee: {fmt(Math.round(calculatedInfluencerBudget * 0.15))}.
                        </Text>
                    </View>
                )}
            </FeatureRow>

            <FeatureRow
                title="Strategic Ad Spend & Running Ads"
                description="We manage your ad campaigns. Enter your total ad budget — 10% goes to Trendly as the management fee, 90% runs directly as ads."
                enabled={features.adSpend.enabled}
                onToggle={(v) =>
                    patchFeatures({ adSpend: { ...features.adSpend, enabled: v } })
                }
                colors={colors}
            >
                <TextInput
                    label="Total Ad Spend Budget (₹)"
                    mode="outlined"
                    keyboardType="number-pad"
                    value={
                        features.adSpend.totalAdSpend
                            ? features.adSpend.totalAdSpend.toString()
                            : ""
                    }
                    onChangeText={(text) =>
                        patchFeatures({
                            adSpend: {
                                ...features.adSpend,
                                totalAdSpend: parseInt(text) || 0,
                            },
                        })
                    }
                />
                {(features.adSpend.totalAdSpend ?? 0) > 0 && (
                    <View style={styles.adBreakdownBox}>
                        <Text style={styles.adBreakdownText}>
                            Trendly management:{" "}
                            {fmt(Math.round((features.adSpend.totalAdSpend ?? 0) * 0.1))}
                            {"  ·  "}
                            Actual ad spend:{" "}
                            {fmt(Math.round((features.adSpend.totalAdSpend ?? 0) * 0.9))}
                        </Text>
                    </View>
                )}
            </FeatureRow>

            <FeatureRow
                title="Performance Marketing + Multi-Platform Ads"
                description="Full-funnel: Google, Meta, YouTube, LinkedIn, blog ads, remarketing, and conversion-optimised campaigns. We add ₹35,000/month for this service."
                enabled={features.performanceMarketing.enabled}
                onToggle={(v) =>
                    patchFeatures({
                        performanceMarketing: {
                            ...features.performanceMarketing,
                            enabled: v,
                        },
                    })
                }
                disabled={isDisabled(FEATURE_MIN_BUDGETS.performanceMarketing)}
                disabledReason={`Requires budget ≥ ${fmt(FEATURE_MIN_BUDGETS.performanceMarketing)}`}
                colors={colors}
            >
                <TextInput
                    label="Average Sale Value of Your Product (₹)"
                    mode="outlined"
                    keyboardType="number-pad"
                    value={
                        features.performanceMarketing.avgSaleValue
                            ? features.performanceMarketing.avgSaleValue.toString()
                            : ""
                    }
                    onChangeText={(text) =>
                        patchFeatures({
                            performanceMarketing: {
                                ...features.performanceMarketing,
                                avgSaleValue: parseInt(text) || 0,
                            },
                        })
                    }
                />
            </FeatureRow>
        </View>
    );

    if (xl) {
        return (
            <View style={styles.rootXL}>
                {/* Header — matches StepLayout structure */}
                <View style={styles.xlHeader}>
                    <Pressable onPress={onBack} style={styles.xlBackButton} hitSlop={8}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
                    </Pressable>
                    <View style={styles.xlHeaderText}>
                        <Text style={styles.xlTitle}>Features & Budget</Text>
                        <Text style={styles.xlSubtitle}>Select services — budget updates live</Text>
                    </View>
                </View>
                <View style={styles.xlProgressRow}>
                    {[1, 2, 3].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.xlProgressSeg,
                                { backgroundColor: 2 > i ? colors.primary : colors.aliceBlue },
                            ]}
                        />
                    ))}
                </View>
                <Text style={styles.xlStepLabel}>Step 2 of 3</Text>

                <View style={styles.splitRow}>
                    <ScrollView
                        style={styles.leftCol}
                        contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {FeaturesPanel}
                    </ScrollView>
                    <View style={styles.rightCol}>
                        <BudgetPanel
                            breakdown={breakdown}
                            roi={roi}
                            isFixed={isFixed}
                            isRetainer={isRetainer}
                            declaredBudget={isFixed ? hire.totalBudget : undefined}
                            colors={colors}
                        />
                    </View>
                </View>

                <View style={styles.xlButtons}>
                    <Button mode="outlined" onPress={onBack} style={styles.backBtn}>
                        Back
                    </Button>
                    <Button mode="contained" onPress={onNext} style={styles.nextBtn}>
                        Review Request
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <StepLayout
            step={2}
            title="Features & Budget"
            subtitle="Select services — budget updates live"
            onBack={onBack}
        >
            {FeaturesPanel}

            <BudgetPanel
                breakdown={breakdown}
                roi={roi}
                isFixed={isFixed}
                isRetainer={isRetainer}
                colors={colors}
            />

            <View style={styles.buttons}>
                <Button mode="outlined" onPress={onBack} style={styles.backBtn}>
                    Back
                </Button>
                <Button mode="contained" onPress={onNext} style={styles.nextBtn}>
                    Review Request
                </Button>
            </View>
        </StepLayout>
    );
};

export default StepFour;

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean, width: number) =>
    StyleSheet.create({
        featuresList: {
            gap: 12,
            backgroundColor: "transparent",
        },
        freqRow: {
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            backgroundColor: "transparent",
        },
        freqCountInput: {
            width: 100,
        },
        freqPills: {
            flexDirection: "row",
            gap: 8,
            backgroundColor: "transparent",
        },
        subRow: {
            flexDirection: "row",
            gap: 10,
            backgroundColor: "transparent",
        },
        halfInput: { flex: 1 },
        calcBudgetBox: {
            backgroundColor: colors.budgetCardBg,
            borderRadius: 10,
            padding: 12,
            gap: 2,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.1,
            elevation: 2,
        },
        calcBudgetLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.6,
        },
        calcBudgetValue: {
            fontSize: 17,
            fontWeight: "800",
            color: colors.primary,
        },
        calcBudgetNote: {
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 16,
            marginTop: 2,
        },
        adBreakdownBox: {
            backgroundColor: colors.aliceBlue,
            borderRadius: 8,
            padding: 10,
        },
        adBreakdownText: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        buttons: {
            flexDirection: "row",
            gap: 12,
            backgroundColor: "transparent",
        },
        backBtn: { flex: 1 },
        nextBtn: { flex: 2 },
        rootXL: {
            flex: 1,
            backgroundColor: colors.background,
        },
        xlHeader: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8,
            backgroundColor: colors.background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        xlBackButton: {
            padding: 8,
            marginRight: 8,
        },
        xlHeaderText: {
            flex: 1,
            backgroundColor: "transparent",
        },
        xlTitle: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
        },
        xlSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        xlProgressRow: {
            flexDirection: "row",
            paddingHorizontal: 24,
            gap: 6,
            backgroundColor: "transparent",
        },
        xlProgressSeg: {
            flex: 1,
            height: 4,
            borderRadius: 2,
        },
        xlStepLabel: {
            fontSize: 11,
            color: colors.textSecondary,
            paddingHorizontal: 24,
            paddingTop: 6,
            paddingBottom: 2,
        },
        splitRow: {
            flex: 1,
            flexDirection: "row",
            backgroundColor: "transparent",
        },
        leftCol: {
            flex: 3,
            paddingHorizontal: 24,
        },
        rightCol: {
            width: 320,
            paddingHorizontal: 20,
            paddingTop: 16,
        },
        xlButtons: {
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: colors.background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 8,
            shadowOpacity: 0.05,
            elevation: 4,
        },
    });
