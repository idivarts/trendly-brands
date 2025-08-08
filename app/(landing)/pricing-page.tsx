import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";
import {
    Image,
    ImageBackground,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";

// --- Content & links ---
const FEATURE_ITEMS = [
    { icon: "📘", title: "Marketing Partner", sub: "Facebook Premier Level Agency Partner" },
    { icon: "🟦", title: "Google Endorsed", sub: "Marketing Partner" },
    { icon: "📰", title: "Forbes Agency", sub: "Council Member" },
    { icon: "🏆", title: "Inc. 5000", sub: "Fastest Growing Company" },
];

const ONBOARD_IMG =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif"; // placeholder visual

const CAL_LINK = "https://cal.com/rahul-idiv/30min";
const CREATE_BRAND_LINK = "https://brands.trendly.now/pre-signin?skip=1";

const BUY_YEARLY_LINK = "https://brands.trendly.now/checkout?plan=yearly&trial=1&discount=today50";
const BUY_MONTHLY_LINK = "https://brands.trendly.now/checkout?plan=monthly&trial=1&discount=today50";

const YEARLY_FEATURES = [
    "Unlimited collaboration postings",
    "Guaranteed Influencer Availability",
    "Fraud Protection & Recovery Assistance",
    "Fast‑Track Customer Support",
    "First collaboration handled by us (worth ₹1,500)",
];

const MONTHLY_FEATURES = [
    "5 collaborations per month",
    "Unlimited invites & applications",
    "Unlimited hiring contracts",
    "7‑day money‑back guarantee",
];

export default function PricingPage() {
    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    const [brandName, setBrandName] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{ brand?: string; phone?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const open = (url: string) => Linking.openURL(url).catch(() => { });

    function validate() {
        const e: { brand?: string; phone?: string } = {};
        if (!brandName || brandName.trim().length < 2) e.brand = "Please enter your brand name.";
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 15) e.phone = "Enter a valid phone number.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (submitting) return;
        if (!validate()) return;
        try {
            setSubmitting(true);
            const url = `${CREATE_BRAND_LINK}&brand=${encodeURIComponent(brandName.trim())}&phone=${encodeURIComponent(phone.trim())}`;
            open(url);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AppLayout>
            <ScrollView
                contentContainerStyle={styles.page}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={require("@/assets/images/rectangluar blue logo transparent.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Pressable style={styles.demoBtn} onPress={() => open(CAL_LINK)}>
                        <Text style={styles.demoIcon}>🎥</Text>
                        <Text style={styles.demoText}>Request a Demo</Text>
                    </Pressable>
                </View>

                {/* Main Hero - Explainer (left) + Form (right) */}
                <View style={[styles.hero, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left: Explainer */}
                    <View style={[styles.left, isWide ? { paddingRight: 90 } : {}]}>
                        <Text style={styles.kicker}>PRICING & PLANS</Text>
                        <Text style={styles.title}>
                            Choose your <Text style={styles.titleAccent}>plan</Text>
                        </Text>
                        {/* Trust / Reasons */}
                        <View style={styles.reasonsBox}>
                            <View style={styles.discountPill}>
                                <Text style={styles.discountText}>Today only: Flat 50% OFF</Text>
                            </View>
                            <View style={styles.reasonItem}>
                                <Text style={styles.pointIcon}>🛡️</Text>
                                <Text style={styles.reasonText}>We only collect payment info now — you won't be charged until your trial ends.</Text>
                            </View>
                            <View style={styles.reasonItem}>
                                <Text style={styles.pointIcon}>↩️</Text>
                                <Text style={styles.reasonText}>Cancel anytime during trial in one tap — no questions asked.</Text>
                            </View>
                            <View style={styles.reasonItem}>
                                <Text style={styles.pointIcon}>💯</Text>
                                <Text style={styles.reasonText}>7‑day money‑back guarantee after your first payment.</Text>
                            </View>
                            <View style={styles.noticeRow}>
                                <Text style={styles.noticeText}>Skip today and the discount won't apply later.</Text>
                            </View>
                        </View>
                        {/* <Text style={styles.subtitle}>
                            Pick a plan that matches your growth. Your trial continues — you won’t be charged
                            today. A special <Text style={{ fontWeight: '800' }}>50% discount</Text> is applied for today only; if you skip now,
                            standard pricing will apply later. Cancel anytime during the trial, and enjoy a
                            7‑day money‑back guarantee after your first charge.
                        </Text> */}

                        {/* <View style={styles.points}>
                            <View style={styles.pointItem}>
                                <Text style={styles.pointIcon}>✅</Text>
                                <Text style={styles.pointText}>Verified influencers with fraud protection</Text>
                            </View>
                            <View style={styles.pointItem}>
                                <Text style={styles.pointIcon}>✅</Text>
                                <Text style={styles.pointText}>Unlimited invites, clear contracts & secure payouts</Text>
                            </View>
                            <View style={styles.pointItem}>
                                <Text style={styles.pointIcon}>✅</Text>
                                <Text style={styles.pointText}>Yearly plan = priority support & best savings</Text>
                            </View>
                        </View> */}

                        {/* Visual */}
                        <ImageBackground
                            source={{ uri: ONBOARD_IMG }}
                            style={styles.visual}
                            imageStyle={styles.visualImg}
                        >
                            <View style={styles.playBadge}>
                                <Text style={styles.playBadgeText}>Plans</Text>
                            </View>
                        </ImageBackground>
                    </View>

                    {/* Right: Form */}
                    <View style={styles.formCard}>
                        {/* Stepper */}
                        <View style={styles.stepperWrap}>
                            <Text style={styles.stepperLabel}>Step 3 of 3</Text>
                            <View style={styles.stepperRow}>
                                {/* Step 1 */}
                                <View style={styles.stepGroup}>
                                    <View style={[styles.stepDot, styles.stepDone]}>
                                        <Text style={styles.stepNum}>1</Text>
                                    </View>
                                    <View style={[styles.stepBar, styles.stepBarDone]} />
                                </View>
                                {/* Step 2 (current) */}
                                <View style={styles.stepGroup}>
                                    <View style={[styles.stepDot, styles.stepDone]}>
                                        <Text style={styles.stepNum}>2</Text>
                                    </View>
                                    <View style={[styles.stepBar, styles.stepBarDone]} />
                                </View>
                                {/* Step 3 */}
                                <View style={styles.stepGroup}>
                                    <View style={[styles.stepDot, styles.stepCurrent]}>
                                        <Text style={styles.stepNum}>3</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.formHeading}>Choose your plan</Text>
                        <Text style={styles.formSub}>Your trial continues. Pay nothing today.</Text>

                        {/* Plans */}
                        <View style={styles.plansWrap}>
                            {/* Yearly (Preferred) */}
                            <View style={[styles.planCard, styles.planPreferred]}>
                                <View style={styles.planTagPreferred}><Text style={styles.planTagText}>Preferred</Text></View>
                                <Text style={styles.planName}>Business (Yearly)</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceMain}>₹4,999</Text>
                                    <Text style={styles.priceSlash}>₹6,000</Text>
                                    <Text style={styles.pricePer}>/year</Text>
                                </View>
                                <Text style={styles.savingsText}>Save 30% vs monthly</Text>
                                <View style={styles.divider} />
                                {YEARLY_FEATURES.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Text style={styles.featureTick}>✓</Text>
                                        <Text style={styles.featureCopy}>{f}</Text>
                                    </View>
                                ))}
                                <Pressable onPress={() => open(BUY_YEARLY_LINK)} style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                                    <Text style={styles.buyText}>Start yearly — Pay nothing today</Text>
                                </Pressable>
                            </View>

                            {/* Monthly */}
                            <View style={styles.planCard}>
                                <Text style={styles.planName}>Growth (Monthly)</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceMain}>₹499</Text>
                                    <Text style={styles.pricePer}>/month</Text>
                                </View>
                                <View style={styles.divider} />
                                {MONTHLY_FEATURES.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Text style={styles.featureTick}>✓</Text>
                                        <Text style={styles.featureCopy}>{f}</Text>
                                    </View>
                                ))}
                                <Pressable onPress={() => open(BUY_MONTHLY_LINK)} style={({ pressed }) => [styles.buyBtnAlt, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                                    <Text style={styles.buyTextAlt}>Start monthly — Pay nothing today</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Comparison note */}
                        <Text style={styles.compareHint}>Both plans include full access, verified influencer hiring, unlimited invites, and fraud protection. Yearly plan adds priority support and faster dispute handling.</Text>
                    </View>
                </View>

                {/* Feature summary strip */}
                <View style={styles.featuresBar}>
                    <View style={styles.featuresInner}>
                        {FEATURE_ITEMS.map((f, idx) => (
                            <View key={idx} style={styles.featureItem}>
                                <Text style={styles.featureIcon}>{f.icon}</Text>
                                <View style={styles.featureTextWrap}>
                                    <Text style={styles.featureTitle}>{f.title}</Text>
                                    <Text style={styles.featureSub}>{f.sub}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </AppLayout>
    );
}

/* --------- Styles --------- */
const BLUE = "#254F7A";
const BLUE_DARK = "#1A3B5C";
const BLUE_LIGHT = "#6C91BA";
const TEXT = "#243A53";

const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 24,
        paddingTop: Platform.select({ web: 36, default: 24 }),
        paddingBottom: 48,
        backgroundColor: "#FFFFFF",
        maxWidth: 1300,
        alignSelf: "center",
        width: "100%",
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    logo: {
        width: 180,
        height: 75,
    },
    demoBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        height: 42,
        borderRadius: 999,
        backgroundColor: "#EEF4FB",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    demoIcon: { fontSize: 16, marginRight: 8 },
    demoText: { color: TEXT, fontSize: 14, fontWeight: "600" },

    /* Hero layout */
    hero: {
        backgroundColor: "#F8FBFF",
        borderRadius: 24,
        padding: 28,
        marginTop: 0,
    },
    heroRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    heroCol: {
        flexDirection: "column",
    },

    /* Left */
    left: {
        flex: 1.3,
        alignSelf: "flex-start"
    },
    kicker: {
        color: BLUE_LIGHT,
        fontSize: 12,
        letterSpacing: 1.4,
        fontWeight: "700",
        marginBottom: 8,
    },
    title: {
        color: TEXT,
        fontSize: 48,
        lineHeight: 62,
        fontWeight: "600",
        marginTop: 4,
    },
    titleAccent: {
        color: BLUE,
        textDecorationLine: "underline",
        textDecorationColor: "#CFE2F7",
        textDecorationStyle: "solid",
    },
    subtitle: {
        marginTop: 18,
        marginBottom: 14,
        color: "#53657A",
        fontSize: 16,
        lineHeight: 24,
        maxWidth: 640,
    },
    points: { marginTop: 8, gap: 10 },
    pointItem: { flexDirection: "row", alignItems: "center" },
    pointIcon: { fontSize: 18, marginRight: 10 },
    pointText: { color: TEXT, fontSize: 14 },

    /* Visual under explainer */
    visual: {
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "flex-end",
        marginTop: 18,
        backgroundColor: "#E7F0F9",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    visualImg: { resizeMode: "cover" },
    playBadge: {
        alignSelf: "flex-start",
        margin: 12,
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    playBadgeText: { color: BLUE_DARK, fontWeight: "800" },

    /* Form */
    formCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 22,
        marginTop: 18,
        ...Platform.select({ web: { maxWidth: 520 } }),
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 4 } }),
    },
    formHeading: { fontSize: 24, fontWeight: "800", color: TEXT },
    formSub: { marginTop: 6, color: "#6C7A89", fontSize: 13 },
    field: { marginTop: 16 },
    label: { color: TEXT, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E1E6EE",
        paddingHorizontal: 14,
        backgroundColor: "#FAFCFF",
        color: TEXT,
    },
    inputError: { borderColor: "#E87070" },
    error: { color: "#D64545", marginTop: 6, fontSize: 12 },
    disclaimer: { color: "#6C7A89", marginTop: 12, fontSize: 12 },

    /* CTA reused */
    cta: {
        marginTop: 18,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        height: 48,
        borderRadius: 999,
        backgroundColor: BLUE,
        shadowColor: "#2B5C8F",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        ...Platform.select({ android: { elevation: 6 } }),
    },
    ctaText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    ctaArrow: {
        color: "#FFFFFF",
        fontSize: 22,
        marginLeft: 10,
        marginTop: -2,
    },

    /* Feature summary strip */
    featuresBar: {
        marginTop: 40,
        backgroundColor: "#1f3f73",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    featuresInner: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        rowGap: 12,
        gap: 12,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        minWidth: 150,
        flexShrink: 0,
    },
    featureIcon: {
        fontSize: 42,
        marginRight: 16,
        color: "#FFFFFF",
    },
    featureTextWrap: { flexShrink: 1, gap: 8 },
    featureTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.2,
    },
    featureSub: { color: "#D6E2F5", fontSize: 12, marginTop: 2 },
    // Stepper
    stepperWrap: {
        marginBottom: 28,
    },
    stepperLabel: {
        color: TEXT,
        fontSize: 12,
        fontWeight: '700',
        opacity: 0.8,
        marginBottom: 8,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 16,
        height: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9F0F8',
        borderWidth: 1,
        borderColor: '#E1E6EE',
    },
    stepNum: {
        color: TEXT,
        fontSize: 13,
        fontWeight: '800',
    },
    stepBar: {
        height: 4,
        borderRadius: 4,
        marginHorizontal: 10,
        flex: 1,
        backgroundColor: '#E9F0F8',
    },
    stepDone: {
        backgroundColor: BLUE,
        borderColor: BLUE,
    },
    stepCurrent: {
        backgroundColor: BLUE_DARK,
        borderColor: BLUE_DARK,
    },
    stepPending: {
        backgroundColor: '#E9F0F8',
        borderColor: '#E1E6EE',
    },
    stepBarDone: {
        backgroundColor: BLUE_LIGHT,
    },
    stepBarPending: {
        backgroundColor: '#E9F0F8',
    },
    /* Reasons / discount */
    reasonsBox: { marginTop: 8, backgroundColor: '#F8FBFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E6EEF8' },
    discountPill: { alignSelf: 'flex-start', backgroundColor: '#1f3f73', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 8 },
    discountText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    reasonItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
    reasonText: { color: TEXT, fontSize: 13, lineHeight: 18, flex: 1 },
    noticeRow: { marginTop: 10 },
    noticeText: { color: '#D64545', fontSize: 12, fontWeight: '700' },

    /* Plans */
    plansWrap: { marginTop: 16, gap: 16 },
    planCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E1E6EE', padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, ...Platform.select({ android: { elevation: 1 } }) },
    planPreferred: { borderColor: BLUE, shadowOpacity: 0.08, ...Platform.select({ android: { elevation: 2 } }) },
    planTagPreferred: { position: 'absolute', top: 12, right: 12, backgroundColor: BLUE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    planTagText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    planName: { color: TEXT, fontSize: 18, fontWeight: '800', marginTop: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
    priceMain: { color: TEXT, fontSize: 28, fontWeight: '900' },
    priceSlash: { color: '#8AA0BA', textDecorationLine: 'line-through', marginLeft: 8, marginBottom: 2 },
    pricePer: { color: '#6C7A89', marginLeft: 6, marginBottom: 2 },
    savingsText: { color: '#1A7F37', fontWeight: '700', fontSize: 12, marginTop: 4 },
    divider: { height: 1, backgroundColor: '#EEF3F9', marginVertical: 12 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    featureTick: { fontSize: 16, marginRight: 10 },
    featureCopy: { color: TEXT, fontSize: 13 },
    buyBtn: { marginTop: 14, backgroundColor: BLUE, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    buyText: { color: '#fff', fontWeight: '800' },
    buyBtnAlt: { marginTop: 14, backgroundColor: '#EEF4FB', height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    buyTextAlt: { color: TEXT, fontWeight: '800' },

    /* Compare hint */
    compareHint: { marginTop: 12, color: '#6C7A89', fontSize: 12 },
});

