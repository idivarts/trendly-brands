import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import OfferCard from "@/components/landing/OfferCard";
import Stepper from "@/components/landing/Stepper";
import PlanWrapper from "@/components/paywall/plans/PlanWrapper";
import BrandSwitcher, { OpenBrandSwitcher } from "@/components/ui/brand-switcher";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { ExplainerConfig, useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import AppLayout from "@/layouts/app-layout";
import { IOrgBilling } from "@/shared-libs/firestore/trendly-pro/models/organizations";
import { ModelStatus } from "@/shared-libs/firestore/trendly-pro/models/status";
import { Console } from "@/shared-libs/utils/console";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { ExplainerDynamic } from "../ExplainerDynamic";


export default function PricingPage() {
    const { selectedBrand, updateBrand, brands } = useBrandContext()
    const router = useMyNavigation()
    const { features: { trialDays, moneyBackGuarantee, limitedTimeDiscount, pricingPage, businessFeatures, growthFeatures }, discountPercentage } = useMyGrowthBook()
    const theme = useTheme();
    const colors = Colors(theme);

    const [myBrand, setMyBrand] = useState(selectedBrand)
    const [orgBilling, setOrgBilling] = useState<IOrgBilling | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [link, setlink] = useState<number | undefined>(undefined)
    const [planLinks, setPlanLinks] = useState(["", ""])

    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;

    const [submitting, setSubmitting] = useState(false);

    const plans = {
        growth: {
            amount: 499,
            finalAmount: Math.round(499 * (100 - discountPercentage()) / 100),
            frequency: "month"
        },
        business: {
            amount: Math.round(4999 / 12),
            finalAmount: Math.round(4999 * (100 - discountPercentage()) / (12 * 100)),
        }
    }

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
    }, [selectedBrand?.id])

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

    // Subscribe to the parent org's billing — billing moved Brand -> Org and is
    // the basis for the "already subscribed, bounce to /discover" redirect.
    useEffect(() => {
        const orgId = myBrand?.organizationId
        if (!orgId) {
            setOrgBilling(undefined)
            return
        }
        const unsub = onSnapshot(doc(FirestoreDB, "organizations", orgId), (snap) => {
            const data = snap.data() as { billing?: IOrgBilling } | undefined
            setOrgBilling(data?.billing)
        })
        return () => unsub()
    }, [myBrand?.organizationId])

    const handleFocus = async () => {
        Console.log("Handling Focus")
        if (!myBrand) return
        if (orgBilling?.status == ModelStatus.Accepted)
            router.resetAndNavigate("/discover")
    }

    useEffect(() => {
        handleFocus()
    }, [myBrand, orgBilling])


    const handleSubmit = (isGrowthPlan: boolean) => {
        if (submitting) return;
        try {
            analyticsLogEvent("selected_plan", {
                isGrowthPlan,
                discountPercentage: discountPercentage()
            })
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

    const explainerConfig: ExplainerConfig = pricingPage ? pricingPage : {
        kicker: "PRICING & PLANS",
        title: `Chose your {plan} for <BRAND_NAME>`
    }
    explainerConfig.title = explainerConfig.title.replace("<BRAND_NAME>", selectedBrand?.name || "your brand")

    const styles = useStyles(colors);

    return (
        <AppLayout>
            <ScrollView
                contentContainerStyle={styles.page}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <LandingHeader>
                    {brands.length > 1 &&
                        <View style={{ flex: 1, alignItems: "flex-start", justifyContent: "center", marginLeft: 16 }}>
                            <Pressable
                                onPress={() => {
                                    OpenBrandSwitcher.next(undefined);
                                }}
                            >
                                <View style={styles.brandDropdown}>
                                    <Text style={styles.brandName}>
                                        {selectedBrand?.name ?? "Brand"}
                                    </Text>
                                    {/* Quick switcher (if available on layout) */}
                                    <BrandSwitcher />
                                </View>
                            </Pressable>
                        </View>}
                </LandingHeader>


                {/* Main Hero - Explainer (left) + Form (right) */}
                <View style={[styles.hero, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left: Explainer */}
                    <View style={[isWide && styles.left, isWide ? { paddingRight: 90 } : {}]}>
                        <ExplainerDynamic
                            config={explainerConfig}
                            viewBelowItems={<><View style={styles.reasonsBox}>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 12 }}>
                                    {discountPercentage() > 0 &&
                                        <View style={styles.discountPill}>
                                            <Text style={styles.discountText}>Today only: Flat {limitedTimeDiscount}% OFF</Text>
                                        </View>}
                                    {trialDays > 0 &&
                                        <View style={styles.discountPill}>
                                            <Text style={styles.discountText}>{trialDays} days free trial</Text>
                                        </View>}
                                    {moneyBackGuarantee > 0 &&
                                        <View style={styles.discountPill}>
                                            <Text style={styles.discountText}>{moneyBackGuarantee} days Money-Back Guarantee</Text>
                                        </View>}
                                </View>
                                {trialDays > 0 &&
                                    <View style={styles.reasonItem}>
                                        <Text style={styles.pointIcon}>🛡️</Text>
                                        <Text style={styles.reasonText}>We only collect payment info now — you won't be charged until your trial ends.</Text>
                                    </View>}
                                <View style={styles.reasonItem}>
                                    <Text style={styles.pointIcon}>↩️</Text>
                                    <Text style={styles.reasonText}>Cancel anytime during trial in one tap — no questions asked.</Text>
                                </View>
                                {moneyBackGuarantee > 0 &&
                                    <View style={styles.reasonItem}>
                                        <Text style={styles.pointIcon}>💯</Text>
                                        <Text style={styles.reasonText}>{moneyBackGuarantee}‑day money‑back guarantee after your first payment.</Text>
                                    </View>}
                                <View style={styles.noticeRow}>
                                    <Text style={styles.noticeText}>Skip today and the discount won't apply later.</Text>
                                </View>
                            </View>
                                {pricingPage?.showOfferCard && <View style={{ paddingVertical: 16 }}>
                                    <OfferCard />
                                </View>}
                            </>}
                        />
                        {/* Trust / Reasons */}

                        {/* <Text style={styles.subtitle}>
                            Still Confused? Look into the <Text style={{ fontWeight: '800' }}>demo of the platform</Text> below to know what you get out of it!
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
                        {/* <ImageBackground
                            source={{ uri: ONBOARD_IMG }}
                            style={styles.visual}
                            imageStyle={styles.visualImg}
                        >
                            <View style={styles.playBadge}>
                                <Text style={styles.playBadgeText}>Plans</Text>
                            </View>
                        </ImageBackground> */}
                    </View>

                    {/* Right: Form */}
                    <View style={styles.formCard}>
                        <Stepper count={5} total={5} />

                        <Text style={styles.formHeading}>Choose your plan</Text>
                        <Text style={styles.formSub}>Your trial continues. Pay nothing today.</Text>

                        {/* Plans */}
                        <PlanWrapper verticallyStacked={true} />

                        {/* Comparison note */}
                        <Text style={styles.compareHint}>Both plans include full access to content planning & management, plus on-demand creator collaborations, unlimited invites, and fraud protection. Yearly plan adds priority support and faster dispute handling.</Text>
                    </View>
                </View>

                <LandingFooter />
            </ScrollView>

            {
                link != undefined && (
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: '100%',
                        justifyContent: 'center',
                        backgroundColor: colors.background,
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: 16,
                        gap: 16
                    }}>
                        <Text style={{ fontSize: 32, lineHeight: 32 * 1.5, fontWeight: 600, marginBottom: 16, textAlign: "center", color: colors.text }}>Return Back here once Payment is done</Text>
                        <ActivityIndicator size={"large"} />
                        <Text style={{ fontSize: 18, lineHeight: 18 * 1.5, marginTop: 24, textAlign: "center", color: colors.text }}>
                            Redirecting you to the payment page. Please wait...
                        </Text>

                        {!loading && planLinks[link] && (
                            <View style={{ flexDirection: "row", gap: 12, marginTop: 44 }}>
                                <Text style={{ fontSize: 16 }}>
                                    If you didn’t redirect automatically
                                </Text>
                                <Text
                                    style={{ fontSize: 16, color: colors.primary, textDecorationLine: 'underline' }}
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
                )
            }
        </AppLayout >
    );
}

