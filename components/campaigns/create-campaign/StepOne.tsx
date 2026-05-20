import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { PLATFORMS } from "@/constants/ItemsList";
import { useBreakpoints } from "@/hooks";
import { MultiSelectExtendable } from "@/shared-uis/components/multiselect-extendable";
import Colors from "@/shared-uis/constants/Colors";
import { ICampaign } from "@/types/Campaign";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import StepLayout from "./StepLayout";

interface StepOneProps {
    campaign: Partial<ICampaign>;
    setCampaign: React.Dispatch<React.SetStateAction<Partial<ICampaign>>>;
    onNext: () => void;
    onBack: () => void;
}

const StepOne: React.FC<StepOneProps> = ({ campaign, setCampaign, onNext, onBack }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const handleNext = () => {
        if (!campaign.name?.trim()) {
            Toaster.error("Campaign name is required");
            return;
        }
        if (!campaign.platforms?.length) {
            Toaster.error("Select at least one platform");
            return;
        }
        onNext();
    };

    return (
        <StepLayout step={1} title="Create Campaign" subtitle="Tell us what your campaign is about" onBack={onBack}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Campaign Name</Text>
                <TextInput
                    label="e.g. Summer Skincare Launch"
                    mode="outlined"
                    value={campaign.name}
                    onChangeText={(text) => setCampaign((prev) => ({ ...prev, name: text }))}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionHint}>A brief overview of what this campaign aims to achieve</Text>
                <TextInput
                    label="What is this campaign about?"
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.multilineInput}
                    value={campaign.description}
                    onChangeText={(text) => setCampaign((prev) => ({ ...prev, description: text }))}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platforms</Text>
                <Text style={styles.sectionHint}>Where will this campaign run?</Text>
                <MultiSelectExtendable
                    buttonLabel="Add Platform"
                    closeOnSelect
                    initialMultiselectItemsList={PLATFORMS}
                    initialItemsList={PLATFORMS}
                    onSelectedItemsChange={(value) =>
                        setCampaign((prev) => ({ ...prev, platforms: value }))
                    }
                    selectedItems={campaign.platforms || []}
                    theme={theme}
                />
            </View>

            <Button mode="contained" onPress={handleNext}>
                Next
            </Button>
        </StepLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
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

export default StepOne;
