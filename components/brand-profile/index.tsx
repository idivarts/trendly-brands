import { useTheme } from "@react-navigation/native";
import { useEffect, useRef, useState, useMemo } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { Surface } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import { getConstrainedHeight } from "@/shared-libs/contexts/mobile-layout-context.provider";
import { Brand } from "@/types/Brand";
import BrandAge from "./BrandAge";
import BrandDetails from "./BrandDetails";
import BrandIndustry from "./BrandIndustry";

const screenHeight = getConstrainedHeight();
const CARD_MAX_WIDTH = 480;
const CARD_MIN_HEIGHT = Math.min(screenHeight * 0.6, 520);
const STEP_ANIM_DURATION = 280;

interface BrandProfileProps {
    action?: React.ReactNode;
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    setBrandWebImage: React.Dispatch<React.SetStateAction<File | null>>;
    type?: "create" | "update";
    /** Web-only: no card, report step for sidebar, plain sections */
    webOnboarding?: boolean;
    onStepChange?: (step: number) => void;
}

const BrandProfile: React.FC<BrandProfileProps> = ({
    action,
    brandData,
    setBrandData,
    setBrandWebImage,
    type = "update",
    webOnboarding = false,
    onStepChange,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [currentStep, setCurrentStep] = useState(1);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const runStepTransition = (direction: "next" | "back", onComplete: () => void) => {
        const slideDistance = 16;
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: STEP_ANIM_DURATION * 0.4,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: direction === "next" ? -slideDistance : slideDistance,
                duration: STEP_ANIM_DURATION * 0.4,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onComplete();
            slideAnim.setValue(direction === "next" ? slideDistance : -slideDistance);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: STEP_ANIM_DURATION * 0.6,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: STEP_ANIM_DURATION * 0.6,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const handleNext = () => {
        if (currentStep >= 3) return;
        runStepTransition("next", () => setCurrentStep((s) => s + 1));
    };

    const handleBack = () => {
        if (currentStep <= 1) return;
        runStepTransition("back", () => setCurrentStep((s) => s - 1));
    };

    const isCreate = type === "create";
    const showSection = (step: number) => !isCreate || currentStep === step;
    const usePlainLayout = isCreate && webOnboarding;

    useEffect(() => {
        if (webOnboarding && onStepChange) onStepChange(currentStep);
    }, [webOnboarding, currentStep, onStepChange]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                stepRow: {
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                },
                stepDot: {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.stepDotInactive,
                },
                stepDotActive: {
                    width: 24,
                    backgroundColor: colors.stepDotActive,
                },
                stepDotDone: {
                    backgroundColor: colors.stepDotDone,
                },
                cardOuter: {
                    flex: 1,
                    width: "100%",
                    alignSelf: "center",
                },
                cardOuterPlain: {
                    alignSelf: "flex-start",
                },
                cardWrap: {
                    width: "100%",
                    paddingHorizontal: 16,
                },
                cardWrapPlain: {
                    paddingHorizontal: 0,
                },
                actionSurface: {
                    borderRadius: 16,
                    padding: 16,
                    marginTop: 24,
                },
                actionSurfacePlain: {
                    borderRadius: 0,
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                },
            }),
        [colors]
    );

    return (
        <ScrollView
            contentContainerStyle={
                isCreate
                    ? { flexGrow: 1, paddingVertical: 24, paddingHorizontal: webOnboarding ? 0 : 16 }
                    : { paddingVertical: 40, paddingHorizontal: 16, alignItems: "center" as const }
            }
            showsVerticalScrollIndicator={false}
        >
            {isCreate && !webOnboarding && (
                <View style={styles.stepRow}>
                    {[1, 2, 3].map((step) => (
                        <View
                            key={step}
                            style={[
                                styles.stepDot,
                                currentStep === step && styles.stepDotActive,
                                currentStep > step && styles.stepDotDone,
                            ]}
                        />
                    ))}
                </View>
            )}

            <View
                style={
                    isCreate
                        ? [
                            styles.cardOuter,
                            { maxWidth: webOnboarding ? "100%" : CARD_MAX_WIDTH },
                            usePlainLayout && styles.cardOuterPlain,
                        ]
                        : { width: "100%", maxWidth: CARD_MAX_WIDTH, gap: 24 }
                }
            >
                <Animated.View
                    style={
                        isCreate
                            ? [
                                styles.cardWrap,
                                { minHeight: webOnboarding ? undefined : CARD_MIN_HEIGHT, opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
                                usePlainLayout && styles.cardWrapPlain,
                            ]
                            : [styles.cardWrap, { gap: 24 }]
                    }
                >
                    {showSection(1) && (
                        <BrandDetails
                            brandData={brandData}
                            setBrandData={setBrandData}
                            setBrandWebImage={setBrandWebImage}
                            onNext={isCreate ? handleNext : undefined}
                            plainSection={usePlainLayout}
                        />
                    )}
                    {showSection(2) && (
                        <BrandAge
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onNext={isCreate ? handleNext : undefined}
                            onBack={isCreate ? handleBack : undefined}
                            plainSection={usePlainLayout}
                        />
                    )}
                    {showSection(3) && (
                        <BrandIndustry
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onBack={isCreate ? handleBack : undefined}
                            plainSection={usePlainLayout}
                        />
                    )}
                    {showSection(3) && action && (
                        usePlainLayout ? (
                            <View style={[styles.actionSurface, styles.actionSurfacePlain, { marginTop: 24 }]}>
                                {action}
                            </View>
                        ) : (
                            <Surface
                                style={[styles.actionSurface, { backgroundColor: colors.card, marginTop: isCreate ? 24 : 8 }]}
                                elevation={1}
                            >
                                {action}
                            </Surface>
                        )
                    )}
                </Animated.View>
            </View>
        </ScrollView>
    );
};

export default BrandProfile;
