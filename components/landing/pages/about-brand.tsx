import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import OfferCard from "@/components/landing/OfferCard";
import Stepper from "@/components/landing/Stepper";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { ExplainerConfig, useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import AppLayout from "@/layouts/app-layout";
import { LANDING_BRAND_INDUSTRIES } from "@/shared-constants/preferences/brand-industry";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { useMyNavigation } from "@/shared-libs/utils/router";
import React, { useState } from "react";
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
const CREATE_BRAND_LINK = "https://brands.trendly.now/pre-signin?skip=1";

export default function BrandDetailPage() {
    const router = useMyNavigation()
    const { selectedBrand, updateBrand } = useBrandContext()
    const { features: { aboutBrand, showDetailsOnMobile } } = useMyGrowthBook()

    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    const showDetails = isWide || showDetailsOnMobile;

    const [about, setAbout] = useState("");
    const [website, setWebsite] = useState("");

    const [showSuccess, setShowSuccess] = useState(false)
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ brand?: string; phone?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const toggleIndustry = (name: string) => {
        setSelectedIndustries((prev) =>
            prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        );
    };

    async function handleSubmit() {
        if (submitting) return;
        if (!selectedBrand) return;
        try {
            setSubmitting(true);

            analyticsLogEvent("update_brand_profile", {
                about, website, selectedIndustries
            })

            await updateBrand(selectedBrand.id, {
                profile: {
                    ...selectedBrand.profile,
                    about: about,
                    website: website,
                    industries: selectedIndustries,
                }
            })

            setShowSuccess(true)
            // open(url);
        } finally {
            setSubmitting(false);
        }
    }

    function handleSkip() {
        if (submitting) return;
        // Go to next step without validating or sending optional data
        router.resetAndNavigate("/pricing-page")
    }

    // useEffect(() => {
    //     AuthApp.authStateReady().then(() => {
    //         if (!selectedBrand) {
    //             router.resetAndNavigate("/create-brand")
    //         }
    //     })
    // }, [selectedBrand])

    const explainerConfig: ExplainerConfig = aboutBrand ? aboutBrand : {
        kicker: "BRAND ONBOARDING",
        title: `Tell us about {<BRAND_NAME>}`,
        description: "Your brand profile is your influencer magnet. The more professional and appealing your brand looks here, the more influencers will want to promote your product — often at better rates. This is where you set the value of your brand, so make it count.",
        items: [
            "Get matched to niche influencers fast",
            "Transparent chats, contracts, and payouts",
            "Fraud protection and dispute assistance"
        ]
    }
    explainerConfig.title = explainerConfig.title.replace("<BRAND_NAME>", selectedBrand?.name || "your brand")

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
                                viewBelowItems={aboutBrand?.showOfferCard && <View style={{ paddingVertical: 16 }}><OfferCard /></View>}
                            />
                            {/* Visual */}
                            {/* <ImageBackground
                            source={{ uri: ONBOARD_IMG }}
                            style={styles.visual}
                            imageStyle={styles.visualImg}
                        >
                            <View style={styles.playBadge}>
                                <Text style={styles.playBadgeText}>Overview</Text>
                            </View>
                        </ImageBackground> */}
                        </View>
                    )}

                    {/* Right: Form */}
                    <View style={[styles.formCard, showDetails && styles.formCardWide]}>
                        <Stepper count={3} total={4} />

                        <View style={styles.headerRow}>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={styles.formHeading}>Brand Profile</Text>
                                <Text style={styles.formSub}>It takes less than a minute to get started.</Text>
                            </View>
                            <Pressable
                                onPress={handleSkip}
                                accessibilityRole="button"
                                accessibilityLabel="Skip this step"
                                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }]}
                            >
                                <Text style={styles.skipText}>Skip for now</Text>
                            </Pressable>
                        </View>


                        {/* About Brand (Optional) */}
                        <View style={styles.field}>
                            <Text style={styles.label}>About brand <Text style={{ color: "#6C7A89", fontWeight: "400" }}>(optional)</Text></Text>
                            <TextInput
                                value={about}
                                onChangeText={setAbout}
                                placeholder="Tell us a bit about your brand and what you sell"
                                multiline
                                textAlignVertical="top"
                                style={[styles.input, styles.textArea]}
                                accessibilityLabel="About brand"
                            />
                        </View>

                        {/* Brand Website (Optional) */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Brand website <Text style={{ color: "#6C7A89", fontWeight: "400" }}>(optional)</Text></Text>
                            <TextInput
                                value={website}
                                onChangeText={setWebsite}
                                placeholder="e.g., https://www.acme.com"
                                style={styles.input}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType={Platform.select({ ios: "url", android: "url", default: "url" }) as any}
                                accessibilityLabel="Brand website"
                            />
                        </View>

                        {/* Brand Industry (Optional, multi-select) */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Brand industry <Text style={{ color: "#6C7A89", fontWeight: "400" }}>(optional)</Text></Text>
                            <View style={styles.chipWrap}>
                                {LANDING_BRAND_INDUSTRIES.map((name) => {
                                    const active = selectedIndustries.includes(name);
                                    return (
                                        <Pressable
                                            key={name}
                                            onPress={() => toggleIndustry(name)}
                                            style={[styles.chip, active && styles.chipSelected]}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: active }}
                                        >
                                            <Text style={[styles.chipText, active && styles.chipTextSelected]}>{name}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting || !selectedBrand}
                            style={({ pressed }) => [
                                styles.cta,
                                (pressed || submitting) && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Get Started"
                        >
                            <Text style={styles.ctaText}>{submitting ? "Please wait…" : "Get Started"}</Text>
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
                message="Profile Updated!"
                onDone={() => {
                    setShowSuccess(false);
                    router.resetAndNavigate("/pricing-page")
                }}
            />
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
        gap: 12,
        ...Platform.select({ web: { maxWidth: 520 } }),
        ...Platform.select({ android: { elevation: 4 } }),
    },
    formCardWide: {
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 22,
        marginTop: 18,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    formHeading: { fontSize: 24, fontWeight: "800", color: TEXT },
    formSub: { marginTop: 6, color: "#6C7A89", fontSize: 13 },
    headerRow: {
        marginTop: 0,
        marginBottom: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    skipBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#E1E6EE",
        backgroundColor: "#F5FAFF",
    },
    skipText: {
        color: BLUE,
        fontWeight: "800",
        fontSize: 12,
    },
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

    // Age select cards
    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
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

    // Text area
    textArea: {
        height: 120,
        paddingTop: 12,
        paddingBottom: 12,
    },

    // Industry chips
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 6,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#E1E6EE",
        backgroundColor: "#FFFFFF",
    },
    chipSelected: {
        backgroundColor: BLUE,
        borderColor: BLUE,
    },
    chipText: { color: TEXT, fontSize: 12, fontWeight: "700" },
    chipTextSelected: { color: "#FFFFFF" },

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
});
