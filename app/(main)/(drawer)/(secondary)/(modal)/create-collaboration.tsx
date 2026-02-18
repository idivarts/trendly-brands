import CreateCollaboration from "@/components/create-collaboration";
import AICampaignCreation from "@/components/create-collaboration/AICampaignCreation";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";

const SKIP_AI_CREATION_KEY = "skipAICampaignCreation";

const CreateCollaborationScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const params = useLocalSearchParams();
    const [showAICreation, setShowAICreation] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [generatedAiData, setGeneratedAiData] = useState<any>(null);

    useEffect(() => {
        const loadAICreationState = async () => {
            try {
                const savedSkipChoice = await AsyncStorage.getItem(SKIP_AI_CREATION_KEY);
                setShowAICreation(savedSkipChoice !== "true");
            } catch (error) {
                console.error("Error loading AI creation state:", error);
                setShowAICreation(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadAICreationState();
    }, []);

    const handleSkip = async () => {
        try {
            await AsyncStorage.setItem(SKIP_AI_CREATION_KEY, "true");
            setShowAICreation(false);
        } catch (error) {
            console.error("Error saving skip choice:", error);
            setShowAICreation(false);
        }
    };

    const handleAskAi = async () => {
        try {
            await AsyncStorage.setItem(SKIP_AI_CREATION_KEY, "false");
            setShowAICreation(true);
        } catch (error) {
            console.error("Error resetting AI creation state:", error);
            setShowAICreation(true);
        }
    };

    if (isLoading) {
        return null;
    }

    if (showAICreation) {
        return (
            <AICampaignCreation
                onSkip={handleSkip}
                onGenerated={(aiData) => {
                    setGeneratedAiData(aiData);
                    setShowAICreation(false);
                }}
            />
        );
    }

    const askAiButton = showAICreation ? null : (
        <Pressable
            onPress={handleAskAi}
            style={({ pressed }) => [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    marginRight: 12,
                },
                pressed && { opacity: 0.85 },
            ]}
        >
            <Ionicons name="sparkles" size={16} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: "600", marginLeft: 8 }}>
                Ask AI
            </Text>
        </Pressable>
    );

    return (
        <AppLayout>
            <CreateCollaboration headerRight={askAiButton} aiData={generatedAiData} />
        </AppLayout>
    );
};

export default CreateCollaborationScreen;
