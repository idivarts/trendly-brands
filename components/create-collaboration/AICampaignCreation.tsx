import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import SlowLoader from "@/shared-uis/components/SlowLoader";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import stylesFn from "@/styles/create-collaboration/AICampaignCreation.styles";
import { resetAndNavigate } from "@/utils/router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AICampaignCreationProps {
    onSkip: () => void;
    onGenerated?: (aiData: any) => void;
}

export default function AICampaignCreation({ onSkip, onGenerated }: AICampaignCreationProps) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = stylesFn(colors);
    const { lg, xl } = useBreakpoints();
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const { selectedBrand } = useBrandContext();
    const generatingMessages = [
        "Understanding your campaign brief...",
        "Drafting a campaign strategy...",
        "Matching goals with ideal creators...",
        "Refining deliverables and budget...",
        "Finalizing your campaign draft...",
    ];

    const quickActions = [
        {
            icon: "sparkles",
            label: "Product Launch",
            prompt: "I need 5 influencers on Instagram to create reels and posts for a new product launch. Budget is 10000 to 25000 per influencer. Content should be in English.",
        },
        {
            icon: "people",
            label: "Brand Awareness",
            prompt: "I need 10 lifestyle influencers on Instagram to create posts and stories for brand awareness campaign. Budget is 5000 to 15000 per influencer. Content should be in English and Hindi.",
        },
        {
            icon: "trending-up",
            label: "Seasonal Campaign",
            prompt: "I need 8 fashion influencers on Instagram to create reels and stories for a seasonal summer collection. Budget is 8000 to 20000 per influencer. Content should be in English.",
        },
        {
            icon: "heart",
            label: "User Generated Content",
            prompt: "I need 15 micro-influencers on Instagram to create authentic posts and stories showcasing customer experiences. Budget is 3000 to 8000 per influencer. Content should be in English and Hindi.",
        },
    ];

    const handleQuickAction = (actionPrompt: string) => {
        setPrompt(actionPrompt);
        // handleGenerate(actionPrompt);
    };

    const handleBack = () => {
        resetAndNavigate("/discover");
    };

    const handleGenerate = async (text?: string) => {
        const promptText = text || prompt;
        if (!promptText.trim()) return;

        setIsGenerating(true);

        Console.log("Sending prompt to API:", promptText);

        try {
            const response = await HttpWrapper.fetch("/api/collabs/collaborations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: promptText,
                    brandId: selectedBrand?.id,
                }),
            });

            if (!response.ok) {
                throw response;
            }


            const aiData = await response.json();
            Console.log("AI Generated Data:", aiData);

            // Navigate to create collaboration with AI-generated data
            // Encode the data as a query parameter
            onGenerated?.(aiData);
        } catch (error: any) {
            Console.error("Failed to generate campaign:");
            Console.error(error);

            // Try to extract error message from API response
            let errorMessage = "Failed to generate campaign. Please try again.";

            if (error && typeof error.json === 'function') {
                try {
                    const errorData = await error.json();
                    Console.log("API Error Response:", errorData);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                    Console.error("Failed to parse error response");
                    Console.error(parseError);
                }
            } else if (error && error.message) {
                errorMessage = error.message;
            }

            Console.log("Displaying error to user:", errorMessage);
            Toaster.error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    lg && styles.scrollContentWide,
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Top Row: Back (mobile only) + Skip */}
                <View style={styles.topRow}>
                    {!xl ? (
                        <Pressable
                            onPress={handleBack}
                            style={({ pressed }) => [
                                styles.backButton,
                                pressed && styles.backButtonPressed,
                            ]}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </Pressable>
                    ) : (
                        <View style={styles.topRowSpacer} />
                    )}
                    <Pressable
                        onPress={onSkip}
                        style={({ pressed }) => [
                            styles.skipButton,
                            pressed && styles.skipButtonPressed,
                        ]}
                    >
                        <Text style={styles.skipButtonText}>Skip</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                    </Pressable>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="sparkles" size={32} color={colors.white} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.greeting}>Hi there!</Text>
                    <Text style={styles.title}>Let AI help you create your campaign</Text>
                    <Text style={styles.subtitle}>
                        Describe your campaign goals and our AI will help you craft the perfect brief
                    </Text>
                </View>

                {/* Prompt Input */}
                <View style={[styles.promptContainer, lg && styles.promptContainerWide]}>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="bulb-outline"
                            size={20}
                            color={colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Describe your campaign idea..."
                            placeholderTextColor={colors.textSecondary}
                            value={prompt}
                            onChangeText={setPrompt}
                            multiline
                            numberOfLines={3}
                            onSubmitEditing={() => handleGenerate()}
                        />
                        <Pressable
                            onPress={() => handleGenerate()}
                            disabled={!prompt.trim() || isGenerating}
                            style={({ pressed }) => [
                                styles.generateButton,
                                (!prompt.trim() || isGenerating) && styles.generateButtonDisabled,
                                pressed && styles.generateButtonPressed,
                            ]}
                        >
                            {isGenerating ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Ionicons name="arrow-forward" size={20} color={colors.white} />
                            )}
                        </Pressable>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsContainer}>
                        <Text style={styles.quickActionsLabel}>Quick starts:</Text>
                        <View style={styles.quickActions}>
                            {quickActions.map((action, index) => (
                                <Pressable
                                    key={index}
                                    onPress={() => handleQuickAction(action.prompt)}
                                    disabled={isGenerating}
                                    style={({ pressed }) => [
                                        styles.quickActionButton,
                                        pressed && styles.quickActionButtonPressed,
                                        isGenerating && styles.quickActionButtonDisabled,
                                    ]}
                                >
                                    <Ionicons
                                        name={action.icon as any}
                                        size={16}
                                        color={colors.primary}
                                        style={styles.quickActionIcon}
                                    />
                                    <Text style={styles.quickActionText}>{action.label}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Footer Info */}
                <View style={styles.footer}>
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            AI suggestions are a starting point. You can customize everything later.
                        </Text>
                    </View>
                </View>
            </ScrollView>
            <Modal
                visible={isGenerating}
                transparent={false}
                animationType="fade"
                onRequestClose={() => { }}
            >
                <SlowLoader messages={generatingMessages} />
            </Modal>
        </SafeAreaView>
    );
}
