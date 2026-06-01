import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { useTheme } from "@react-navigation/native";
import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { Surface } from "react-native-paper";

import BrandAge from "./BrandAge";
import BrandDetails from "./BrandDetails";
import BrandIndustry from "./BrandIndustry";

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
    const { xl, width } = useBreakpoints();
    const colors = useMemo(() => Colors(theme), [theme]);
    const styles = useMemo(() => createStyles(colors, xl, width), [colors, xl, width]);

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

    const TOTAL_STEPS = 3;

    const handleNext = () => {
        if (currentStep >= TOTAL_STEPS) return;
        runStepTransition("next", () => setCurrentStep((s) => s + 1));
    };

    const handleBack = () => {
        if (currentStep <= 1) return;
        runStepTransition("back", () => setCurrentStep((s) => s - 1));
    };

    const isCreate = type === "create";
    const showSection = (step: number) => !isCreate || currentStep === step;
    const usePlainLayout = isCreate && webOnboarding;
    const useTwoColumnForm = xl;

    useEffect(() => {
        if (webOnboarding && onStepChange) onStepChange(currentStep);
    }, [webOnboarding, currentStep, onStepChange]);

    const sectionProps = {
        brandData,
        setBrandData,
        setBrandWebImage,
        plainSection: usePlainLayout || useTwoColumnForm,
        compactLayout: useTwoColumnForm,
    };

    if (useTwoColumnForm) {
        const smallAction =
            action && isValidElement(action)
                ? cloneElement(action as React.ReactElement<{ size?: "small" | "medium" | "large" }>, { size: "small" })
                : action;

        return (
            <ScrollView
                contentContainerStyle={styles.scrollContentTwoCol}
                showsVerticalScrollIndicator={false}
            >
                {action && (
                    <View style={styles.actionTopBar}>
                        {smallAction}
                    </View>
                )}
                <View style={styles.twoColRow}>
                    <View style={styles.twoColLeft}>
                        <BrandDetails
                            {...sectionProps}
                            onNext={isCreate ? handleNext : undefined}
                        />
                    </View>
                    <View style={styles.twoColRight}>
                        <BrandAge
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onNext={isCreate ? handleNext : undefined}
                            onBack={isCreate ? handleBack : undefined}
                            plainSection
                            compactLayout
                        />
                        <BrandIndustry
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onBack={isCreate ? handleBack : undefined}
                            plainSection
                            compactLayout
                        />
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={
                isCreate
                    ? (usePlainLayout ? styles.scrollContentCreatePlain : styles.scrollContentCreate)
                    : styles.scrollContentUpdate
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
                            usePlainLayout ? styles.cardOuterCreateFullWidth : styles.cardOuterCreateMaxWidth,
                            usePlainLayout && styles.cardOuterPlain,
                        ]
                        : styles.cardOuterUpdate
                }
            >
                <Animated.View
                    style={[
                        styles.cardWrap,
                        isCreate && {
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }],
                        },
                        !isCreate && styles.cardWrapUpdate,
                        usePlainLayout && styles.cardWrapPlain,
                    ]}
                >
                    {showSection(1) && (
                        <BrandDetails
                            {...sectionProps}
                            onNext={isCreate ? handleNext : undefined}
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
                            <View style={[styles.actionSurface, styles.actionSurfacePlain, styles.actionSurfaceMarginTop]}>
                                {action}
                            </View>
                        ) : (
                            <Surface
                                style={[
                                    styles.actionSurface,
                                    styles.actionSurfaceCard,
                                    isCreate ? styles.actionSurfaceMarginTop : styles.actionSurfaceMarginTopUpdate,
                                ]}
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

function createStyles(
    colors: ReturnType<typeof Colors>,
    xl: boolean,
    width: number
) {
    const horizontalPadding = xl ? 32 : 16;
    const verticalPaddingCreate = xl ? 32 : 24;
    const verticalPaddingUpdate = xl ? 48 : 40;
    const cardMaxWidth = 480;
    const twoColGap = 24;
    const contentMaxWidth = Math.min(width - 48, 1000);

    return StyleSheet.create({
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
        scrollContentCreate: {
            flexGrow: 1,
            paddingVertical: verticalPaddingCreate,
            paddingHorizontal: horizontalPadding,
        },
        scrollContentCreatePlain: {
            flexGrow: 1,
            paddingVertical: verticalPaddingCreate,
            paddingHorizontal: 0,
        },
        scrollContentUpdate: {
            paddingVertical: verticalPaddingUpdate,
            paddingHorizontal: horizontalPadding,
            alignItems: "center",
        },
        scrollContentTwoCol: {
            paddingVertical: 24,
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: "center",
            width: "100%",
        },
        twoColRow: {
            flexDirection: "row",
            gap: twoColGap,
            alignItems: "flex-start",
        },
        twoColLeft: {
            flex: 1,
            minWidth: 0,
            gap: 20,
        },
        twoColRight: {
            flex: 1,
            minWidth: 0,
            gap: 100,
        },
        actionTopBar: {
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 16,
            width: "100%",
        },
        actionWrap: {
            marginTop: 8,
        },
        cardOuter: {
            flex: 1,
            width: "100%",
            alignSelf: "center",
        },
        cardOuterCreateMaxWidth: {
            maxWidth: cardMaxWidth,
        },
        cardOuterPlain: {
            alignSelf: "flex-start",
        },
        cardOuterCreateFullWidth: {
            maxWidth: "100%",
        },
        cardOuterUpdate: {
            width: "100%",
            maxWidth: cardMaxWidth,
            gap: 24,
        },
        cardWrap: {
            width: "100%",
            paddingHorizontal: horizontalPadding,
        },
        cardWrapUpdate: {
            gap: 24,
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
        actionSurfaceCard: {
            backgroundColor: colors.card,
        },
        actionSurfaceMarginTop: {
            marginTop: 24,
        },
        actionSurfaceMarginTopUpdate: {
            marginTop: 8,
        },
    });
}

export default BrandProfile;