/* --------- Styles --------- */
function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        page: {
            paddingHorizontal: 24,
            paddingTop: Platform.select({ web: 36, default: 24 }),
            paddingBottom: 48,
            backgroundColor: colors.background,
            maxWidth: 1300,
            alignSelf: "center",
            width: "100%",
        },

        hero: {
            borderRadius: 24,
            marginTop: 0,
        },
        heroRow: {
            backgroundColor: colors.formBg,
            padding: 28,
            flexDirection: "row",
            alignItems: "center",
        },
        heroCol: {
            flexDirection: "column",
        },

        left: {
            flex: 1.3,
            alignSelf: "flex-start"
        },
        kicker: {
            color: colors.primaryMid,
            fontSize: 12,
            letterSpacing: 1.4,
            fontWeight: "700",
            marginBottom: 8,
        },
        title: {
            color: colors.text,
            fontSize: 48,
            lineHeight: 62,
            fontWeight: "600",
            marginTop: 4,
        },
        titleAccent: {
            color: colors.primary,
            textDecorationLine: "underline",
            textDecorationColor: colors.textDecorationLight,
            textDecorationStyle: "solid",
        },
        subtitle: {
            marginTop: 18,
            marginBottom: 14,
            color: colors.subtitleGray,
            fontSize: 16,
            lineHeight: 24,
            maxWidth: 640,
        },
        points: { marginTop: 8, gap: 10 },
        pointItem: { flexDirection: "row", alignItems: "center" },
        pointIcon: { fontSize: 18, marginRight: 10 },
        pointText: { color: colors.text, fontSize: 14 },

        visual: {
            width: "100%",
            aspectRatio: 16 / 9,
            borderRadius: 20,
            overflow: "hidden",
            justifyContent: "flex-end",
            marginTop: 18,
            backgroundColor: colors.visualBg,
            shadowColor: colors.black,
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            ...Platform.select({ android: { elevation: 6 } }),
        },
        visualImg: { resizeMode: "cover" },
        playBadge: {
            alignSelf: "flex-start",
            margin: 12,
            backgroundColor: colors.playBadgeBg,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
        },
        playBadgeText: { color: colors.primaryDark, fontWeight: "800" },

        formCard: {
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: 16,
            paddingVertical: 22,
            paddingHorizontal: 22,
            marginTop: 18,
            ...Platform.select({ web: { maxWidth: 520 } }),
            shadowColor: colors.black,
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            ...Platform.select({ android: { elevation: 4 } }),
        },
        formHeading: { fontSize: 24, fontWeight: "800", color: colors.text },
        formSub: { marginTop: 6, color: colors.formLabel, fontSize: 13 },
        field: { marginTop: 16 },
        label: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 6 },
        input: {
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.formBorder,
            paddingHorizontal: 14,
            backgroundColor: colors.formBgInput,
            color: colors.text,
        },
        inputError: { borderColor: colors.errorBorder },
        error: { color: colors.red, marginTop: 6, fontSize: 12 },
        disclaimer: { color: colors.formLabel, marginTop: 12, fontSize: 12 },

        cta: {
            marginTop: 18,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 22,
            height: 48,
            borderRadius: 999,
            backgroundColor: colors.primary,
            shadowColor: colors.primaryShadow,
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            ...Platform.select({ android: { elevation: 6 } }),
        },
        ctaText: {
            color: colors.onPrimary,
            fontSize: 16,
            fontWeight: "700",
        },
        ctaArrow: {
            color: colors.onPrimary,
            fontSize: 22,
            marginLeft: 10,
            marginTop: -2,
        },

        reasonsBox: { marginTop: 8, backgroundColor: colors.formBg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.reasonsBoxBorder },
        discountPill: { alignSelf: 'flex-start', backgroundColor: colors.discountPillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 8 },
        discountText: { color: colors.white, fontWeight: '800', fontSize: 12 },
        reasonItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
        reasonText: { color: colors.text, fontSize: 13, lineHeight: 18, flex: 1 },
        noticeRow: { marginTop: 10 },
        noticeText: { color: colors.red, fontSize: 14, fontWeight: '700' },

        plansWrap: { marginTop: 16, gap: 16 },
        planCard: { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.formBorder, padding: 16, shadowColor: colors.black, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, ...Platform.select({ android: { elevation: 1 } }) },
        planPreferred: { borderColor: colors.primary, shadowOpacity: 0.08, ...Platform.select({ android: { elevation: 2 } }) },
        planTagPreferred: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
        planTagText: { color: colors.white, fontSize: 11, fontWeight: '800' },
        planName: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
        priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
        priceMain: { color: colors.text, fontSize: 28, fontWeight: '900' },
        priceSlash: { color: colors.priceSlashColor, textDecorationLine: 'line-through', marginLeft: 8, marginBottom: 2 },
        pricePer: { color: colors.formLabel, marginLeft: 6, marginBottom: 2 },
        savingsText: { color: colors.savingsGreen, fontWeight: '700', fontSize: 12, marginTop: 4 },
        divider: { height: 1, backgroundColor: colors.planCardDivider, marginVertical: 12 },
        featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
        featureTick: { fontSize: 16, marginRight: 10 },
        featureCopy: { color: colors.text, fontSize: 13 },
        buyBtn: { marginTop: 14, backgroundColor: colors.primary, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
        buyText: { color: colors.white, fontWeight: '800' },
        buyBtnAlt: { marginTop: 14, backgroundColor: colors.surface, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
        buyTextAlt: { color: colors.text, fontWeight: '800' },

        compareHint: { marginTop: 12, color: colors.formLabel, fontSize: 12 },

        brandDropdown: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.formBorder,
            backgroundColor: colors.background,
            shadowColor: colors.black,
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            ...Platform.select({ android: { elevation: 2 }, web: { cursor: 'pointer' } }),
        },
        brandName: {
            fontSize: 18,
            fontWeight: '700',
            paddingVertical: 6,
            marginRight: 6,
            color: colors.text,
        },
    });
}