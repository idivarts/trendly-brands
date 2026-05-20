import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useBreakpoints } from "@/hooks";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    BudgetType,
    ICampaign,
} from "@/types/Campaign";
import { faIndianRupeeSign, faListCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";

interface BudgetTypeCardProps {
    icon: any;
    title: string;
    description: string;
    badge?: string;
    selected: boolean;
    onSelect: () => void;
    colors: ReturnType<typeof Colors>;
    style?: object;
}

const BudgetTypeCard: React.FC<BudgetTypeCardProps> = ({
    icon,
    title,
    description,
    badge,
    selected,
    onSelect,
    colors,
    style,
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
        <Pressable onPress={onSelect} style={[styles.card, style]}>
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

    const setBudgetType = (type: BudgetType) =>
        setCampaign((prev) => ({ ...prev, budgetType: type }));

    const handleNext = () => {
        if (campaign.budgetType === "fixed" && !(campaign.totalBudget ?? 0)) {
            Toaster.error("Please enter your marketing budget");
            return;
        }
        onNext();
    };

    return (
        <StepLayout
            step={3}
            title="Budget"
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
                        style={styles.optionCard}
                    />
                    <BudgetTypeCard
                        icon={faIndianRupeeSign}
                        title="Fixed Budget"
                        description="You're working with a limited spend and want to make the most of it. Tell us your total budget and we'll propose the best plan we can deliver within that cap. Ideal for startups and brands just starting out with influencer marketing."
                        selected={campaign.budgetType === "fixed"}
                        onSelect={() => setBudgetType("fixed")}
                        colors={colors}
                        style={styles.optionCard}
                    />
                </View>
            </View>

            {/* Fixed budget amount */}
            {campaign.budgetType === "fixed" && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Total Marketing Spend ({CURRENCY})
                    </Text>
                    <Text style={styles.sectionHint}>
                        Your all-in budget — covers Trendly's fee, influencer costs, and any ad spend.
                    </Text>
                    <TextInput
                        label="Total spend in INR (e.g. 100000)"
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
            flexDirection: "row",
            gap: 12,
            backgroundColor: "transparent",
        },
        optionCard: {
            flex: 1,
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
