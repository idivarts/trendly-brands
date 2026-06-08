import OnboardingLoader from "@/components/onboarding/OnboardingLoader";
import WhatNextStep, { NextChoice } from "@/components/onboarding/WhatNextStep";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { AnimatePresence, MotiView } from "moti";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ── Validation (mirrors the existing onboarding form) ────────────────────────
const PHONE_REGEX =
    /^\+?[1-9]\d{0,2}[\s-]?(\(?\d{1,4}\)?[\s-]?)?\d{1,4}([\s-]?\d{1,4}){1,3}$/;
const WEBSITE_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

// ── Brand age (keys match BrandAgeSelect / backend buckets) ──────────────────
const AGE_OPTIONS = [
    { key: "JUST_STARTING", title: "Just starting", desc: "New or pre-launch brand" },
    { key: "LT_1", title: "Less than 1 year", desc: "Operating for under 12 months" },
    { key: "LT_5", title: "Less than 5 years", desc: "Established but growing" },
    { key: "GT_5", title: "5+ years", desc: "Well established brand" },
];

// Website is only asked for brands older than a year.
const isOverAYear = (age: string) => age === "LT_5" || age === "GT_5";

type StepKey = "name" | "about" | "phone" | "age" | "website";
type Phase = "form" | "loading" | "branch";

interface FormState {
    name: string;
    about: string;
    phone: string;
    age: string;
    website: string;
}

const TEXT_STEP_COPY: Record<
    Exclude<StepKey, "age">,
    {
        title: string;
        helper: string;
        placeholder: string;
        multiline?: boolean;
        keyboardType?: "default" | "phone-pad" | "url";
        optional?: boolean;
    }
> = {
    name: {
        title: "What's your brand called?",
        helper: "This is how you'll show up across Trendly.",
        placeholder: "e.g. Acme Coffee Co.",
    },
    about: {
        title: "Tell us about your brand",
        helper: "A sentence or two about what you do — the AI uses this to plan your content.",
        placeholder: "We roast small-batch specialty coffee for home brewers…",
        multiline: true,
    },
    phone: {
        title: "What's your contact number?",
        helper: "We'll use this to reach you about your account.",
        placeholder: "+1 555 123 4567",
        keyboardType: "phone-pad",
    },
    website: {
        title: "Do you have a website?",
        helper:
            "Optional — share it and the AI can learn more about your brand. Helps us tailor your plan.",
        placeholder: "https://yourbrand.com",
        keyboardType: "url",
        optional: true,
    },
};

const stepsFor = (age: string): StepKey[] =>
    isOverAYear(age)
        ? ["name", "about", "phone", "age", "website"]
        : ["name", "about", "phone", "age"];

