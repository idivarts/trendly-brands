// import pricingPage from "@/app/(landing)/pricing-page";
import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { Theme, useTheme } from "@react-navigation/native";
import React from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

/* ----------------------- Config ----------------------- */
const PLANS: { key: any, name: string, monthly: number, features: string[], preferred: boolean }[] = [
    {
        key: "starter" as const,
        name: "Starter",
        monthly: 240,
        features: [
            "Unlimited influencer browsing",
            "Advanced filtering",
            "20 influencer unlocks per month",
            "1 collaboration per month",
            "Unlimited applications & invitations",
            "1 hiring (contract) per month",
        ],
        preferred: false
    },
    {
        key: "growth" as const,
        name: "Growth",
        monthly: 750,
        features: [
            "Everything in Starter",
            "5 collaborations per month",
            "1 boosted collaboration - guaranteed hiring",
            "Unlimited applications & invitations",
            "Unlimited hirings",
        ],
        preferred: true, // visually highlight
    },
    {
        key: "pro" as const,
        name: "Pro",
        monthly: 1500,
        features: [
            "Everything in Growth",
            "Unlimited influencer unlocks",
            "Unlimited collaboration postings",
            "End-to-end hiring support",
            "Fraud protection & recovery assistance",
        ],
        preferred: false
    },
] as const;

type Billing = "yearly" | "monthly";

interface PlanWrapperProps {
    verticallyStacked?: boolean;
    onSelect?: (planKey: typeof PLANS[number]["key"], billing: Billing) => void;
}

