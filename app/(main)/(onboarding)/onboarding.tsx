import OnboardingLoader from "@/components/onboarding/OnboardingLoader";
import PhoneNumberInput from "@/components/onboarding/PhoneNumberInput";
import WhatNextStep, { NextChoice } from "@/components/onboarding/WhatNextStep";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { Country, getDefaultCountry } from "@/utils/countries";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { AnimatePresence, MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ── Validation (mirrors the existing onboarding form) ────────────────────────
// The country dial code is captured separately by PhoneNumberInput, so here we
// only validate the national-number digits (typical range across countries).
const countNationalDigits = (national: string) => national.replace(/[^\d]/g, "").length;
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
        helper: "We'll use this to reach you about your account. Your country code is set automatically — just add your number.",
        placeholder: "98765 43210",
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
    const styles = useStyles(colors, xl);
    const router = useMyNavigation();
    // When started from an Organization page, create the brand under that org.
    const { orgId } = useLocalSearchParams<{ orgId?: string }>();

    const { createBrand, setSelectedBrand, brands, allBrands } = useBrandContext();

    const [phase, setPhase] = useState<Phase>("form");

    // Reverse case: a manager who already belongs to a FINALIZED brand has no
    // business sitting on the onboarding flow unless they're intentionally
    // creating a brand for a specific organization (signalled by the `orgId`
    // param). When they land on onboarding with a finalized brand but no
    // `orgId`, select a default brand (if none is selected yet) and send them to
    // the default app page.
    useEffect(() => {
        console.log("Onboarding Variables:", orgId, brands, phase);

        if (orgId) return;
        if (brands.length === 0) return;
        if (phase !== "form") return;

        router.resetAndNavigate(
            "/(main)/(drawer)/(tabs)/(content)/content-strategies" as any
        );
    }, [orgId, brands, phase]);

    const [stepIndex, setStepIndex] = useState(0);
    const [form, setForm] = useState<FormState>({
        name: "",
        about: "",
        phone: "",
        age: "",
        website: "",
    });
    const [brandId, setBrandId] = useState<string | undefined>();
    const [busy, setBusy] = useState(false);
    // Holds the in-flight "provision the brand" work so the branch step can kick
    // it off in the background and the chosen action can await the same promise
    // (see prepareBrand / handleChoice).
    const prepareRef = useRef<Promise<string | null> | null>(null);
    // Live mirror of the context brand list, so background waiters read fresh
    // values without re-subscribing on every list change.
    const allBrandsRef = useRef(allBrands);
    useEffect(() => {
        allBrandsRef.current = allBrands;
    }, [allBrands]);
    // Country for the phone field — auto-detected from the device locale/timezone
    // so the dial code is pre-filled. `form.phone` holds only the national digits.
    const [phoneCountry, setPhoneCountry] = useState<Country>(() => getDefaultCountry());
    const fullPhone = (national: string) => `+${phoneCountry.dialCode} ${national.trim()}`.trim();

    // KeyboardAvoidingView's `padding` math uses a parent-relative frame against a
    // screen-space keyboard, so the centered step (which sits below the progress
    // bar) needs its on-screen Y as keyboardVerticalOffset — otherwise the keyboard
    // overlaps the input. Measure it and feed it back. iOS-only — Android/web use
    // `height` behaviour + system resize.
    const kbRootRef = useRef<View>(null);
    const [kbVerticalOffset, setKbVerticalOffset] = useState(0);
    const measureKbOffset = useCallback(() => {
        if (Platform.OS !== "ios") return;
        kbRootRef.current?.measureInWindow((_x, y) => {
            if (typeof y === "number" && Number.isFinite(y)) {
                setKbVerticalOffset((prev) => (Math.abs(prev - y) > 1 ? y : prev));
            }
        });
    }, []);

    const steps = useMemo(() => stepsFor(form.age), [form.age]);
    const currentKey = steps[stepIndex];

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
            case "phone": {
                const digits = countNationalDigits(next.phone);
                if (!digits) return "Please enter a contact number";
                if (digits < 6 || digits > 14)
                    return "That doesn't look like a valid phone number";
                return null;
            }
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
            setPhase("branch");
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

    // Create + finalize the brand on demand (only once), using the form data
    // collected during the form phase. Brand creation is entirely backend-side
    // now — we get back the new id, fetch the persisted doc from Firestore,
    // and seed selectedBrand from it. Returns the brand id, or null on failure.
    const ensureBrand = async (): Promise<string | null> => {
        if (brandId) return brandId;

        const profile: Record<string, string> = {
            about: form.about.trim(),
            phone: fullPhone(form.phone),
        };
        if (form.website.trim()) profile.website = form.website.trim();

        const newId = await createBrand({
            name: form.name.trim(),
            age: form.age,
            profile,
            country: phoneCountry.iso2,
            ...(orgId ? { organizationId: orgId } : {}),
        } as any);
        if (!newId) return null;

        setBrandId(newId);

        const snap = await getDoc(doc(FirestoreDB, "brands", newId));
        if (snap.exists()) {
            setSelectedBrand({ ...(snap.data() as Brand), id: newId }, false);
        }
        return newId;
    };

    // The brand list is populated by a Firestore subscription, so after the
    // brand is created there's a short window before it lands in the context's
    // list. ensureBrand seeds selectedBrand immediately, but the brands array
    // may lag — wait for it (fail-open after a timeout) so brand-scoped screens
    // never mount against a list that's missing the brand we just made.
    const waitForBrandInList = (id: string, timeoutMs = 6000): Promise<void> =>
        new Promise((resolve) => {
            const startedAt = Date.now();
            const check = () => {
                if (allBrandsRef.current.some((b) => b.id === id)) return resolve();
                if (Date.now() - startedAt >= timeoutMs) return resolve();
                setTimeout(check, 100);
            };
            check();
        });

    // Kicks off (and de-dupes) the full "make the brand ready" work: create +
    // finalize the brand, seed selectedBrand, and wait for it to show up in the
    // live brand list. Started in the background the moment the user reaches the
    // branch step, so the actual choice resolves instantly — or just awaits this
    // same promise if it's still in flight. The promise is cached so concurrent
    // callers share one run; on failure it's dropped so a retry can re-run.
    const prepareBrand = (): Promise<string | null> => {
        if (prepareRef.current) return prepareRef.current;
        const run = (async (): Promise<string | null> => {
            const id = await ensureBrand();
            if (!id) return null;
            await waitForBrandInList(id);
            return id;
        })();
        prepareRef.current = run;
        run
            .then((id) => {
                if (!id) prepareRef.current = null;
            })
            .catch(() => {
                prepareRef.current = null;
            });
        return run;
    };

    // As soon as the user lands on the branch step, start provisioning the brand
    // in the background. If they pick a destination before it finishes,
    // handleChoice awaits this same promise; if it's already done, the choice
    // proceeds immediately.
    useEffect(() => {
        if (phase !== "branch") return;
        void prepareBrand();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Step 7: route into the chosen destination (seeded + sidebar set) ─────
    const handleChoice = async (choice: NextChoice) => {
        if (busy) return;
        setBusy(true);
        // Keep the loader curtain up while we provision + seed, so the
        // destination only appears once it's ready.
        setPhase("loading");

        try {
            // Awaits the background prep started when we entered the branch step
            // (or starts + awaits it if the user was somehow faster). Resolves
            // only once the brand exists AND is present in the live brand list.
            const id = await prepareBrand();
            if (!id) {
                Toaster.error("Couldn't finish setting up your brand");
                setBusy(false);
                setPhase("branch");
                return;
            }

            if (choice === "strategy") {
                const res = await HttpWrapper.fetch("/api/ai/onboarding/strategy-init", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ brandId: id }),
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
                    body: JSON.stringify({ brandId: id }),
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
    const progress = (stepIndex + 1) / steps.length;

    const renderTextStep = (key: Exclude<StepKey, "age">) => {
        const copy = TEXT_STEP_COPY[key];
        return (
            <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{copy.title}</Text>
                <Text style={styles.stepHelper}>{copy.helper}</Text>
                {key === "phone" ? (
                    <PhoneNumberInput
                        country={phoneCountry}
                        onChangeCountry={setPhoneCountry}
                        nationalNumber={form.phone}
                        onChangeNationalNumber={(t) => setField("phone", t)}
                        onSubmit={handleContinue}
                        autoFocus
                    />
                ) : (
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
                )}
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
                        <View ref={kbRootRef} style={styles.fill} onLayout={measureKbOffset}>
                            <KeyboardAvoidingView
                                style={styles.fill}
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                keyboardVerticalOffset={kbVerticalOffset}
                            >
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
                            </KeyboardAvoidingView>
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
                            title="Getting things ready"
                            messages={[
                                "Preparing your workspace…",
                                "Setting up the AI…",
                                "Almost ready…",
                            ]}
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
