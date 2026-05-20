import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { INFLUENCER_CATEGORIES } from "@/constants/ItemsList";
import { useBreakpoints } from "@/hooks";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import {
    CampaignFeatures,
    ContentFrequency,
    ContentFrequencyPeriod,
    FEATURE_COSTS,
    FEATURE_MIN_BUDGETS,
    ICampaign,
} from "@/types/Campaign";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Switch } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";
const fmt = (n: number) => CURRENCY + n.toLocaleString("en-IN");

// ─── Influencer budget calculator ────────────────────────────────────────────
// Template logic: rate per post derived from avg follower count + reach premium.
// User can refine this later by adjusting inputs.
function calcInfluencerBudgetFromInputs(
    followerRange: [number, number] | undefined,
    minReach: number | undefined,
    monthlyPosts: number
): number {
    if (!followerRange || !monthlyPosts) return 0;
    const [minF, maxF] = followerRange;
    const avgFollowers = (minF + maxF) / 2;
    if (avgFollowers === 0) return 0;

    // Base rate per post by follower tier
    let ratePerPost: number;
    if (avgFollowers < 10_000) ratePerPost = 1_500;
    else if (avgFollowers < 50_000) ratePerPost = 5_000;
    else if (avgFollowers < 100_000) ratePerPost = 12_000;
    else if (avgFollowers < 500_000) ratePerPost = 35_000;
    else ratePerPost = 80_000;

    // Reach premium: higher-than-usual reach expectations bump the rate
    if (minReach) {
        const reachRatio = minReach / avgFollowers;
        if (reachRatio > 0.3) ratePerPost = Math.round(ratePerPost * 1.5);
        else if (reachRatio > 0.15) ratePerPost = Math.round(ratePerPost * 1.2);
    }

    return Math.round(ratePerPost * monthlyPosts);
}

// ─── Budget breakdown ─────────────────────────────────────────────────────────
interface BudgetBreakdown {
    trendlyFee: number;        // What Trendly charges
    influencerBudget: number;  // Goes directly to influencers
    adBudget: number;          // Goes directly to ad platforms
    totalSpend: number;        // Grand total
}

