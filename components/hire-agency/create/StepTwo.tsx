import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useBreakpoints } from "@/hooks";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { BudgetType, IAgencyHire } from "@/types/AgencyHire";
import {
    faCalendarCheck,
    faChartLine,
    faIndianRupeeSign,
    faListCheck,
    faMagicWandSparkles,
    faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import StepLayout from "./StepLayout";

const CURRENCY = "₹";

const RETAINER_PERKS = [
    { icon: faCalendarCheck, text: "Deep brand alignment from day one" },
    { icon: faRotate,        text: "Monthly reviews & strategy refinement" },
    { icon: faChartLine,     text: "Compounding results that grow over time" },
    { icon: faMagicWandSparkles, text: "Conversion audit included, free of charge" },
] as const;

interface BudgetOptionProps {
    icon: any;
    title: string;
    description: string;
    badge?: string;
    selected: boolean;
    onSelect: () => void;
    colors: ReturnType<typeof Colors>;
    flex?: boolean;
}

const BudgetOption: React.FC<BudgetOptionProps> = ({
    icon, title, description, badge, selected, onSelect, colors, flex,
}) => {
    const s = useMemo(() => StyleSheet.create({
        card: {
            ...(flex ? { flex: 1 } : {}),
            borderRadius: 16,
            padding: 20,
            gap: 10,
            backgroundColor: selected ? colors.budgetCardBg : colors.card,
            shadowColor: selected ? colors.primary : "#000",
            shadowOffset: { width: 0, height: selected ? 4 : 2 },
            shadowRadius: selected ? 12 : 8,
            shadowOpacity: selected ? 0.35 : 0.07,
            elevation: selected ? 4 : 3,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "transparent",
        },
        iconWrap: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selected ? colors.primary : colors.aliceBlue,
        },
        title: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            flex: 1,
        },
        desc: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        badge: {
            alignSelf: "flex-start",
            backgroundColor: colors.reachCardBg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 3,
        },
        badgeText: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.green,
        },
    }), [selected, colors, flex]);

    return (
        <Pressable onPress={onSelect} style={s.card}>
            <View style={s.row}>
                <View style={s.iconWrap}>
                    <FontAwesomeIcon icon={icon} size={18} color={selected ? colors.white : colors.primary} />
                </View>
                <Text style={s.title}>{title}</Text>
            </View>
            <Text style={s.desc}>{description}</Text>
            {badge ? (
                <View style={s.badge}>
                    <Text style={s.badgeText}>{badge}</Text>
                </View>
            ) : null}
        </Pressable>
    );
};

interface StepTwoProps {
    hire: Partial<IAgencyHire>;
    setHire: React.Dispatch<React.SetStateAction<Partial<IAgencyHire>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepTwo: React.FC<StepTwoProps> = ({ hire, setHire, onNext, onBack }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl, width), [colors, xl, width]);

    const setBudgetType = (type: BudgetType) =>
        setHire((prev) => ({ ...prev, budgetType: type }));

    const handleNext = () => {
        if (hire.budgetType === "fixed" && !(hire.totalBudget ?? 0)) {
            Toaster.error("Please enter your total marketing budget");
            return;
        }
        onNext();
    };

    return (
        <StepLayout
            step={1}
            title="How We Work"
            subtitle="What to expect from a Trendly partnership"
            onBack={onBack}
        >
            {/* ── Retainer education card ── */}
            <View style={styles.retainerCard}>
                <View style={styles.retainerHeader}>
                    <View style={styles.retainerIconWrap}>
                        <FontAwesomeIcon icon={faCalendarCheck} size={22} color={colors.white} />
                    </View>
                    <View style={styles.retainerHeadText}>
                        <Text style={styles.retainerBadge}>OUR MODEL</Text>
                        <Text style={styles.retainerTitle}>Monthly Retainer</Text>
                    </View>
                </View>

                <Text style={styles.retainerBody}>
                    Trendly operates exclusively on a monthly retainer. Rather than one-off
                    campaigns, we become an extension of your marketing team — deeply aligned
                    with your brand, iterating on strategy every month, and delivering results
                    that compound over time.
                </Text>

                <View style={styles.perksList}>
                    {RETAINER_PERKS.map(({ icon, text }) => (
                        <View key={text} style={styles.perkRow}>
                            <View style={styles.perkIconWrap}>
                                <FontAwesomeIcon icon={icon} size={12} color={colors.primary} />
                            </View>
                            <Text style={styles.perkText}>{text}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>
                        ✦ Conversion audit included free for all retainer clients
                    </Text>
                </View>
            </View>

            {/* ── Budget type ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>How would you like to get started?</Text>
                <Text style={styles.sectionHint}>
                    The services we propose — and their cost — depend on which option you choose below.
                </Text>

                <View style={styles.optionRow}>
                    <BudgetOption
                        icon={faListCheck}
                        title="I know exactly what I need"
                        description="Select the specific services you want and we'll build a custom quotation instantly."
                        badge="✦ Instant quotation"
                        selected={hire.budgetType === "needs-based"}
                        onSelect={() => setBudgetType("needs-based")}
                        colors={colors}
                        flex
                    />
                    <BudgetOption
                        icon={faIndianRupeeSign}
                        title="I have a budget in mind"
                        description="Tell us your total marketing spend and we'll design the best possible plan within that cap."
                        selected={hire.budgetType === "fixed"}
                        onSelect={() => setBudgetType("fixed")}
                        colors={colors}
                        flex
                    />
                </View>
            </View>

            {/* Fixed budget amount — only shown when fixed is selected */}
            {hire.budgetType === "fixed" && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Total Marketing Spend ({CURRENCY})
                    </Text>
                    <Text style={styles.sectionHint}>
                        Your all-in monthly budget — covers Trendly's fee, influencer costs, and ad spend.
                    </Text>
                    <TextInput
                        label="Monthly spend in INR (e.g. 100000)"
                        mode="outlined"
                        keyboardType="number-pad"
                        value={hire.totalBudget ? hire.totalBudget.toString() : ""}
                        onChangeText={(text) =>
                            setHire((prev) => ({ ...prev, totalBudget: parseInt(text) || 0 }))
                        }
                    />
                </View>
            )}

            <Button mode="contained" onPress={handleNext}>
                Next
            </Button>
        </StepLayout>
    );
};

export default StepTwo;

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean, width: number) =>
    StyleSheet.create({
        retainerCard: {
            borderRadius: 18,
            padding: 20,
            gap: 16,
            backgroundColor: colors.budgetCardBg,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 16,
            shadowOpacity: 0.14,
            elevation: 5,
        },
        retainerHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: "transparent",
        },
        retainerIconWrap: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.4,
            elevation: 4,
        },
        retainerHeadText: {
            gap: 2,
            backgroundColor: "transparent",
        },
        retainerBadge: {
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1.1,
            color: colors.primary,
            textTransform: "uppercase",
        },
        retainerTitle: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
        },
        retainerBody: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        perksList: {
            gap: 10,
            backgroundColor: "transparent",
        },
        perkRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "transparent",
        },
        perkIconWrap: {
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.06,
            elevation: 1,
        },
        perkText: {
            fontSize: 13,
            color: colors.text,
            fontWeight: "500",
        },
        freeBadge: {
            alignSelf: "flex-start",
            backgroundColor: colors.reachCardBg,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 5,
        },
        freeBadgeText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.green,
        },
        section: {
            gap: 12,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        sectionHint: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 20,
            marginTop: -4,
        },
        optionRow: {
            flexDirection: xl ? "row" : "column",
            gap: 12,
            backgroundColor: "transparent",
        },
    });
