import { useTheme } from "@react-navigation/native";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Surface } from "react-native-paper";

import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import BrandAge from "./BrandAge";
import BrandDetails from "./BrandDetails";
import BrandIndustry from "./BrandIndustry";

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
    const scrollViewRef = useRef<ScrollView>(null);
    const cardRefs = useRef<{ [key: number]: View | null }>({});

    const handleNext = (step: number) => {
        setCurrentStep(step);
        // Scroll to the next card
        setTimeout(() => {
            cardRefs.current[step]?.measureLayout(
                scrollViewRef.current as any,
                (x, y) => {
                    scrollViewRef.current?.scrollTo({ y: y - 16, animated: true });
                },
                () => {}
            );
        }, 100);
    };

    return (
        <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 24, paddingBottom: 32 }}
        >
            <View ref={(ref) => (cardRefs.current[1] = ref)}>
                <BrandDetails
                    brandData={brandData}
                    setBrandData={setBrandData}
                    setBrandWebImage={setBrandWebImage}
                    onNext={() => handleNext(2)}
                />
            </View>

            <View ref={(ref) => (cardRefs.current[2] = ref)}>
                <BrandAge
                    brandData={brandData}
                    setBrandData={setBrandData}
                    onNext={() => handleNext(3)}
                />
            </View>

            <View ref={(ref) => (cardRefs.current[3] = ref)}>
                <BrandIndustry
                    brandData={brandData}
                    setBrandData={setBrandData}
                />
            </View>

            {!!action && (
                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
                    {action}
                </Surface>
            )}
        </ScrollView>
    );
};

export default BrandProfile;