const PlanWrapper = (props: PlanWrapperProps) => {
    const theme = useTheme();

    const [billing, setBilling] = React.useState<Billing>("yearly"); // default Yearly
    const isYearly = billing === "yearly";

    const handleSubmit = (planKey: typeof PLANS[number]["key"]) => {
        props.onSelect?.(planKey, billing);
    };
    const { xl } = useBreakpoints()
    const vStacked = xl ? props.verticallyStacked : true

    const SORTED_FILTER = vStacked ? PLANS.sort((a, b) => {
        if (a.preferred && !b.preferred) return -1; // a is preferred, b is not
        if (!a.preferred && b.preferred) return 1; // b is preferred, a is not
        return b.monthly - a.monthly; // both are either preferred or not
    }) : PLANS;


    const styles = stylesFn(theme);

    return (
        <View style={{ marginTop: 16 }}>
            {/* Billing toggle */}
            <View style={[styles.toggleWrap, !vStacked && { alignSelf: "center" }]}>
                <View style={styles.togglePill}>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setBilling("monthly")}
                        style={({ pressed }) => [
                            styles.toggleItem,
                            billing === "monthly" && styles.toggleItemActive,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                billing === "monthly" && styles.toggleTextActive,
                            ]}
                        >
                            Monthly
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => setBilling("yearly")}
                        style={({ pressed }) => [
                            styles.toggleItem,
                            billing === "yearly" && styles.toggleItemActive,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                billing === "yearly" && styles.toggleTextActive,
                            ]}
                        >
                            Yearly
                            <View style={styles.discountPillAlt}>
                                <Text style={styles.discountText}>Save 2 months</Text>
                            </View>
                        </Text>
                    </Pressable>
                </View>
                {/* {isYearly && (
                    <View style={styles.discountPillAlt}>
                        <Text style={styles.discountText}>Save 2 months</Text>
                    </View>
                )} */}
            </View>

            {/* Plans grid */}
            <View
                style={[
                    styles.plansWrap,
                    vStacked ? { flexDirection: "column" } : { flexDirection: "row", flexWrap: "wrap" },
                ]}
            >
                {SORTED_FILTER.map((plan) => {
                    const effectiveMonthly = isYearly
                        ? Math.round((plan.monthly * 10) / 12)
                        : plan.monthly;
                    const billedYearly = plan.monthly * 10; // pay for 10 months
                    const BuyButton = (<Pressable
                        onPress={() => handleSubmit(plan.key)}
                        style={({ pressed }) => [
                            plan.preferred ? styles.buyBtn : styles.buyBtnAlt,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        <Text style={plan.preferred ? styles.buyText : styles.buyTextAlt}>
                            Start {plan.name} Plan
                        </Text>
                    </Pressable>)
                    return (
                        <View
                            key={plan.key}
                            style={[
                                styles.planCard,
                                plan.preferred && styles.planPreferred,
                                vStacked ? { width: "100%" } : { minWidth: 260, flex: 1 },
                            ]}
                        >
                            {plan.preferred && (
                                <View style={styles.planTagPreferred}>
                                    <Text style={styles.planTagText}>Most popular</Text>
                                </View>
                            )}

                            <Text style={styles.planName}>
                                {plan.name}
                                {/* ({isYearly ? "Yearly" : "Monthly"}) */}
                            </Text>

                            <View style={styles.priceRow}>
                                <Text style={styles.priceMain}>₹{effectiveMonthly}</Text>
                                {isYearly && (
                                    <Text style={styles.priceSlash}>₹{plan.monthly}</Text>
                                )}
                                <Text style={styles.pricePer}>/ month</Text>
                                {/* {isYearly && (
                                    <Text style={styles.pricePer}> when paid yearly</Text>
                                )} */}
                            </View>

                            {isYearly ? (
                                <Text style={styles.savingsText}>
                                    Billed ₹{billedYearly}/year - Save 2 months cost
                                </Text>
                            ) : (
                                <Text style={styles.billingNote}>Billed monthly, cancel anytime</Text>
                            )}

                            <View style={styles.divider} />

                            {!vStacked && BuyButton}

                            {plan.features.map((f, i) => (
                                <View key={i} style={styles.featureRow}>
                                    <Text style={styles.featureTick}>✓</Text>
                                    <Text style={styles.featureCopy}>{f}</Text>
                                </View>
                            ))}

                            {vStacked && BuyButton}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default PlanWrapper;


const stylesFn = (theme: Theme) => {
    const colors = Colors(theme);

    /* --------- Styles --------- */
    const BLUE = "#254F7A";
    const BLUE_DARK = "#1A3B5C";
    const BLUE_LIGHT = "#6C91BA";
    const TEXT = "#243A53";


    return StyleSheet.create({
        /* Container helpers kept for future reuse (page/hero/etc. preserved from prior file) */
        page: {
            paddingHorizontal: 24,
            paddingTop: Platform.select({ web: 36, default: 24 }),
            paddingBottom: 48,
            backgroundColor: "#FFFFFF",
            maxWidth: 1300,
            alignSelf: "center",
            width: "100%",
        },

        /* Plans */
        plansWrap: { marginTop: 16, gap: 16 },
        planCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E1E6EE",
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            ...Platform.select({ android: { elevation: 1 } }),
        },
        planPreferred: {
            borderColor: BLUE,
            shadowOpacity: 0.08,
            ...Platform.select({ android: { elevation: 2 } }),
        },
        planTagPreferred: {
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: BLUE,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
        },
        planTagText: { color: "#fff", fontSize: 11, fontWeight: "800" },
        planName: { color: TEXT, fontSize: 18, fontWeight: "800", marginTop: 2 },
        priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6, flexWrap: "wrap" },
        priceMain: { color: TEXT, fontSize: 28, fontWeight: "900" },
        priceSlash: { color: "#8AA0BA", textDecorationLine: "line-through", marginLeft: 8, marginBottom: 2 },
        pricePer: { color: "#6C7A89", marginLeft: 6, marginBottom: 2 },
        savingsText: { color: "#1A7F37", fontWeight: "700", fontSize: 12, marginTop: 4 },
        billingNote: { color: "#6C7A89", fontSize: 12, marginTop: 4 },
        divider: { height: 1, backgroundColor: "#EEF3F9", marginVertical: 12 },
        featureRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
        featureTick: { fontSize: 16, marginRight: 10 },
        featureCopy: { color: TEXT, fontSize: 13 },
        buyBtn: {
            marginVertical: 14,
            backgroundColor: BLUE,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyText: { color: "#fff", fontWeight: "800" },
        buyBtnAlt: {
            marginVertical: 14,
            backgroundColor: "#EEF4FB",
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyTextAlt: { color: TEXT, fontWeight: "800" },

        /* Compare hint kept for reuse */
        compareHint: { marginTop: 12, color: "#6C7A89", fontSize: 12 },

        /* Toggle */
        toggleWrap: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
        },
        togglePill: {
            flexDirection: "row",
            backgroundColor: "#EEF4FB",
            borderRadius: 999,
            padding: 4,
            borderWidth: 1,
            borderColor: "#E1E6EE",
        },
        toggleItem: {
            paddingHorizontal: 14,
            height: 36,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        toggleItemActive: {
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#D9E4F2",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            ...Platform.select({ android: { elevation: 2 } }),
        },
        toggleText: { color: TEXT, fontWeight: "700", fontSize: 14 },
        toggleTextActive: { color: BLUE_DARK },
        discountPillAlt: {
            alignSelf: "flex-start",
            backgroundColor: "#1f3f73",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            marginLeft: 16,
        },
        discountText: { color: "#fff", fontWeight: "600", fontSize: 10 },

        /* Misc */
        pressed: { opacity: 0.9 },
    })
};
