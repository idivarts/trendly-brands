import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import Stepper from "@/components/landing/Stepper";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { ModelStatus } from "@/shared-libs/firestore/trendly-pro/models/status";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ImageBackground,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

const ONBOARD_IMG =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif"; // placeholder visual

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
    const { selectedBrand, updateBrand } = useBrandContext()
    const router = useMyNavigation()

    const [myBrand, setMyBrand] = useState(selectedBrand)
    const [loading, setLoading] = useState(false)
    const [link, setlink] = useState<number | undefined>(undefined)
    const [planLinks, setPlanLinks] = useState(["", ""])

    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    const [submitting, setSubmitting] = useState(false);

    const getPlanLinks = async () => {
        try {
            setLoading(true)
            const mPlanLinks = await Promise.all([
                HttpWrapper.fetch("/razorpay/create-subscription", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        brandId: selectedBrand?.id,
                        isGrowthPlan: true
                    })
                }).then(async r => ((await r.json()).link as string)),
                HttpWrapper.fetch("/razorpay/create-subscription", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        brandId: selectedBrand?.id,
                        isGrowthPlan: false
                    })
                }).then(async r => ((await r.json()).link as string))
            ])
            setPlanLinks(mPlanLinks)
            updateBrand(selectedBrand?.id || "", {
                paymentLinks: mPlanLinks
            })
            if (link != undefined) {
                window.open(mPlanLinks[link], '_blank')
            }
        } catch (e) {
            Toaster.error("Something went wrong!!", "Was not able to fetch the plans")
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (selectedBrand) {
            if ((!selectedBrand.paymentLinks || selectedBrand.paymentLinks.length != 2))
                getPlanLinks()
            else
                setPlanLinks(selectedBrand.paymentLinks)
        }
    }, [selectedBrand])

    useEffect(() => {
        if (selectedBrand?.id) {
            const bSnapShop = onSnapshot(doc(collection(FirestoreDB, "brands"), selectedBrand.id), (data) => {
                setMyBrand({
                    ...data.data() as any,
                    id: data.id
                })
            }, (err) => {
                Toaster.error("Something went wrong!", "Cant load your brand")
            })

            return () => bSnapShop()
        }
    }, [selectedBrand])

    const handleFocus = async () => {
        Console.log("Handling Focus")
        if (!myBrand)
            return
        if (myBrand.billing?.status == ModelStatus.Accepted)
            router.resetAndNavigate("/explore-influencers")
    }

    useEffect(() => {
        handleFocus()
    }, [myBrand])


    const handleSubmit = (isGrowthPlan: boolean) => {
        if (submitting) return;
        try {
            setSubmitting(true);
            const link = isGrowthPlan ? 0 : 1
            setlink(link)
            if (planLinks[link]) {
                window.open(planLinks[link], "_blank")
            }
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
                <LandingHeader />

                {/* Main Hero - Explainer (left) + Form (right) */}
                <View style={[styles.hero, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left: Explainer */}
                    <View style={[isWide && styles.left, isWide ? { paddingRight: 90 } : {}]}>
                        <Text style={styles.kicker}>PRICING & PLANS</Text>
                        <Text style={styles.title}>
                            Choose your <Text style={styles.titleAccent}>plan</Text> for {selectedBrand?.name || "your brand"}
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
                        <Text style={styles.subtitle}>
                            Still Confused? Look into the <Text style={{ fontWeight: '800' }}>demo of the platform</Text> below to know what you get out of it!
                        </Text>

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
                        <Stepper count={4} total={4} />

                        <Text style={styles.formHeading}>Choose your plan</Text>
                        <Text style={styles.formSub}>Your trial continues. Pay nothing today.</Text>

                        {/* Plans */}
                        <View style={styles.plansWrap}>
                            {/* Yearly (Preferred) */}
                            <View style={[styles.planCard, styles.planPreferred]}>
                                <View style={styles.planTagPreferred}><Text style={styles.planTagText}>Preferred</Text></View>
                                <Text style={styles.planName}>Business (Yearly)</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceMain}>₹417</Text>
                                    <Text style={styles.priceSlash}>₹499</Text>
                                    <Text style={styles.pricePer}>/month</Text>
                                    <Text style={styles.pricePer}>when paid yearly</Text>
                                </View>
                                <Text style={styles.savingsText}>Billed ₹4,999/year — Save 30% vs monthly</Text>
                                <View style={styles.divider} />
                                {YEARLY_FEATURES.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Text style={styles.featureTick}>✓</Text>
                                        <Text style={styles.featureCopy}>{f}</Text>
                                    </View>
                                ))}
                                <Pressable onPress={() => handleSubmit(false)} style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
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
                                <Pressable onPress={() => handleSubmit(true)} style={({ pressed }) => [styles.buyBtnAlt, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                                    <Text style={styles.buyTextAlt}>Start monthly — Pay nothing today</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Comparison note */}
                        <Text style={styles.compareHint}>Both plans include full access, verified influencer hiring, unlimited invites, and fraud protection. Yearly plan adds priority support and faster dispute handling.</Text>
                    </View>
                </View>

                <LandingFooter />
            </ScrollView>

            {link != undefined && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: "white",
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: 16,
                    gap: 16
                }}>
                    <Text style={{ fontSize: 32, lineHeight: 32 * 1.5, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>Return Back here once Payment is done</Text>
                    <ActivityIndicator size={"large"} />
                    <Text style={{ fontSize: 18, lineHeight: 18 * 1.5, marginTop: 24, textAlign: "center" }}>
                        Redirecting you to the payment page. Please wait...
                    </Text>

                    {!loading && planLinks[link] && (
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 44 }}>
                            <Text style={{ fontSize: 16 }}>
                                If you didn’t redirect automatically
                            </Text>
                            <Text
                                style={{ fontSize: 16, color: 'blue', textDecorationLine: 'underline' }}
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        window.open(planLinks[link], '_blank')
                                    }
                                }}
                            >
                                Click Here
                            </Text>
                        </View>
                    )}
                </View>
            )}
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

    /* Hero layout */
    hero: {
        borderRadius: 24,
        marginTop: 0,
    },
    heroRow: {
        backgroundColor: "#F8FBFF",
        padding: 28,
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

