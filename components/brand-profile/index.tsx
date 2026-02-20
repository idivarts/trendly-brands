import { useTheme } from "@react-navigation/native";
import { useRef, useState } from "react";
import { Animated, Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Surface } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import BrandAge from "./BrandAge";
import BrandDetails from "./BrandDetails";
import BrandIndustry from "./BrandIndustry";

const { height: screenHeight } = Dimensions.get("window");
const CARD_MAX_WIDTH = 480;
const CARD_MIN_HEIGHT = Math.min(screenHeight * 0.6, 520);
const STEP_ANIM_DURATION = 280;

interface BrandProfileProps {
    action?: React.ReactNode;
    brandData: Partial<Brand>;
    setBrandData: React.Dispatch<React.SetStateAction<Partial<Brand>>>;
    setBrandWebImage: React.Dispatch<React.SetStateAction<File | null>>;
    type?: "create" | "update";
}

const BrandProfile: React.FC<BrandProfileProps> = ({
    action,
    brandData,
    setBrandData,
    setBrandWebImage,
    type = "update",
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

    return (
        <ScrollView
            contentContainerStyle={
                isCreate
                    ? { flexGrow: 1, paddingVertical: 24, paddingHorizontal: 16 }
                    : { paddingVertical: 40, paddingHorizontal: 16, alignItems: "center" as const }
            }
            showsVerticalScrollIndicator={false}
        >
            {isCreate && (
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
                        ? [styles.cardOuter, { maxWidth: CARD_MAX_WIDTH }]
                        : { width: "100%", maxWidth: CARD_MAX_WIDTH, gap: 24 }
                }
            >
                <Animated.View
                    style={
                        isCreate
                            ? [styles.cardWrap, { minHeight: CARD_MIN_HEIGHT, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]
                            : undefined
                    }
                >
                    {showSection(1) && (
                        <BrandDetails
                            brandData={brandData}
                            setBrandData={setBrandData}
                            setBrandWebImage={setBrandWebImage}
                            onNext={isCreate ? handleNext : undefined}
                        />
                    )}
                    {showSection(2) && (
                        <BrandAge
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onNext={isCreate ? handleNext : undefined}
                            onBack={isCreate ? handleBack : undefined}
                        />
                    )}
                    {showSection(3) && (
                        <BrandIndustry
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onBack={isCreate ? handleBack : undefined}
                        />
                    )}
                    {showSection(3) && action && (
                        <Surface
                            style={[styles.actionSurface, { backgroundColor: colors.card, marginTop: isCreate ? 24 : 8 }]}
                            elevation={1}
                        >
                            {action}
                        </Surface>
                    )}
                </Animated.View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: "rgba(128,128,128,0.35)",
    },
    stepDotActive: {
        width: 24,
        backgroundColor: "rgba(128,128,128,0.7)",
    },
    stepDotDone: {
        backgroundColor: "rgba(128,128,128,0.55)",
    },
    cardOuter: {
        flex: 1,
        width: "100%",
        alignSelf: "center",
    },
    cardWrap: {
        width: "100%",
        paddingHorizontal: 16,
    },
    actionSurface: {
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
    },
});

export default BrandProfile;
