import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useBreakpoints } from "@/hooks";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import {
    CampaignFeatures,
    FEATURE_COSTS,
    FEATURE_MIN_BUDGETS,
    ICampaign,
} from "@/types/Campaign";
import { INFLUENCER_CATEGORIES } from "@/constants/ItemsList";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Switch } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";
const fmt = (n: number) =>
    CURRENCY + n.toLocaleString("en-IN");

function calcBudget(campaign: Partial<ICampaign>): number {
    if (campaign.budgetType === "fixed") return campaign.totalBudget ?? 0;

    const freq = campaign.contentFrequency ?? { count: 4, period: "month" };
    const monthlyPosts =
        freq.period === "week" ? freq.count * 4 : freq.count;
    const f = campaign.features!;
    let cost = 0;

    if (f.conversionAudit) cost += FEATURE_COSTS.conversionAudit;
    if (f.contentStrategy) {
        cost +=
            monthlyPosts <= 8
                ? FEATURE_COSTS.contentStrategyPerPost.low
                : monthlyPosts <= 20
                ? FEATURE_COSTS.contentStrategyPerPost.mid
                : FEATURE_COSTS.contentStrategyPerPost.high;
    }
    if (f.contentCreation.enabled && f.contentCreation.influencerBudget) {
        cost += f.contentCreation.influencerBudget * FEATURE_COSTS.contentCreationPct;
    }
    if (f.adSpend.enabled && f.adSpend.totalAdSpend) {
        cost += f.adSpend.totalAdSpend * FEATURE_COSTS.adSpendPct;
    }
    if (f.performanceMarketing.enabled) {
        cost += FEATURE_COSTS.performanceMarketing;
    }
    return Math.round(cost);
}

function calcROI(campaign: Partial<ICampaign>) {
    const f = campaign.features!;
    const freq = campaign.contentFrequency ?? { count: 4, period: "month" };
    const monthlyPosts =
        freq.period === "week" ? freq.count * 4 : freq.count;

    let organicReach: number | undefined;
    let clickThrough: number | undefined;
    let conversions: number | undefined;

    if (f.contentCreation.enabled) {
        const minReach = f.contentCreation.minReach ?? 5000;
        organicReach = minReach * monthlyPosts;
    }
    if (f.adSpend.enabled && f.adSpend.totalAdSpend) {
        clickThrough = Math.floor(f.adSpend.totalAdSpend / 15);
    }
    if (f.performanceMarketing.enabled && clickThrough) {
        conversions = Math.floor(clickThrough * 0.02);
    }
    return { organicReach, clickThrough, conversions };
}

interface FeatureRowProps {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    disabled?: boolean;
    disabledReason?: string;
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
    children,
    colors,
}) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    borderWidth: 1,
                    borderRadius: 14,
                    borderColor: enabled && !disabled ? colors.primary : colors.border,
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
                subfields: {
                    marginTop: 4,
                    gap: 10,
                    backgroundColor: "transparent",
                },
            }),
        [enabled, disabled, colors]
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
                </View>
                <Switch
                    value={enabled && !disabled}
                    onValueChange={(v) => !disabled && onToggle(v)}
                    trackColor={{ true: colors.primary }}
                    disabled={disabled}
                />
            </View>
            {enabled && !disabled && children ? (
                <View style={styles.subfields}>{children}</View>
            ) : null}
        </View>
    );
};

interface BudgetPanelProps {
    budget: number;
    roi: ReturnType<typeof calcROI>;
    campaign: Partial<ICampaign>;
    colors: ReturnType<typeof Colors>;
}

