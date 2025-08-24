// import pricingPage from "@/app/(landing)/pricing-page";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type PlanKey = 'starter' | 'growth' | 'pro'
export type BillingCycle = "yearly" | "monthly";

/* ----------------------- Config ----------------------- */
const starterFeatures = [
    'Unlimited Influencer Browsing',
    'Advanced Filtering / Preferences',
    '20 influencer connects',
    'Upto 1 Collaboration',
    'Unlimited Applications / Invitations',
    'Max One Hiring (Contract)',
    'No Recovery Support',
]

const growthFeatures = [
    'Everything from Starter Plan',
    'Upto 50 influencer connects',
    '5 Collaboration posting',
    'One Free Collaboration Boosting',
    'Upto 8 Hiring (Contracts)',
    'General Hiring Support',
    'General Recovery Support',
]

const proFeatures = [
    'Everything on Growth Plan',
    'Unlimited Influencer Connects',
    'Unlimited Collaboration Postings',
    'Upto 5 Collaboration Boostings',
    'Unlimited Hirings (Contracts)',
    'End to End Hiring Support *',
    'Guaranteed Money Recovery Support *',
]
const PLANS: { key: PlanKey, name: string, monthly: number, features: string[], preferred: boolean }[] = [
    {
        key: "starter",
        name: "Starter",
        monthly: 240,
        features: starterFeatures,
        preferred: false
    },
    {
        key: "growth",
        name: "Growth",
        monthly: 750,
        features: growthFeatures,
        preferred: true, // visually highlight
    },
    {
        key: "pro",
        name: "Pro",
        monthly: 1500,
        features: proFeatures,
        preferred: false
    },
] as const;

interface PlanWrapperProps {
    verticallyStacked?: boolean;
    onSelect?: (planKey: typeof PLANS[number]["key"], billing: BillingCycle) => void;
}

const PlanWrapper = (props: PlanWrapperProps) => {
    const theme = useTheme();

    const [billing, setBilling] = React.useState<BillingCycle>("yearly"); // default Yearly
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

    const { selectedBrand, updateBrand } = useBrandContext()
    const [loading, setLoading] = useState(false)


    // Payment links keyed by plan and cycle, if configured server-side
    const [links, setLinks] = useState<Partial<Record<`${PlanKey}:${BillingCycle}`, string>>>({})
    const [linkKeyPending, setLinkKeyPending] = useState<`${PlanKey}:${BillingCycle}` | undefined>(undefined)


    const fetchLinksIfNeeded = async () => {
        try {
            setLoading(true)
            // Attempt to fetch per-plan, per-cycle links from backend if available.
            // These endpoints are placeholders compatible with existing API style.
            // If your backend isn't ready yet, the UI will still work and simply
            // show a helpful message on purchase.
            const makeBody = (plan: PlanKey, c: BillingCycle) => ({
                brandId: selectedBrand?.id,
                plan,
                cycle: c,
            })

            const candidates: Array<[`${PlanKey}:${BillingCycle}`, RequestInit]> = [
                ['starter:monthly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('starter', 'monthly')) }],
                ['starter:yearly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('starter', 'yearly')) }],
                ['growth:monthly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('growth', 'monthly')) }],
                ['growth:yearly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('growth', 'yearly')) }],
                ['pro:monthly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('pro', 'monthly')) }],
                ['pro:yearly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('pro', 'yearly')) }],
            ]

            const results = await Promise.allSettled(
                candidates.map(async ([key, init]) => {
                    // Reuse the same endpoint you already use for subscriptions.
                    // Backward compatible: if the server doesn't understand the new
                    // params it can ignore them and return 4xx which we swallow.
                    const res = await HttpWrapper.fetch('/razorpay/create-subscription', init)
                    if (!res.ok) throw new Error('no-link')
                    const data = await res.json()
                    return [key, data.link as string] as const
                })
            )

            const map: Record<string, string> = {}
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const [key, v] = r.value
                    if (v) map[key] = v
                }
            })

            if (Object.keys(map).length) {
                setLinks(prev => ({ ...prev, ...map }))
                // Persist on the brand so you don't refetch on next load
                // updateBrand(selectedBrand?.id || '', { paymentLinksByPlan: { ...(selectedBrand?.paymentLinksByPlan as any), ...map } })
            }
        } catch (e) {
            // Silent; links are optional until backend is ready.
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // if (selectedBrand?.paymentLinksByPlan) {
        //     setLinks(selectedBrand.paymentLinksByPlan as any)
        // } else {
        //     // Best-effort fetch
        //     fetchLinksIfNeeded()
        // }
    }, [selectedBrand?.id])

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
    // Removed hardcoded color constants

    return StyleSheet.create({
        /* Container helpers kept for future reuse (page/hero/etc. preserved from prior file) */
        page: {
            paddingHorizontal: 24,
            paddingTop: Platform.select({ web: 36, default: 24 }),
            paddingBottom: 48,
            backgroundColor: colors.background,
            maxWidth: 1300,
            alignSelf: "center",
            width: "100%",
        },

        /* Plans */
        plansWrap: { marginTop: 16, gap: 16 },
        planCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            ...Platform.select({ android: { elevation: 1 } }),
        },
        planPreferred: {
            borderColor: colors.primary,
            shadowOpacity: 0.08,
            ...Platform.select({ android: { elevation: 2 } }),
        },
        planTagPreferred: {
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
        },
        planTagText: { color: colors.background, fontSize: 11, fontWeight: "800" },
        planName: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
        priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6, flexWrap: "wrap" },
        priceMain: { color: colors.text, fontSize: 28, fontWeight: "900" },
        priceSlash: { color: colors.textSecondary, textDecorationLine: "line-through", marginLeft: 8, marginBottom: 2 },
        pricePer: { color: colors.textSecondary, marginLeft: 6, marginBottom: 2 },
        savingsText: { color: colors.success, fontWeight: "700", fontSize: 12, marginTop: 4 },
        billingNote: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
        divider: { height: 1, backgroundColor: colors.surface, marginVertical: 12 },
        featureRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
        featureTick: { fontSize: 16, marginRight: 10, color: colors.primary },
        featureCopy: { color: colors.text, fontSize: 13 },
        buyBtn: {
            marginVertical: 14,
            backgroundColor: colors.primary,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyText: { color: colors.background, fontWeight: "800" },
        buyBtnAlt: {
            marginVertical: 14,
            backgroundColor: colors.surface,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyTextAlt: { color: colors.text, fontWeight: "800" },

        /* Compare hint kept for reuse */
        compareHint: { marginTop: 12, color: colors.textSecondary, fontSize: 12 },

        /* Toggle */
        toggleWrap: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
        },
        togglePill: {
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 999,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
        },
        toggleItem: {
            paddingHorizontal: 14,
            height: 36,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        toggleItemActive: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.primaryLight,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            ...Platform.select({ android: { elevation: 2 } }),
        },
        toggleText: { color: colors.text, fontWeight: "700", fontSize: 14 },
        toggleTextActive: { color: colors.primaryDark },
        discountPillAlt: {
            alignSelf: "flex-start",
            backgroundColor: colors.primaryDark,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            marginLeft: 16,
        },
        discountText: { color: colors.background, fontWeight: "600", fontSize: 10 },

        /* Misc */
        pressed: { opacity: 0.9 },
    })
};
