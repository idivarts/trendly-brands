import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import OfferCard from "@/components/landing/OfferCard";
import Stepper from "@/components/landing/Stepper";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { ExplainerConfig, useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import AppLayout from "@/layouts/app-layout";
import { IBrands } from "@/shared-libs/firestore/trendly-pro/models/brands";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { useMyNavigation } from "@/shared-libs/utils/router";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useTheme } from "@react-navigation/native";
import Colors from "@/shared-uis/constants/Colors";
import { ExplainerDynamic } from "../ExplainerDynamic";
import { SuccessCelebration } from "../SuccessCelebration";


const ONBOARD_IMG =
    "https://www.trendly.now/wp-content/uploads/2025/05/thumbnail-youtube-and-web-for-video.avif"; // placeholder visual
const AGE_OPTIONS = [
    { key: "JUST_STARTING", title: "Just starting", desc: "New or pre-launch brand" },
    { key: "LT_1", title: "Less than 1 year", desc: "Operating for under 12 months" },
    { key: "LT_5", title: "Less than 5 years", desc: "Established but growing" },
    { key: "GT_5", title: "5+ years", desc: "Well established brand" },
];


export default function CreateBrandPage() {
    const router = useMyNavigation()
    const { features: { createBrand: cJson, hideAboutBrand, hideContentGoals, showDetailsOnMobile } } = useMyGrowthBook()
    const { manager, session } = useAuthContext()
    const { createBrand, setSelectedBrand } = useBrandContext()
    const theme = useTheme();
    const colors = Colors(theme);

    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;

    const showDetails = isWide || showDetailsOnMobile;

    const [brandName, setBrandName] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{ brand?: string; phone?: string; brandAge?: string }>({});
    const [submitting, setSubmitting] = useState(false);
    const [brandAge, setBrandAge] = useState<string>("");
    const [showSuccess, setShowSuccess] = useState(false);

    function validate() {
        const e: { brand?: string; phone?: string; brandAge?: string } = {};
        if (!brandName || brandName.trim().length < 2) e.brand = "Please enter your brand name.";
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 15) e.phone = "Enter a valid phone number.";
        if (!brandAge) e.brandAge = "Please select your brand age.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (submitting) return;
        if (!validate()) return;
        try {
            analyticsLogEvent("create_brand", {
                brandName, phone, brandAge
            })
            setSubmitting(true);
            const brandObj: IBrands = {
                name: brandName,
                profile: {
                    phone: phone
                },
                age: brandAge,
                creationTime: Date.now()
            }
            const newId = await createBrand(brandObj)
            if (!newId) {
                Toaster.error("Something went wrong!", "Couldn't create your brand")
                return
            }
            setSelectedBrand({
                ...brandObj,
                id: newId
            })

            setShowSuccess(true);
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        Toaster.success("User successfully Register", "Proceed to create your brand")
        AuthApp.authStateReady().then(() => {
            if (!AuthApp.currentUser)
                router.resetAndNavigate("/get-started")
        })
    }, [])

    // --- Explainer config for left block ---
    const explainerConfig: ExplainerConfig = cJson ? cJson : {
        kicker: "BRAND ONBOARDING",
        title: "Create your {brand}",
        description:
            "Set up your brand's content workspace. Plan campaigns, manage your calendar, and bring in creators on demand — pay securely only when you finalize. No setup fees and no commissions.",
        items: [
            "Plan & schedule content in one calendar",
            "Transparent briefs, contracts, and payouts",
            "On-demand vetted creators when you need them",
        ],
        // image: ONBOARD_IMG,
    };

    const styles = useStyles(colors);

    return (
        <AppLayout>
            <ScrollView
                contentContainerStyle={styles.page}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {showDetails && <LandingHeader />}

                {/* Main Hero - Explainer (left) + Form (right) */}
                <View style={[styles.hero, isWide ? styles.heroRow : styles.heroCol]}>
                    {/* Left: Explainer */}
                    {showDetails && (
                        <View style={[isWide && styles.left, isWide ? { paddingRight: 90 } : {}]}>
                            <ExplainerDynamic
                                config={explainerConfig}
                                viewBelowItems={cJson?.showOfferCard && <View style={{ paddingVertical: 16, }}>
                                    <OfferCard />
                                </View>}
                            />
                        </View>
                    )}

                    {/* Right: Form */}
                    <View style={[styles.formCard, showDetails && styles.formCardWide]}>
                        <Stepper count={2} total={5} />

                        <View>
                            <Text style={styles.formHeading}>Create your brand</Text>
                            <Text style={styles.formSub}>It takes less than a minute to get started.</Text>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Brand name</Text>
                            <TextInput
                                value={brandName}
                                onChangeText={setBrandName}
                                placeholder="e.g., Acme Naturals"
                                style={[styles.input, !!errors.brand && styles.inputError]}
                                autoCapitalize="words"
                                autoCorrect={false}
                                accessibilityLabel="Brand name"
                            />
                            {!!errors.brand && <Text style={styles.error}>{errors.brand}</Text>}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Phone number</Text>
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g., 9876543210"
                                style={[styles.input, !!errors.phone && styles.inputError]}
                                keyboardType={Platform.select({ ios: "number-pad", android: "phone-pad", default: "numeric" }) as any}
                                accessibilityLabel="Phone number"
                            />
                            {!!errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
                        </View>
                        {/* Brand Age */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Brand age</Text>
                            <Text style={styles.ageHelp}>How established is your brand?</Text>
                            <View style={styles.cardGrid}>
                                {AGE_OPTIONS.map((opt) => {
                                    const active = brandAge === opt.key;
                                    return (
                                        <Pressable
                                            key={opt.key}
                                            onPress={() => setBrandAge(opt.key)}
                                            style={[styles.ageCard, active && styles.ageCardSelected]}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: active }}
                                        >
                                            <Text style={[styles.ageCardTitle, active && { color: colors.primaryDark }]}>{opt.title}</Text>
                                            <Text style={styles.ageCardDesc}>{opt.desc}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            {!!errors.brandAge && <Text style={styles.error}>{errors.brandAge}</Text>}
                        </View>


                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={({ pressed }) => [
                                styles.cta,
                                (pressed || submitting) && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Create brand"
                        >
                            <Text style={styles.ctaText}>{submitting ? "Please wait…" : "Create brand"}</Text>
                            <Text style={styles.ctaArrow}>›</Text>
                        </Pressable>

                        <Text style={styles.disclaimer}>
                            By continuing, you agree to receive updates about your brand setup on the
                            phone number provided.
                        </Text>
                    </View>
                </View>

                {showDetails &&
                    <LandingFooter />}
            </ScrollView>
            <SuccessCelebration
                visible={showSuccess}
                message="Brand created!"
                onDone={() => {
                    setShowSuccess(false);
                    if (!hideContentGoals)
                        router.resetAndNavigate("/content-goals");
                    else if (!hideAboutBrand)
                        router.resetAndNavigate("/about-brand");
                    else
                        router.resetAndNavigate("/pricing-page");
                }}
            />
        </AppLayout>
    );
}

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
        gap: 12,
        ...Platform.select({ web: { maxWidth: 520 } }),
        ...Platform.select({ android: { elevation: 4 } }),
    },
    formCardWide: {
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 22,
        marginTop: 18,
        shadowColor: colors.black,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
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

    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
    },
    ageHelp: { color: colors.formLabel, fontSize: 12, marginTop: 2 },
    ageCard: {
        flexBasis: "48%",
        borderWidth: 1,
        borderColor: colors.formBorder,
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
    },
    ageCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.ageCardSelectedBg,
        shadowColor: colors.primaryShadow,
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    ageCardTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
    ageCardDesc: { fontSize: 12, color: colors.formLabel, marginTop: 4 },

});
}
