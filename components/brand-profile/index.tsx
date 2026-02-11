import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView } from "react-native";
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

    const handleNext = () => {
        setCurrentStep((prev) => prev + 1);
    };

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 24, paddingBottom: 32 }}
        >
            {currentStep === 1 && (
                <BrandDetails
                    brandData={brandData}
                    setBrandData={setBrandData}
                    setBrandWebImage={setBrandWebImage}
                    onNext={handleNext}
                />
            )}

            {currentStep === 2 && (
                <BrandAge
                    brandData={brandData}
                    setBrandData={setBrandData}
                    onNext={handleNext}
                />
            )}

            {currentStep === 3 && (
                <BrandIndustry
                    brandData={brandData}
                    setBrandData={setBrandData}
                />
            )}

            {currentStep === 3 && !!action && (
                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: colors.card }} elevation={1}>
                    {action}
                </Surface>
            )}
        </ScrollView>
    );
};

export default BrandProfile;
