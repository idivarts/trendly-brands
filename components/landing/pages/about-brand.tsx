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
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import React, { useMemo, useState } from "react";
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
const CREATE_BRAND_LINK = "https://brands.trendly.now/pre-signin?skip=1";

export default function BrandDetailPage() {
    const router = useMyNavigation()
    const { selectedBrand, updateBrand } = useBrandContext()
    const { features: { aboutBrand, showDetailsOnMobile } } = useMyGrowthBook()
    const theme = useTheme();
    const colors = Colors(theme);

    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;

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
        description: "Your brand profile powers everything Trendly creates for you — the richer it is, the better your content and your creator matches. This is where you set the value of your brand, so make it count.",
        items: [
            "Plan & schedule content in one calendar",
            "Transparent briefs, contracts, and payouts",
            "On-demand vetted creators when you need them"
        ]
    }
    explainerConfig.title = explainerConfig.title.replace("<BRAND_NAME>", selectedBrand?.name || "your brand")

    const styles = useMemo(() => useStyles(colors), [colors]);

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
                        <Stepper count={4} total={5} />

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
                            <Text style={styles.label}>About brand <Text style={styles.optionalLabel}>(optional)</Text></Text>
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
                            <Text style={styles.label}>Brand website <Text style={styles.optionalLabel}>(optional)</Text></Text>
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
                            <Text style={styles.label}>Brand industry <Text style={styles.optionalLabel}>(optional)</Text></Text>
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

    /* Hero layout */
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

    /* Left */
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

    /* Visual under explainer */
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

    /* Form */
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
        borderColor: colors.formBorder,
        backgroundColor: colors.skipBtnBg,
    },
    skipText: {
        color: colors.primary,
        fontWeight: "800",
        fontSize: 12,
    },
    field: { marginTop: 16 },
    label: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 6 },
    optionalLabel: { color: colors.formLabel, fontWeight: "400" },
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

    // Age select cards
    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
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
        borderColor: colors.formBorder,
        backgroundColor: colors.background,
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: { color: colors.text, fontSize: 12, fontWeight: "700" },
    chipTextSelected: { color: colors.onPrimary },

    /* CTA reused */
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
});
}
