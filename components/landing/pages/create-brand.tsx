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
import Toaster from "@/shared-uis/components/toaster/Toaster";
import React, { useEffect, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View
} from "react-native";
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
    const { features: { createBrand: cJson, hideAboutBrand } } = useMyGrowthBook()
    const { manager, session } = useAuthContext()
    const { createBrand, setSelectedBrand } = useBrandContext()

    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

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
                isBillingDisabled: false,
                creationTime: Date.now()
            }
            const brand = await createBrand(brandObj)
            if (!brand) {
                Toaster.error("Something went wrong!", "Couldn't create your brand")
                return
            }
            setSelectedBrand({
                ...brandObj,
                id: brand.id
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
            "Start hiring verified influencers without middlemen. Post a collaboration, pick applications you like, and pay securely when you finalize. No setup fees and no commissions, just direct connections that work.",
        items: [
            "Get matched to niche influencers fast",
            "Transparent chats, contracts, and payouts",
            "Fraud protection and dispute assistance",
        ],
        // image: ONBOARD_IMG,
    };

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
                        <ExplainerDynamic
                            config={explainerConfig}
                            viewBelowItems={<View style={{ paddingVertical: 16, marginTop: 12 }}>
                                <OfferCard />
                            </View>}
                        />
                    </View>

                    {/* Right: Form */}
                    <View style={styles.formCard}>
                        <Stepper count={2} total={4} />

                        <Text style={styles.formHeading}>Create your brand</Text>
                        <Text style={styles.formSub}>It takes less than a minute to get started.</Text>

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
                                            <Text style={[styles.ageCardTitle, active && { color: "#12324F" }]}>{opt.title}</Text>
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

                <LandingFooter />
            </ScrollView>
            <SuccessCelebration
                visible={showSuccess}
                message="Brand created!"
                onDone={() => {
                    setShowSuccess(false);
                    if (hideAboutBrand)
                        router.resetAndNavigate("/pricing-page");
                    else
                        router.resetAndNavigate("/about-brand");
                }}
            />
        </AppLayout>
    );
}

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

    // Age select cards
    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
    },
    ageHelp: { color: "#6C7A89", fontSize: 12, marginTop: 2 },
    ageCard: {
        flexBasis: "48%",
        borderWidth: 1,
        borderColor: "#E1E6EE",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
    },
    ageCardSelected: {
        borderColor: BLUE,
        backgroundColor: "#F0F6FF",
        shadowColor: "#2B5C8F",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    ageCardTitle: { fontSize: 14, fontWeight: "800", color: TEXT },
    ageCardDesc: { fontSize: 12, color: "#6C7A89", marginTop: 4 },

});
