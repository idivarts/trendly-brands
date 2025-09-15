// import pricingPage from "@/app/(landing)/pricing-page";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { ModelStatus } from "@/shared-libs/firestore/trendly-pro/models/status";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type PlanKey = 'starter' | 'growth' | 'pro' | 'enterprise'
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

const enterpriseFeatures = [
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
        monthly: 0,
        features: starterFeatures,
        preferred: false
    },
    {
        key: "growth",
        name: "Growth",
        monthly: 750,
        features: growthFeatures,
        preferred: false, // visually highlight
    },
    {
        key: "pro",
        name: "Pro",
        monthly: 1500,
        features: proFeatures,
        preferred: true
    },
    {
        key: "enterprise",
        name: "Enterprise",
        monthly: 10000,
        features: enterpriseFeatures,
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

    const [modalVisible, setModalVisible] = useState(false);
    const [modalState, setModalState] = useState<"loading" | "ready" | "opened" | "error">("loading");
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

    const handleSubmit = async (planKey: typeof PLANS[number]["key"]) => {
        try {
            setModalVisible(true);
            setModalState("loading");
            setPaymentUrl(null);
            // Placeholder API call; you will replace this later
            const res = await HttpWrapper.fetch(`/razorpay/subscriptions/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandId: selectedBrand?.id,
                    planKey,
                    planCycle: billing
                }),
            });
            if (!res.ok) throw new Error("Failed to create payment link");
            const data = await res.json();
            const url: string | undefined = data?.link;
            if (!url) throw new Error("No payment URL in response");
            setPaymentUrl(url);
            setModalState("ready");
        } catch (e) {
            setModalState("error");
        }
    };

    const { xl } = useBreakpoints()
    const vStacked = xl ? props.verticallyStacked : true

    const SORTED_FILTER = vStacked ? PLANS.sort((a, b) => {
        if (a.preferred && !b.preferred) return -1; // a is preferred, b is not
        if (!a.preferred && b.preferred) return 1; // b is preferred, a is not
        return b.monthly - a.monthly; // both are either preferred or not
    }) : PLANS;

    const { selectedBrand } = useBrandContext()

    useEffect(() => {
        if (!selectedBrand)
            return;
        setBilling(selectedBrand.billing?.planCycle == "monthly" ? "monthly" : "yearly")
    }, [selectedBrand])

    const currentPlanKey = selectedBrand?.billing?.planKey as PlanKey | undefined
    const currentPlanCycle = selectedBrand?.billing?.planCycle as BillingCycle | undefined

    const styles = stylesFn(theme);

    const openPaymentLink = async () => {
        if (!paymentUrl) return;
        try {
            setModalState("opened");
            const canOpen = await Linking.canOpenURL(paymentUrl);
            if (canOpen) await Linking.openURL(paymentUrl);
            else if (typeof window !== "undefined") (window as any).open(paymentUrl, "_blank");
        } catch { }
    };

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
                    const currentPlan = currentPlanKey === plan.key
                        && currentPlanCycle === billing
                        && selectedBrand?.billing?.status == ModelStatus.Accepted
                    const BuyButton = (<Pressable
                        onPress={() => {
                            if (currentPlan) {
                                window.open(selectedBrand?.billing?.subscriptionUrl, "_blank")
                            } else
                                handleSubmit(plan.key)
                        }}
                        disabled={currentPlan}
                        style={({ pressed }) => [
                            currentPlan ? styles.buyBtnCurrent : (plan.preferred ? styles.buyBtn : styles.buyBtnAlt),
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        <Text style={currentPlan ? styles.buyTextCurrent : (plan.preferred ? styles.buyText : styles.buyTextAlt)}>
                            {currentPlan ? "Current Plan" : `Start ${plan.name} Plan`}
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

                            {effectiveMonthly == 0 ?
                                <>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceMain}>Free</Text>
                                    </View>
                                    <Text style={styles.billingNote}>Free for ever</Text>
                                </> :
                                <>
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
                                </>}



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

            {/* Payment Link Modal */}
            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {modalState === "loading" && (
                            <>
                                <Text style={styles.modalTitle}>Preparing your secure payment</Text>
                                <Text style={styles.modalText}>
                                    Please wait, we are generating your payment link. This usually takes a few seconds.
                                </Text>
                                <ActivityIndicator size="large" />
                            </>
                        )}

                        {modalState === "ready" && (
                            <>
                                <Text style={styles.modalTitle}>Payment link is ready</Text>
                                <Text style={styles.modalText}>
                                    Tap the button below to open the payment page in a new tab. After you complete the payment, return to this page.
                                </Text>
                                <Pressable style={({ pressed }) => [styles.modalBtn, pressed && styles.pressed]} onPress={openPaymentLink}>
                                    <Text style={styles.modalBtnText}>Open Payment Link</Text>
                                </Pressable>
                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Close</Text>
                                </Pressable>
                            </>
                        )}

                        {modalState === "opened" && (
                            <>
                                <Text style={styles.modalTitle}>Complete your payment</Text>
                                <Text style={styles.modalText}>
                                    After payment, please return to this page. It might take 3 to 5 minutes for your payment to reflect on your account. Don’t worry if it doesn’t show up immediately.
                                </Text>
                                <Text style={[styles.modalText, { marginTop: 6 }]}>
                                    Need help? Write to us at <Text style={styles.modalLink}>support@trendly.now</Text>
                                </Text>
                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Got it</Text>
                                </Pressable>
                            </>
                        )}

                        {modalState === "error" && (
                            <>
                                <Text style={styles.modalTitle}>Unable to create link</Text>
                                <Text style={styles.modalText}>
                                    Something went wrong while generating your payment link. Please try again in a moment or contact <Text style={styles.modalLink}>support@trendly.now</Text>.
                                </Text>
                                <Pressable style={({ pressed }) => [styles.modalBtnAlt, pressed && styles.pressed]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalBtnAltText}>Close</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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

        buyBtnCurrent: {
            marginVertical: 14,
            backgroundColor: colors.gray100,
            borderWidth: 1,
            borderColor: colors.gray200,
            opacity: 0.95,
            height: 46,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        buyTextCurrent: { color: colors.background, fontWeight: "900" },

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

        /* Modal styles */
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
        },
        modalCard: {
            width: "100%",
            maxWidth: 420,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            ...Platform.select({ android: { elevation: 4 } }),
        },
        modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
        modalText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
        modalLink: { color: colors.primary, fontWeight: "700" },
        modalBtn: {
            marginTop: 14,
            backgroundColor: colors.primary,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
        },
        modalBtnText: { color: colors.background, fontWeight: "800" },
        modalBtnAlt: {
            marginTop: 10,
            backgroundColor: colors.surface,
            height: 44,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
        },
        modalBtnAltText: { color: colors.text, fontWeight: "800" },

        /* Misc */
        pressed: { opacity: 0.9 },
    })
};
