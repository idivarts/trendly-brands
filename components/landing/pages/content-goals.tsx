import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import OfferCard from "@/components/landing/OfferCard";
import Stepper from "@/components/landing/Stepper";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { ExplainerConfig, useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import AppLayout from "@/layouts/app-layout";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { useMyNavigation } from "@/shared-libs/utils/router";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { ExplainerDynamic } from "../ExplainerDynamic";
import { SuccessCelebration } from "../SuccessCelebration";

// Content types a brand can plan to produce. Stored on the brand at
// preferences.contentVideoType (an existing field) — no new Firestore shape.
const CONTENT_TYPES = [
    "Reels / short video",
    "Static posts & carousels",
    "Stories",
    "UGC / creator content",
    "Long-form video",
];

// Monthly content volume. Stored at survey.collaborationValue (existing field)
// so we keep capturing the same "how much" signal under content framing.
const VOLUME_OPTIONS = [
    { key: "Low", title: "A few a month", desc: "Just getting consistent" },
    { key: "Medium", title: "Weekly", desc: "A steady content rhythm" },
    { key: "High", title: "Several a week", desc: "High-volume content engine" },
];

export default function ContentGoalsPage() {
    const router = useMyNavigation()
    const { selectedBrand, updateBrand } = useBrandContext()
    const { features: { contentGoals, hideAboutBrand, hideContentGoals, showDetailsOnMobile } } = useMyGrowthBook()
    const theme = useTheme();
    const colors = Colors(theme);

    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;

    const showDetails = isWide || showDetailsOnMobile;

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [volume, setVolume] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const goNext = () => {
        if (!hideAboutBrand)
            router.resetAndNavigate("/about-brand");
        else
            router.resetAndNavigate("/pricing-page");
    };

    // If this step is disabled via flag, or there's no brand to attach goals to,
    // bounce forward / back so users never get stranded on an orphaned step.
    useEffect(() => {
        if (hideContentGoals) {
            goNext();
            return;
        }
        if (!selectedBrand) {
            router.resetAndNavigate("/create-brand");
        }
    }, [hideContentGoals, selectedBrand?.id]);

    const toggleType = (name: string) => {
        setSelectedTypes((prev) =>
            prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        );
    };

    async function handleSubmit() {
        if (submitting) return;
        if (!selectedBrand) return;
        try {
            setSubmitting(true);

            analyticsLogEvent("content_goals", {
                contentTypes: selectedTypes,
                volume,
            })

            await updateBrand(selectedBrand.id, {
                preferences: {
                    ...selectedBrand.preferences,
                    contentVideoType: selectedTypes,
                },
                survey: {
                    ...selectedBrand.survey,
                    collaborationValue: volume,
                },
            })

            setShowSuccess(true)
        } finally {
            setSubmitting(false);
        }
    }

    function handleSkip() {
        if (submitting) return;
        goNext();
    }

    const explainerConfig: ExplainerConfig = contentGoals ? contentGoals : {
        kicker: "CONTENT SETUP",
        title: "What do you want to {create}?",
        description:
            "Tell us the kind of content you want to produce. We'll tailor your workspace — and suggest the right creators whenever you want extra hands.",
        items: [
            "Plan & schedule content in one calendar",
            "Create yourself or collaborate with creators",
            "Track everything in one place",
        ],
    }

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
                                viewBelowItems={contentGoals?.showOfferCard && <View style={{ paddingVertical: 16 }}><OfferCard /></View>}
                            />
                        </View>
                    )}

                    {/* Right: Form */}
                    <View style={[styles.formCard, showDetails && styles.formCardWide]}>
                        <Stepper count={3} total={5} />

                        <View style={styles.headerRow}>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={styles.formHeading}>Your content goals</Text>
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

                        {/* Content types (multi-select) */}
                        <View style={styles.field}>
                            <Text style={styles.label}>What content do you want to create? <Text style={styles.optionalLabel}>(optional)</Text></Text>
                            <View style={styles.chipWrap}>
                                {CONTENT_TYPES.map((name) => {
                                    const active = selectedTypes.includes(name);
                                    return (
                                        <Pressable
                                            key={name}
                                            onPress={() => toggleType(name)}
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

                        {/* Monthly volume (single-select) */}
                        <View style={styles.field}>
                            <Text style={styles.label}>How much content per month? <Text style={styles.optionalLabel}>(optional)</Text></Text>
                            <View style={styles.cardGrid}>
                                {VOLUME_OPTIONS.map((opt) => {
                                    const active = volume === opt.key;
                                    return (
                                        <Pressable
                                            key={opt.key}
                                            onPress={() => setVolume(opt.key)}
                                            style={[styles.volumeCard, active && styles.volumeCardSelected]}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: active }}
                                        >
                                            <Text style={[styles.volumeCardTitle, active && { color: colors.primaryDark }]}>{opt.title}</Text>
                                            <Text style={styles.volumeCardDesc}>{opt.desc}</Text>
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
                            accessibilityLabel="Continue"
                        >
                            <Text style={styles.ctaText}>{submitting ? "Please wait…" : "Continue"}</Text>
                            <Text style={styles.ctaArrow}>›</Text>
                        </Pressable>
                    </View>
                </View>

                {showDetails &&
                    <LandingFooter />}
            </ScrollView>
            <SuccessCelebration
                visible={showSuccess}
                message="Goals saved!"
                onDone={() => {
                    setShowSuccess(false);
                    goNext();
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

        // Content-type chips
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

        // Volume select cards
        cardGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
        },
        volumeCard: {
            flexBasis: "48%",
            borderWidth: 1,
            borderColor: colors.formBorder,
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 12,
            minHeight: 80,
        },
        volumeCardSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.ageCardSelectedBg,
            shadowColor: colors.primaryShadow,
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            ...Platform.select({ android: { elevation: 3 } }),
        },
        volumeCardTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
        volumeCardDesc: { fontSize: 12, color: colors.formLabel, marginTop: 4 },

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