const BudgetPanel: React.FC<BudgetPanelProps> = ({ budget, roi, campaign, colors }) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                panel: {
                    gap: 16,
                    backgroundColor: "transparent",
                },
                budgetCard: {
                    backgroundColor: colors.budgetCardBg,
                    borderWidth: 1,
                    borderColor: colors.budgetCardBorder,
                    borderRadius: 16,
                    padding: 20,
                    gap: 6,
                },
                budgetLabel: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                budgetAmount: {
                    fontSize: 28,
                    fontWeight: "800",
                    color: colors.primary,
                },
                budgetSub: {
                    fontSize: 12,
                    color: colors.textSecondary,
                },
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
            }),
        [colors]
    );

    const hasROI = roi.organicReach || roi.clickThrough || roi.conversions;

    return (
        <View style={styles.panel}>
            <View style={styles.budgetCard}>
                <Text style={styles.budgetLabel}>
                    {campaign.budgetType === "fixed"
                        ? "Your Total Budget"
                        : "Estimated Monthly Cost"}
                </Text>
                <Text style={styles.budgetAmount}>{fmt(budget)}</Text>
                <Text style={styles.budgetSub}>
                    {campaign.budgetType === "fixed"
                        ? "Select features to see what fits in your budget"
                        : "Based on features selected"}
                </Text>
            </View>

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
                    </>
                ) : (
                    <Text style={styles.roiEmpty}>
                        Enable content creation, ad spend or performance marketing to see
                        estimated returns.
                    </Text>
                )}
            </View>
        </View>
    );
};

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
    const budget = calcBudget(campaign);
    const roi = calcROI(campaign);
    const isFixed = campaign.budgetType === "fixed";

    const patchFeatures = useCallback(
        (patch: Partial<CampaignFeatures>) =>
            setCampaign((prev) => ({
                ...prev,
                features: { ...prev.features!, ...patch },
                estimatedBudget: calcBudget({
                    ...prev,
                    features: { ...prev.features!, ...patch },
                }),
                estimatedROI: calcROI({
                    ...prev,
                    features: { ...prev.features!, ...patch },
                }),
            })),
        [setCampaign]
    );

    const isDisabled = (minBudget: number) =>
        isFixed && budget < minBudget;

    const genderOptions = ["Male", "Female", "Non-binary"];

    const FeaturesPanel = (
        <View style={styles.featuresList}>
            {/* Conversion Audit */}
            <FeatureRow
                title="Conversion Audit"
                description="End-to-end audit of your IG page aesthetic, website load speed, and remarketing setup to identify drop-off points."
                enabled={features.conversionAudit}
                onToggle={(v) => patchFeatures({ conversionAudit: v })}
                disabled={isDisabled(FEATURE_MIN_BUDGETS.conversionAudit)}
                disabledReason={`Requires budget ≥ ${fmt(FEATURE_MIN_BUDGETS.conversionAudit)}`}
                colors={colors}
            />

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
                description="We shortlist and coordinate with influencers/creators to deliver content. Our fee is 15% of your influencer budget."
                enabled={features.contentCreation.enabled}
                onToggle={(v) =>
                    patchFeatures({
                        contentCreation: { ...features.contentCreation, enabled: v },
                    })
                }
                colors={colors}
            >
                <TextInput
                    label="Total Influencer Budget (₹)"
                    mode="outlined"
                    keyboardType="number-pad"
                    value={
                        features.contentCreation.influencerBudget
                            ? features.contentCreation.influencerBudget.toString()
                            : ""
                    }
                    onChangeText={(text) =>
                        patchFeatures({
                            contentCreation: {
                                ...features.contentCreation,
                                influencerBudget: parseInt(text) || 0,
                            },
                        })
                    }
                />
                <View style={styles.subRow}>
                    <TextInput
                        label="Min Followers (e.g. 10000)"
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
                                        features.contentCreation.influencerFollowerRange?.[1] ?? 100000,
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
                                        parseInt(text) || 100000,
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
                    buttonLabel="Add Gender"
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
            </FeatureRow>

            {/* Ad Spend */}
            <FeatureRow
                title="Strategic Ad Spend & Running Ads"
                description="We manage your ad campaigns with 10% of your ad spend as our service fee."
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
            </FeatureRow>

            {/* Performance Marketing */}
            <FeatureRow
                title="Performance Marketing + Multi-Platform Ads"
                description="Full-funnel: Google, Meta, YouTube, LinkedIn, blog ads, remarketing, and conversion-optimised campaigns. We add ₹35,000/month for this service."
                enabled={features.performanceMarketing.enabled}
                onToggle={(v) =>
                    patchFeatures({
                        performanceMarketing: { ...features.performanceMarketing, enabled: v },
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
                {/* Header row */}
                <View style={styles.xlHeader}>
                    <Text style={styles.xlStepLabel}>Step 4 of 5</Text>
                    <View style={styles.xlProgressRow}>
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.xlProgressSeg,
                                    { backgroundColor: 4 > i ? colors.primary : colors.aliceBlue },
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.xlTitle}>Features & Budget</Text>
                    <Text style={styles.xlSubtitle}>
                        Select the services you need. Budget updates in real-time.
                    </Text>
                </View>

                {/* Split columns */}
                <View style={styles.splitRow}>
                    <ScrollView
                        style={styles.leftCol}
                        contentContainerStyle={{ gap: 14, paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {FeaturesPanel}
                    </ScrollView>
                    <View style={styles.rightCol}>
                        <BudgetPanel budget={budget} roi={roi} campaign={campaign} colors={colors} />
                    </View>
                </View>

                {/* Bottom buttons */}
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
            subtitle="Select services and see your budget"
            onBack={onBack}
        >
            {FeaturesPanel}

            <BudgetPanel budget={budget} roi={roi} campaign={campaign} colors={colors} />

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
        subRow: {
            flexDirection: "row",
            gap: 10,
            backgroundColor: "transparent",
        },
        halfInput: { flex: 1 },
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