const OnboardingFlow = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);
    const router = useMyNavigation();

    const {
        selectedBrand,
        allBrands,
        loading,
        createDraftBrand,
        updateBrand,
        finalizeBrand,
        setSelectedBrand,
    } = useBrandContext();

    const [phase, setPhase] = useState<Phase>("form");
    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState<FormState>({
        name: "",
        about: "",
        phone: "",
        age: "",
        website: "",
    });
    const [draftId, setDraftId] = useState<string | undefined>();
    const [busy, setBusy] = useState(false);

    const initOnce = useRef(false);
    const finalizedOnce = useRef(false);

    const steps = useMemo(() => stepsFor(form.age), [form.age]);
    const currentKey = steps[stepIndex];

    // ── Ensure a draft brand exists (resume an in-progress one if present) ────
    useEffect(() => {
        if (initOnce.current) return;
        if (loading) return;
        initOnce.current = true;

        (async () => {
            const existingDraft =
                selectedBrand?.onboardingComplete === false
                    ? selectedBrand
                    : allBrands.find((b) => b.onboardingComplete === false);

            if (existingDraft) {
                if (existingDraft.id !== selectedBrand?.id) {
                    setSelectedBrand(existingDraft, false);
                }
                setDraftId(existingDraft.id);
                // Seed whatever the draft already captured so a resumed flow
                // continues instead of starting blank.
                setForm((prev) => ({
                    name: existingDraft.name || prev.name,
                    about: existingDraft.profile?.about || prev.about,
                    phone: existingDraft.profile?.phone || prev.phone,
                    age: existingDraft.age || prev.age,
                    website: existingDraft.profile?.website || prev.website,
                }));
                return;
            }

            const ref = await createDraftBrand();
            if (!ref) {
                Toaster.error("Couldn't start onboarding");
                return;
            }
            setSelectedBrand(
                {
                    id: ref.id,
                    name: "",
                    creationTime: Date.now(),
                    onboardingComplete: false,
                } as Brand,
                false
            );
            setDraftId(ref.id);
        })();
    }, [loading, selectedBrand, allBrands, createDraftBrand, setSelectedBrand]);

    const setField = (key: StepKey, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    // ── Validate the current step, then advance (or kick off creation) ───────
    const validateCurrent = (next: FormState): string | null => {
        switch (currentKey) {
            case "name":
                if (!next.name.trim()) return "Please enter your brand name";
                return null;
            case "about":
                if (!next.about.trim()) return "Tell us a little about your brand";
                return null;
            case "phone":
                if (!next.phone.trim()) return "Please enter a contact number";
                if (!PHONE_REGEX.test(next.phone.trim()))
                    return "That doesn't look like a valid phone number";
                return null;
            case "age":
                if (!next.age) return "Please pick one";
                return null;
            case "website":
                if (next.website.trim() && !WEBSITE_REGEX.test(next.website.trim()))
                    return "That doesn't look like a valid website";
                return null;
            default:
                return null;
        }
    };

    const advance = (nextForm: FormState) => {
        const s = stepsFor(nextForm.age);
        if (stepIndex >= s.length - 1) {
            void startCreation(nextForm);
        } else {
            setStepIndex((i) => i + 1);
        }
    };

    const handleContinue = () => {
        const err = validateCurrent(form);
        if (err) {
            Toaster.error(err);
            return;
        }
        advance(form);
    };

    const handlePickAge = (key: string) => {
        const next = { ...form, age: key };
        setForm(next);
        // Typeform-style: auto-advance shortly after picking.
        setTimeout(() => advance(next), 260);
    };

    // ── Step 6: create the brand + organization behind the loader ────────────
    const startCreation = async (f: FormState) => {
        setPhase("loading");
        if (!draftId) {
            Toaster.error("Couldn't finish setting up your brand");
            setPhase("form");
            return;
        }
        if (finalizedOnce.current) return;
        finalizedOnce.current = true;

        try {
            const profile: Record<string, string> = {
                about: f.about.trim(),
                phone: f.phone.trim(),
            };
            if (f.website.trim()) profile.website = f.website.trim();

            await updateBrand(draftId, {
                name: f.name.trim(),
                age: f.age,
                profile,
            } as any);
            await finalizeBrand(draftId);

            // Optimistically flip onboardingComplete so the global resume-redirect
            // doesn't bounce us back before the Firestore snapshot lands.
            if (selectedBrand) {
                setSelectedBrand(
                    {
                        ...selectedBrand,
                        name: f.name.trim(),
                        onboardingComplete: true,
                    } as Brand,
                    false
                );
            }
            setPhase("branch");
        } catch {
            finalizedOnce.current = false;
            Toaster.error("Couldn't finish setting up your brand");
            setPhase("form");
        }
    };

    // ── Step 7: route into the chosen destination (seeded + sidebar set) ─────
    const handleChoice = async (choice: NextChoice) => {
        if (busy || !draftId) return;
        setBusy(true);
        // Keep the loader curtain up while we seed, so the destination only
        // appears once it's ready.
        setPhase("loading");

        try {
            if (choice === "strategy") {
                const res = await HttpWrapper.fetch("/api/ai/onboarding/strategy-init", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ brandId: draftId }),
                });
                const data = await res.json();
                router.resetAndNavigate({
                    pathname:
                        "/(main)/(drawer)/(tabs)/(content)/content-strategies/[strategyId]" as any,
                    params: {
                        strategyId: data.strategyId,
                        fromOnboarding: "1",
                        sidebar: "collapsed",
                    },
                });
            } else if (choice === "calendar") {
                await HttpWrapper.fetch("/api/ai/onboarding/calendar-init", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ brandId: draftId }),
                });
                router.resetAndNavigate({
                    pathname:
                        "/(main)/(drawer)/(tabs)/(content)/content-calendar" as any,
                    params: { fromOnboarding: "1", sidebar: "collapsed" },
                });
            } else if (choice === "content") {
                router.resetAndNavigate({
                    pathname: "/(main)/(drawer)/(tabs)/(content)/contents" as any,
                    params: { openCreate: "1", sidebar: "expanded" },
                });
            } else {
                router.resetAndNavigate({
                    pathname:
                        "/(main)/(drawer)/(tabs)/(content)/content-strategies" as any,
                    params: { sidebar: "expanded" },
                });
            }
        } catch {
            Toaster.error("Something went wrong — please try again");
            setBusy(false);
            setPhase("branch");
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    if (!draftId && phase === "form") {
        return (
            <AppLayout withWebPadding={false}>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            </AppLayout>
        );
    }

    const progress = (stepIndex + 1) / steps.length;

    const renderTextStep = (key: Exclude<StepKey, "age">) => {
        const copy = TEXT_STEP_COPY[key];
        return (
            <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{copy.title}</Text>
                <Text style={styles.stepHelper}>{copy.helper}</Text>
                <TextInput
                    style={[styles.input, copy.multiline && styles.inputMultiline]}
                    value={form[key]}
                    onChangeText={(t) => setField(key, t)}
                    placeholder={copy.placeholder}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType={copy.keyboardType ?? "default"}
                    autoFocus
                    multiline={copy.multiline}
                    autoCapitalize={key === "name" ? "words" : "none"}
                    onKeyPress={(e: any) => {
                        if (
                            Platform.OS === "web" &&
                            e?.nativeEvent?.key === "Enter" &&
                            !e?.nativeEvent?.shiftKey
                        ) {
                            e.preventDefault?.();
                            handleContinue();
                        }
                    }}
                />
                <Pressable
                    onPress={handleContinue}
                    style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                >
                    <Text style={styles.ctaText}>
                        {copy.optional && !form[key].trim() ? "Skip" : "Continue"}
                    </Text>
                    <FontAwesomeIcon icon={faArrowRight} size={14} color={colors.onPrimary} />
                </Pressable>
            </View>
        );
    };

    const renderAgeStep = () => (
        <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>How established is your brand?</Text>
            <Text style={styles.stepHelper}>
                This helps us better structure the platform for your brand's maturity.
            </Text>
            <View style={styles.ageGrid}>
                {AGE_OPTIONS.map((opt) => {
                    const selected = form.age === opt.key;
                    return (
                        <Pressable
                            key={opt.key}
                            onPress={() => handlePickAge(opt.key)}
                            style={[styles.ageCard, selected && styles.ageCardSelected]}
                        >
                            <Text
                                style={[
                                    styles.ageTitle,
                                    selected && styles.ageTitleSelected,
                                ]}
                            >
                                {opt.title}
                            </Text>
                            <Text style={[styles.ageDesc, selected && styles.ageDescSelected]}>
                                {opt.desc}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );

    return (
        <AppLayout withWebPadding={false}>
            <View style={styles.container}>
                {phase === "form" && (
                    <>
                        <View style={styles.progressTrack}>
                            <MotiView
                                style={styles.progressFill}
                                animate={{ width: `${progress * 100}%` }}
                                transition={{ type: "timing", duration: 300 }}
                            />
                        </View>
                        <View style={styles.formArea}>
                            <View style={[styles.card, xl && styles.cardDesktop]}>
                                <AnimatePresence exitBeforeEnter>
                                    <MotiView
                                        key={currentKey}
                                        style={styles.stepWrap}
                                        from={{ opacity: 0, translateY: 36 }}
                                        animate={{ opacity: 1, translateY: 0 }}
                                        exit={{ opacity: 0, translateY: -36 }}
                                        transition={{ type: "timing", duration: 320 }}
                                    >
                                        {currentKey === "age"
                                            ? renderAgeStep()
                                            : renderTextStep(currentKey)}
                                    </MotiView>
                                </AnimatePresence>
                            </View>
                        </View>
                    </>
                )}

                {phase === "loading" && (
                    <MotiView
                        style={styles.fill}
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "timing", duration: 400 }}
                    >
                        <OnboardingLoader
                            title={busy ? "Getting things ready" : "Building your space"}
                            messages={
                                busy
                                    ? [
                                          "Preparing your workspace…",
                                          "Setting up the AI…",
                                          "Almost ready…",
                                      ]
                                    : undefined
                            }
                        />
                    </MotiView>
                )}

                {phase === "branch" && (
                    <MotiView
                        style={styles.fill}
                        from={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "timing", duration: 500 }}
                    >
                        <WhatNextStep onSelect={handleChoice} disabled={busy} />
                    </MotiView>
                )}
            </View>
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        fill: { flex: 1 },
        centered: { flex: 1, alignItems: "center", justifyContent: "center" },
        progressTrack: {
            height: 5,
            backgroundColor: colors.tag,
            width: "100%",
            overflow: "hidden",
        },
        progressFill: {
            height: "100%",
            backgroundColor: colors.primary,
        },
        formArea: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        card: {
            width: "100%",
            maxWidth: 560,
        },
        cardDesktop: {
            backgroundColor: colors.card,
            borderRadius: 22,
            padding: 40,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 28,
            shadowOpacity: 0.1,
            elevation: 8,
        },
        stepWrap: {
            width: "100%",
        },
        stepBody: {
            gap: 14,
        },
        stepTitle: {
            fontSize: xl ? 28 : 23,
            fontWeight: "800",
            color: colors.text,
        },
        stepHelper: {
            fontSize: 15,
            lineHeight: 21,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 17,
            color: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        inputMultiline: {
            minHeight: 110,
            textAlignVertical: "top",
        },
        cta: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 8,
            marginTop: 6,
            paddingHorizontal: 22,
            paddingVertical: 13,
            borderRadius: 12,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        ctaPressed: { opacity: 0.8 },
        ctaText: {
            color: colors.onPrimary,
            fontSize: 16,
            fontWeight: "700",
        },
        ageGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 14,
            marginTop: 4,
        },
        ageCard: {
            flexBasis: "47%",
            flexGrow: 1,
            borderRadius: 14,
            padding: 18,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.06,
            elevation: 2,
        },
        ageCardSelected: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        ageTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
        },
        ageTitleSelected: {
            color: colors.onPrimary,
        },
        ageDesc: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 4,
        },
        ageDescSelected: {
            color: colors.onPrimary,
            opacity: 0.85,
        },
    });
}

export default OnboardingFlow;
