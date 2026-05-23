import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { PLATFORMS } from "@/constants/ItemsList";
import { useBreakpoints } from "@/hooks";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { IAgencyHire } from "@/types/AgencyHire";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import StepLayout from "./StepLayout";

interface StepOneProps {
    hire: Partial<IAgencyHire>;
    setHire: React.Dispatch<React.SetStateAction<Partial<IAgencyHire>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepOne: React.FC<StepOneProps> = ({ hire, setHire, onNext, onBack }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl, width), [colors, xl, width]);

    const handleNext = () => {
        if (!hire.name?.trim()) {
            Toaster.error("Project name is required");
            return;
        }
        if (!hire.platforms?.length) {
            Toaster.error("Select at least one platform");
            return;
        }
        onNext();
    };

    return (
        <StepLayout
            step={1}
            title="Hire Agency"
            subtitle="Tell us what you'd like Trendly to do for you"
            onBack={onBack}
        >
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Project Name</Text>
                <TextInput
                    label="e.g. Summer Skincare Launch"
                    mode="outlined"
                    value={hire.name}
                    onChangeText={(text) => setHire((prev) => ({ ...prev, name: text }))}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionHint}>A brief overview of what you'd like to achieve</Text>
                <TextInput
                    label="What are you looking to achieve?"
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.multilineInput}
                    value={hire.description}
                    onChangeText={(text) => setHire((prev) => ({ ...prev, description: text }))}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platforms</Text>
                <Text style={styles.sectionHint}>Where would you like us to run this?</Text>
                <MultiSelectExtendable
                    buttonLabel="Add Platform"
                    closeOnSelect
                    initialMultiselectItemsList={PLATFORMS}
                    initialItemsList={PLATFORMS}
                    onSelectedItemsChange={(value) =>
                        setHire((prev) => ({ ...prev, platforms: value }))
                    }
                    selectedItems={hire.platforms || []}
                    theme={theme}
                />
            </View>

            <Button mode="contained" onPress={handleNext}>
                Next
            </Button>
        </StepLayout>
    );
};

export default StepOne;

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean, width: number) =>
    StyleSheet.create({
        section: {
            gap: 8,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        sectionHint: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        multilineInput: {
            minHeight: 100,
        },
    });