function calcBreakdown(campaign: Partial<ICampaign>): BudgetBreakdown {
    const freq = campaign.contentFrequency ?? { count: 4, period: "month" };
    const monthlyPosts = freq.period === "week" ? freq.count * 4 : freq.count;
    const f = campaign.features!;
    const isRetainer = campaign.campaignType === "retainer";
    const isFixed = campaign.budgetType === "fixed";

    let trendlyFee = 0;
    const influencerBudget = f.contentCreation.enabled
        ? (f.contentCreation.influencerBudget ?? 0)
        : 0;
    const adBudget = f.adSpend.enabled ? (f.adSpend.totalAdSpend ?? 0) : 0;

    // Audit: free for retainer clients
    if (f.conversionAudit && !isRetainer) {
        trendlyFee += FEATURE_COSTS.conversionAudit;
    }

    if (f.contentStrategy) {
        trendlyFee +=
            monthlyPosts <= 8
                ? FEATURE_COSTS.contentStrategyPerPost.low
                : monthlyPosts <= 20
                    ? FEATURE_COSTS.contentStrategyPerPost.mid
                    : FEATURE_COSTS.contentStrategyPerPost.high;
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

function calcBudget(campaign: Partial<ICampaign>): number {
    return calcBreakdown(campaign).trendlyFee;
}

// ─── Auto-suggest features for fixed-budget campaigns ────────────────────────
// Budget tiers decide which features to enable and what influencer tier to target.
// The goal is for totalSpend ≈ declaredBudget; user can adjust after.
function autoSuggestFeatures(
    totalBudget: number,
    monthlyPosts: number,
    isRetainer: boolean
): CampaignFeatures {
    const posts = Math.max(monthlyPosts, 1);

    // Tier 1: < ₹25k — content creation only, nano influencers
    if (totalBudget < 25_000) {
        const range: [number, number] = [1_000, 10_000];
        return {
            conversionAudit: isRetainer,
            contentStrategy: false,
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

    // Tier 2: ₹25k–₹60k — content creation + strategy, micro influencers
    if (totalBudget < 60_000) {
        const range: [number, number] = [5_000, 30_000];
        return {
            conversionAudit: isRetainer,
            contentStrategy: true,
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

    // Tier 3: ₹60k–₹1.2L — content + strategy + audit, mid-tier influencers
    if (totalBudget < 120_000) {
        const range: [number, number] = [10_000, 50_000];
        return {
            conversionAudit: true,
            contentStrategy: true,
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

    // Tier 4: ₹1.2L–₹2.5L — all above + ad spend (~25% of budget), established influencers
    if (totalBudget < 250_000) {
        const range: [number, number] = [20_000, 100_000];
        const adSpend = Math.round(totalBudget * 0.25);
        return {
            conversionAudit: true,
            contentStrategy: true,
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

    // Tier 5: ₹2.5L+ — all features, macro influencers, ~30% to ads
    const range: [number, number] = [50_000, 300_000];
    const adSpend = Math.round(totalBudget * 0.3);
    return {
        conversionAudit: true,
        contentStrategy: true,
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

function calcROI(campaign: Partial<ICampaign>) {
    const f = campaign.features!;
    const freq = campaign.contentFrequency ?? { count: 4, period: "month" };
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
        const { totalSpend } = calcBreakdown(campaign);
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
    const styles = useMemo(
        () =>
            StyleSheet.create({
                pill: {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.budgetCardBg : colors.card,
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
        <Pressable onPress={onPress} style={styles.pill}>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
};

// ─── FeatureRow ───────────────────────────────────────────────────────────────
interface FeatureRowProps {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    /** Greyed out — budget too low */
    disabled?: boolean;
    disabledReason?: string;
    /** Forced on and non-interactive (e.g. retainer freebie) */
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

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    borderWidth: 1,
                    borderRadius: 14,
                    borderColor: isOn ? colors.primary : colors.border,
                    backgroundColor: disabled ? colors.aliceBlue : colors.card,
                    padding: 16,
                    gap: 8,
                    opacity: disabled ? 0.55 : 1,
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
                    borderWidth: 1,
                    borderColor: colors.reachCardBorder,
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
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.desc}>{description}</Text>
                    {disabled && disabledReason ? (
                        <Text style={styles.disabledHint}>{disabledReason}</Text>
                    ) : null}
                    {lockedEnabled && lockedBadge ? (
                        <View style={styles.lockedBadgeView}>
                            <Text style={styles.lockedBadgeText}>{lockedBadge}</Text>
                        </View>
                    ) : null}
                </View>
                {lockedEnabled ? (
                    // Non-interactive locked switch
                    <Switch value={true} disabled trackColor={{ true: colors.green }} />
                ) : (
                    <Switch
                        value={isOn}
                        onValueChange={(v) => !disabled && onToggle(v)}
                        trackColor={{ true: colors.primary }}
                        disabled={disabled}
                    />
                )}
            </View>
            {isOn && children ? (
                <View style={styles.subfields}>{children}</View>
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
    const styles = useMemo(
        () =>
            StyleSheet.create({
                panel: {
                    gap: 16,
                    backgroundColor: "transparent",
                },
                // Trendly fee card
                trendlyCard: {
                    backgroundColor: colors.budgetCardBg,
                    borderWidth: 1,
                    borderColor: colors.budgetCardBorder,
                    borderRadius: 16,
                    padding: 20,
                    gap: 4,
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
                // Direct spend rows
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
                // Total card
                totalCard: {
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 14,
                    padding: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: colors.card,
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
                    backgroundColor: colors.border,
                },
                // ROI card
                roiCard: {
                    backgroundColor: colors.reachCardBg,
                    borderWidth: 1,
                    borderColor: colors.reachCardBorder,
                    borderRadius: 16,
                    padding: 20,
                    gap: 12,
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
                    borderWidth: 1,
                    borderColor: colors.errorBannerBorder,
                    borderRadius: 10,
                    padding: 10,
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
        <View style={styles.panel}>
            {/* Declared budget reference for fixed-budget campaigns */}
            {isFixed && declaredBudget ? (
                <View style={styles.declaredRef}>
                    <Text style={styles.declaredRefLabel}>Your budget target</Text>
                    <Text style={styles.declaredRefValue}>{fmt(declaredBudget)}</Text>
                </View>
            ) : null}

            {/* Trendly's estimate */}
            <View style={styles.trendlyCard}>
                <Text style={styles.trendlyLabel}>Trendly's Cost</Text>
                <Text style={styles.trendlyAmount}>{fmt(trendlyFee)}</Text>
                <Text style={styles.trendlySub}>
                    Our management fee for selected services
                    {isRetainer ? " · per month" : " · one-off"}
                </Text>
            </View>

            {/* Direct spend breakdown — shown in small text below */}
            {hasDirectSpend && (
                <>
                    <View style={styles.directSection}>
                        {influencerBudget > 0 && (
                            <View style={styles.directRow}>
                                <Text style={styles.directLabel}>
                                    → Towards Influencers
                                </Text>
                                <Text style={styles.directValue}>
                                    {fmt(influencerBudget)}
                                </Text>
                            </View>
                        )}
                        {adBudget > 0 && (
                            <View style={styles.directRow}>
                                <Text style={styles.directLabel}>
                                    → Towards Ads
                                </Text>
                                <Text style={styles.directValue}>
                                    {fmt(adBudget)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Total marketing spend */}
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total Marketing Spend</Text>
                        <Text style={styles.totalAmount}>{fmt(totalSpend)}</Text>
                    </View>
                </>
            )}

            {isOverBudget && (
                <View style={styles.overBudgetBox}>
                    <Text style={styles.overBudgetText}>
                        ⚠️ Your selected services total {fmt(totalSpend)}, which exceeds your declared budget of {fmt(declaredBudget!)}. You can adjust the features or increase your budget in the previous step.
                    </Text>
                </View>
            )}

            {/* ROI card */}
            <View style={styles.roiCard}>
                <Text style={styles.roiTitle}>Approx. Monthly ROI</Text>
                {hasROI ? (
                    <>
                        {roi.organicReach ? (
                            <View style={styles.roiRow}>
                                <Text style={styles.roiMetric}>
                                    Organic Reach & Interactions
                                </Text>
                                <Text style={styles.roiValue}>
                                    {roi.organicReach.toLocaleString("en-IN")}+
                                </Text>
                            </View>
                        ) : null}
                        {roi.clickThrough ? (
                            <View style={styles.roiRow}>
                                <Text style={styles.roiMetric}>
                                    Ad Click-throughs / Profile Visits
                                </Text>
                                <Text style={styles.roiValue}>
                                    ~{roi.clickThrough.toLocaleString("en-IN")}
                                </Text>
                            </View>
                        ) : null}
                        {roi.conversions ? (
                            <View style={styles.roiRow}>
                                <Text style={styles.roiMetric}>
                                    Guaranteed Conversions / Sales
                                </Text>
                                <Text style={styles.roiValue}>
                                    ~{roi.conversions.toLocaleString("en-IN")}
                                </Text>
                            </View>
                        ) : null}
                        {roi.roas ? (
                            <View style={styles.roiRow}>
                                <Text style={styles.roiMetric}>
                                    Return on Ad Spend (ROAS)
                                </Text>
                                <Text style={[styles.roiValue, styles.roasValue]}>
                                    {fmtROAS(roi.roas)}
                                </Text>
                            </View>
                        ) : null}
                    </>
                ) : (
                    <Text style={styles.roiEmpty}>
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
    campaign: Partial<ICampaign>;
    setCampaign: React.Dispatch<React.SetStateAction<Partial<ICampaign>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepFour: React.FC<StepFourProps> = ({
    campaign,
    setCampaign,
    onNext,
    onBack,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const features = campaign.features!;
    const isRetainer = campaign.campaignType === "retainer";
    const isFixed = campaign.budgetType === "fixed";
    const breakdown = calcBreakdown(campaign);
    const roi = calcROI(campaign);

    const monthlyPosts = useMemo(() => {
        const freq = campaign.contentFrequency ?? { count: 4, period: "month" };
        return freq.period === "week" ? freq.count * 4 : freq.count;
    }, [campaign.contentFrequency]);

    // Auto-enable conversion audit for retainer clients (free perk)
    useEffect(() => {
        if (isRetainer && !features.conversionAudit) {
            setCampaign((prev) => ({
                ...prev,
                features: { ...prev.features!, conversionAudit: true },
            }));
        }
    }, [isRetainer]);

    // Auto-suggest a feature mix for fixed-budget campaigns on first entry
    const autoSuggestDone = useRef(false);
    useEffect(() => {
        if (!isFixed || autoSuggestDone.current) return;
        if (!campaign.totalBudget || campaign.totalBudget <= 0) return;
        autoSuggestDone.current = true;
        const suggested = autoSuggestFeatures(campaign.totalBudget, monthlyPosts, isRetainer);
        setCampaign((prev) => {
            const updated = { ...prev, features: suggested };
            const bd = calcBreakdown(updated);
            return { ...updated, estimatedBudget: bd.trendlyFee, estimatedROI: calcROI(updated) };
        });
    }, [isFixed, campaign.totalBudget, monthlyPosts]);

    const patchFeatures = useCallback(
        (patch: Partial<CampaignFeatures>) =>
            setCampaign((prev) => {
                const newFeatures = { ...prev.features!, ...patch };

                // Recalculate influencer budget whenever content creation inputs change
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
        [setCampaign, monthlyPosts]
    );

    const setFreq = useCallback(
        (patch: Partial<ContentFrequency>) =>
            setCampaign((prev) => {
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
        [setCampaign]
    );

    const isDisabled = (minBudget: number) =>
        isFixed && ((campaign.totalBudget ?? 10000) < minBudget);

    const genderOptions = ["Male", "Female", "Non-binary"];

    const calculatedInfluencerBudget = features.contentCreation.enabled
        ? (features.contentCreation.influencerBudget ?? 0)
        : 0;

    const FeaturesPanel = (
        <View style={styles.featuresList}>
            {/* Content Strategy */}
            <FeatureRow
                title="Content Strategy Creation"
                description="A tailored content calendar and strategy aligned to your brand voice and campaign goals. Cost varies from ₹15k–50k based on monthly content volume."
                enabled={features.contentStrategy}
                onToggle={(v) => patchFeatures({ contentStrategy: v })}
                disabled={isDisabled(FEATURE_MIN_BUDGETS.contentStrategy)}
                disabledReason={`Requires budget ≥ ${fmt(FEATURE_MIN_BUDGETS.contentStrategy)}`}
                colors={colors}
            />

            {/* Content Creation */}
            <FeatureRow
                title="Content Creation End-to-End"
                description={`We shortlist and coordinate with influencers to deliver content. Our fee is 15% of the influencer budget — we calculate the budget from your follower and reach requirements. Total content target: ${monthlyPosts} posts/month.`}
                enabled={features.contentCreation.enabled}
                onToggle={(v) =>
                    patchFeatures({
                        contentCreation: { ...features.contentCreation, enabled: v },
                    })
                }
                colors={colors}
            >
                {/* Content frequency — how many posts/month */}
                <View style={styles.freqRow}>
                    <TextInput
                        label="Posts count"
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.freqCountInput}
                        value={
                            (campaign.contentFrequency?.count ?? 0) > 0
                                ? campaign.contentFrequency!.count.toString()
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
                                (campaign.contentFrequency?.period ?? "month") === "week"
                            }
                            onPress={() =>
                                setFreq({ period: "week" as ContentFrequencyPeriod })
                            }
                            colors={colors}
                        />
                        <PeriodPill
                            label="/ month"
                            selected={
                                (campaign.contentFrequency?.period ?? "month") === "month"
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
                {/* Calculated influencer budget display */}
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

            {/* Ad Spend */}
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

            {/* Conversion Audit */}
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

            {/* Performance Marketing */}
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
                <View style={styles.xlHeader}>
                    <Text style={styles.xlStepLabel}>Step 4 of 5</Text>
                    <View style={styles.xlProgressRow}>
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.xlProgressSeg,
                                    {
                                        backgroundColor:
                                            4 > i ? colors.primary : colors.aliceBlue,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.xlTitle}>Features & Budget</Text>
                    <Text style={styles.xlSubtitle}>
                        Select services. Budget and totals update in real-time.
                    </Text>
                </View>

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
                            declaredBudget={isFixed ? campaign.totalBudget : undefined}
                            colors={colors}
                        />
                    </View>
                </View>

                <View style={styles.xlButtons}>
                    <Button mode="outlined" onPress={onBack} style={styles.backBtn}>
                        Back
                    </Button>
                    <Button mode="contained" onPress={onNext} style={styles.nextBtn}>
                        Review Campaign
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <StepLayout
            step={4}
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
                    Review Campaign
                </Button>
            </View>
        </StepLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
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
            borderWidth: 1,
            borderColor: colors.budgetCardBorder,
            borderRadius: 10,
            padding: 12,
            gap: 2,
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
        // XL layout
        rootXL: {
            flex: 1,
            backgroundColor: colors.background,
        },
        xlHeader: {
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 12,
            gap: 6,
            backgroundColor: "transparent",
        },
        xlStepLabel: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        xlProgressRow: {
            flexDirection: "row",
            gap: 6,
            backgroundColor: "transparent",
        },
        xlProgressSeg: {
            flex: 1,
            height: 4,
            borderRadius: 2,
        },
        xlTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
            marginTop: 4,
        },
        xlSubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
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
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
        },
    });

export default StepFour;
