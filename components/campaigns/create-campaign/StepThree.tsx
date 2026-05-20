import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useBreakpoints } from "@/hooks";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    BudgetType,
    ContentFrequencyPeriod,
    ICampaign,
} from "@/types/Campaign";
import { faIndianRupeeSign, faListCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";

// Budget required per post: rough estimate used for warning
const BUDGET_PER_POST = 8000;

interface BudgetTypeCardProps {
    icon: any;
    title: string;
    description: string;
    badge?: string;
    selected: boolean;
    onSelect: () => void;
    colors: ReturnType<typeof Colors>;
}

const BudgetTypeCard: React.FC<BudgetTypeCardProps> = ({
    icon,
    title,
    description,
    badge,
    selected,
    onSelect,
    colors,
}) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    borderWidth: 2,
                    borderRadius: 16,
                    padding: 20,
                    gap: 12,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.budgetCardBg : colors.card,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: "transparent",
                },
                iconWrap: {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? colors.primary : colors.aliceBlue,
                },
                title: {
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.text,
                    flex: 1,
                },
                description: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 21,
                },
                badge: {
                    alignSelf: "flex-start",
                    backgroundColor: colors.reachCardBg,
                    borderWidth: 1,
                    borderColor: colors.reachCardBorder,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                },
                badgeText: {
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.green,
                },
            }),
        [selected, colors]
    );

    return (
        <Pressable onPress={onSelect} style={styles.card}>
            <View style={styles.row}>
                <View style={styles.iconWrap}>
                    <FontAwesomeIcon
                        icon={icon}
                        size={22}
                        color={selected ? colors.white : colors.primary}
                    />
                </View>
                <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.description}>{description}</Text>
            {badge ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            ) : null}
        </Pressable>
    );
};

interface FreqPillProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    colors: ReturnType<typeof Colors>;
}

