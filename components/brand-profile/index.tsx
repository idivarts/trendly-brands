import { useTheme } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useRef, useState } from "react";
import { Animated, Dimensions, Platform, StyleSheet, View } from "react-native";
import { Surface } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import BrandAge from "./BrandAge";
import BrandDetails from "./BrandDetails";
import BrandIndustry from "./BrandIndustry";

const { height: screenHeight } = Dimensions.get("window");
const CARD_HEIGHT = screenHeight * 0.75;
const CARD_SPACING = CARD_HEIGHT * 0.55; // Tighter premium stack spacing

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
    const scrollAnim = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        const nextStep = currentStep + 1;
        if (nextStep <= 3) {
            setCurrentStep(nextStep);
            Animated.spring(scrollAnim, {
                toValue: -(nextStep - 1) * CARD_SPACING,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        }
    };

    const handleBack = () => {
        const prevStep = currentStep - 1;
        if (prevStep >= 1) {
            setCurrentStep(prevStep);
            Animated.spring(scrollAnim, {
                toValue: -(prevStep - 1) * CARD_SPACING,
                useNativeDriver: true,
                tension: 80,
                // friction: 12,
            }).start();
        }
    };

    const getCardStyle = (index: number) => {
        // Hide cards that are more than 1 step away (only show adjacent cards)
        if (Math.abs(index - currentStep) > 1) {
            return {
                opacity: 0,
                transform: [{ translateY: 0 }],
            };
        }

        const inputRange = [
            -(index) * CARD_SPACING,
            -(index - 1) * CARD_SPACING,
            -(index - 2) * CARD_SPACING,
        ];

        return {
            transform: [
                {
                    translateY: scrollAnim.interpolate({
                        inputRange,
                        outputRange: [
                            CARD_SPACING * 0.5,
                            0,
                            -CARD_SPACING * 0.5,
                        ],
                        extrapolate: "clamp",
                    }),
                },
                { perspective: 1000 },
                {
                    rotateX: scrollAnim.interpolate({
                        inputRange,
                        outputRange: ["-25deg", "0deg", "25deg"],
                        extrapolate: "clamp",
                    }),
                },
                {
                    scale: scrollAnim.interpolate({
                        inputRange,
                        outputRange: [0.85, 1, 0.85],
                        extrapolate: "clamp",
                    }),
                },
            ],
            opacity: scrollAnim.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: "clamp",
            }),
            zIndex: scrollAnim.interpolate({
                inputRange,
                outputRange: [1, 10, 1],
                extrapolate: "clamp",
            }),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: scrollAnim.interpolate({
                inputRange,
                outputRange: [0.1, 0.25, 0.1],
                extrapolate: "clamp",
            }),
            shadowRadius: scrollAnim.interpolate({
                inputRange,
                outputRange: [10, 25, 10],
                extrapolate: "clamp",
            }),
            elevation: 10,
        };
    };

    const cardContainerStyle = StyleSheet.create({
        card: {
            position: "absolute",
            width: "100%",
            paddingHorizontal: 16,
            height: CARD_HEIGHT,
        },
    });

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', paddingVertical: 40 }}>
            <Animated.View style={[cardContainerStyle.card, getCardStyle(1), { pointerEvents: currentStep === 1 ? 'auto' : 'none' }]}>
                {currentStep !== 1 && Platform.OS !== 'web' ? (
                    <BlurView intensity={30} style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <View style={{ opacity: 0.6 }}>
                            <BrandDetails
                                brandData={brandData}
                                setBrandData={setBrandData}
                                setBrandWebImage={setBrandWebImage}
                                onNext={handleNext}
                                onBack={currentStep > 1 ? handleBack : undefined}
                            />
                        </View>
                    </BlurView>
                ) : (
                    <View style={currentStep !== 1 ? { opacity: 0.3 } : {}}>
                        <BrandDetails
                            brandData={brandData}
                            setBrandData={setBrandData}
                            setBrandWebImage={setBrandWebImage}
                            onNext={handleNext}
                            onBack={currentStep > 1 ? handleBack : undefined}
                        />
                    </View>
                )}
            </Animated.View>

            <Animated.View style={[cardContainerStyle.card, getCardStyle(2), { pointerEvents: currentStep === 2 ? 'auto' : 'none' }]}>
                {currentStep !== 2 && Platform.OS !== 'web' ? (
                    <BlurView intensity={30} style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <View style={{ opacity: 0.6 }}>
                            <BrandAge
                                brandData={brandData}
                                setBrandData={setBrandData}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        </View>
                    </BlurView>
                ) : (
                    <View style={currentStep !== 2 ? { opacity: 0.3 } : {}}>
                        <BrandAge
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    </View>
                )}
            </Animated.View>

            <Animated.View style={[cardContainerStyle.card, getCardStyle(3), { pointerEvents: currentStep === 3 ? 'auto' : 'none' }]}>
                {currentStep !== 3 && Platform.OS !== 'web' ? (
                    <BlurView intensity={30} style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <View style={{ opacity: 0.6 }}>
                            <BrandIndustry
                                brandData={brandData}
                                setBrandData={setBrandData}
                                onBack={handleBack}
                            />
                        </View>
                    </BlurView>
                ) : (
                    <View style={currentStep !== 3 ? { opacity: 0.3 } : {}}>
                        <BrandIndustry
                            brandData={brandData}
                            setBrandData={setBrandData}
                            onBack={handleBack}
                        />
                        {currentStep === 3 && !!action && (
                            <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card, marginTop: 24 }} elevation={1}>
                                {action}
                            </Surface>
                        )}
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

export default BrandProfile;
