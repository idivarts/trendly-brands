import CreateCollaboration from "@/components/create-collaboration";
import AICampaignCreation from "@/components/create-collaboration/AICampaignCreation";
import { AIGeneratedCampaignData } from "@/components/create-collaboration/types";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

const SKIP_AI_CREATION_KEY = "skipAICampaignCreation";

const CreateCollaborationScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [showAICreation, setShowAICreation] = useState(true);
    const [generatedAiData, setGeneratedAiData] = useState<AIGeneratedCampaignData | null>(null);

    const handleSkip = async () => {
        try {
            setShowAICreation(false);
        } catch (error) {
            console.error("Error saving skip choice:", error);
            setShowAICreation(false);
        }
    };

    const handleAskAi = async () => {
        try {
            setShowAICreation(true);
        } catch (error) {
            console.error("Error resetting AI creation state:", error);
            setShowAICreation(true);
        }
    };

    if (showAICreation) {
        return (
            <AppLayout>
                <AICampaignCreation
                    onSkip={handleSkip}
                    onGenerated={(aiData) => {
                        setGeneratedAiData(aiData);
                        setShowAICreation(false);
                    }}
                />
            </AppLayout>
        );
    }

    const askAiButton = showAICreation ? null : (
        <Pressable
            onPress={handleAskAi}
            style={({ pressed }) => [
                styles.askAiButton,
                pressed && styles.askAiButtonPressed,
            ]}
        >
            <Ionicons name="sparkles" size={16} color={colors.white} />
            <Text style={styles.askAiButtonText}>
                Ask AI
            </Text>
        </Pressable>
    );

    return (
        <AppLayout safeAreaEdges={["top", "right", "bottom", "left"]}>
            <CreateCollaboration headerRight={askAiButton} aiData={generatedAiData} />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        askAiButton: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            marginRight: 12,
        },
        askAiButtonPressed: {
            opacity: 0.85,
        },
        askAiButtonText: {
            color: colors.white,
            fontWeight: "600",
            marginLeft: 8,
        },
    });
}

export default CreateCollaborationScreen;