const FreqPill: React.FC<FreqPillProps> = ({ label, selected, onPress, colors }) => {
    const styles = useMemo(
        () =>
            StyleSheet.create({
                pill: {
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.budgetCardBg : colors.card,
                },
                label: {
                    fontSize: 14,
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

interface StepThreeProps {
    campaign: Partial<ICampaign>;
    setCampaign: React.Dispatch<React.SetStateAction<Partial<ICampaign>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepThree: React.FC<StepThreeProps> = ({
    campaign,
    setCampaign,
    onNext,
    onBack,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const freq = campaign.contentFrequency ?? { count: 4, period: "month" as ContentFrequencyPeriod };

    const monthlyPosts =
        freq.period === "week" ? freq.count * 4 : freq.count;
    const budgetRequired = monthlyPosts * BUDGET_PER_POST;
    const showBudgetWarning =
        campaign.budgetType === "fixed" &&
        (campaign.totalBudget ?? 0) > 0 &&
        (campaign.totalBudget ?? 0) < budgetRequired;

    const setBudgetType = (type: BudgetType) =>
        setCampaign((prev) => ({ ...prev, budgetType: type }));

    const setFreqPeriod = (period: ContentFrequencyPeriod) =>
        setCampaign((prev) => ({
            ...prev,
            contentFrequency: { ...freq, period },
        }));

    const handleNext = () => {
        if (campaign.budgetType === "fixed" && !(campaign.totalBudget ?? 0)) {
            Toaster.error("Please enter your marketing budget");
            return;
        }
        if (!freq.count) {
            Toaster.error("Please specify content frequency");
            return;
        }
        onNext();
    };

    return (
        <StepLayout
            step={3}
            title="Budget & Frequency"
            subtitle="How would you like to define your marketing spend?"
            onBack={onBack}
        >
            {/* Budget type cards */}
            <View style={styles.section}>
                <View style={styles.options}>
                    <BudgetTypeCard
                        icon={faListCheck}
                        title="Fixed Requirement"
                        description="You tell us exactly what you need — influencer count, ad spend, services — and we instantly generate a transparent quotation for you. Best for brands that have done marketing before and want full control over the deliverables."
                        badge="✦ Recommended — instant quotation"
                        selected={campaign.budgetType === "needs-based"}
                        onSelect={() => setBudgetType("needs-based")}
                        colors={colors}
                    />
                    <BudgetTypeCard
                        icon={faIndianRupeeSign}
                        title="Fixed Budget"
                        description="You're working with a limited spend and want to make the most of it. Tell us your total budget and we'll propose the best plan we can deliver within that cap. Ideal for startups and brands just starting out with influencer marketing."
                        selected={campaign.budgetType === "fixed"}
                        onSelect={() => setBudgetType("fixed")}
                        colors={colors}
                    />
                </View>
            </View>

            {/* Fixed budget amount */}
            {campaign.budgetType === "fixed" && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Total Marketing Budget ({CURRENCY})
                    </Text>
                    <TextInput
                        label={`Budget in INR (e.g. 50000)`}
                        mode="outlined"
                        keyboardType="number-pad"
                        value={
                            campaign.totalBudget
                                ? campaign.totalBudget.toString()
                                : ""
                        }
                        onChangeText={(text) =>
                            setCampaign((prev) => ({
                                ...prev,
                                totalBudget: parseInt(text) || 0,
                            }))
                        }
                    />
                </View>
            )}

            {/* Content frequency */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Content Frequency</Text>
                <Text style={styles.sectionHint}>
                    How many posts do you want published?
                </Text>
                <View style={styles.freqRow}>
                    <TextInput
                        label="Count"
                        mode="outlined"
                        keyboardType="number-pad"
                        style={styles.freqCountInput}
                        value={freq.count ? freq.count.toString() : ""}
                        onChangeText={(text) =>
                            setCampaign((prev) => ({
                                ...prev,
                                contentFrequency: {
                                    ...freq,
                                    count: parseInt(text) || 0,
                                },
                            }))
                        }
                    />
                    <View style={styles.freqPills}>
                        <FreqPill
                            label="/ week"
                            selected={freq.period === "week"}
                            onPress={() => setFreqPeriod("week")}
                            colors={colors}
                        />
                        <FreqPill
                            label="/ month"
                            selected={freq.period === "month"}
                            onPress={() => setFreqPeriod("month")}
                            colors={colors}
                        />
                    </View>
                </View>

                {showBudgetWarning && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            ⚠️ Your budget of {CURRENCY}
                            {(campaign.totalBudget ?? 0).toLocaleString("en-IN")} may be
                            too low for {monthlyPosts} posts/month. We recommend at least{" "}
                            {CURRENCY}
                            {budgetRequired.toLocaleString("en-IN")} for this volume of
                            content.
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.buttons}>
                <Button mode="outlined" onPress={onBack} style={styles.backBtn}>
                    Back
                </Button>
                <Button mode="contained" onPress={handleNext} style={styles.nextBtn}>
                    Next
                </Button>
            </View>
        </StepLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        section: {
            gap: 10,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        sectionHint: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 19,
        },
        options: {
            gap: 14,
            backgroundColor: "transparent",
        },
        freqRow: {
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            backgroundColor: "transparent",
        },
        freqCountInput: {
            width: 90,
        },
        freqPills: {
            flexDirection: "row",
            gap: 8,
            backgroundColor: "transparent",
        },
        warningBox: {
            backgroundColor: colors.errorBannerBg,
            borderWidth: 1,
            borderColor: colors.errorBannerBorder,
            borderRadius: 10,
            padding: 12,
        },
        warningText: {
            fontSize: 13,
            color: colors.errorBannerText,
            lineHeight: 19,
        },
        buttons: {
            flexDirection: "row",
            gap: 12,
            backgroundColor: "transparent",
        },
        backBtn: { flex: 1 },
        nextBtn: { flex: 2 },
    });

export default StepThree;
