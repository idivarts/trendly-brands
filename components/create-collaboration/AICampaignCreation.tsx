import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { resetAndNavigate } from "@/utils/router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { AIGeneratedCampaignData } from "./types";
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AICampaignCreationProps {
    onSkip: () => void;
    onGenerated?: (aiData: AIGeneratedCampaignData) => void;
}

export default function AICampaignCreation({ onSkip, onGenerated }: AICampaignCreationProps) {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { lg, xl } = useBreakpoints();
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [loaderMessageIndex, setLoaderMessageIndex] = useState(0);
    const { selectedBrand } = useBrandContext();
    const generatingMessages = [
        "Understanding your campaign brief...",
        "Drafting a campaign strategy...",
        "Matching goals with ideal creators...",
        "Refining deliverables and budget...",
        "Finalizing your campaign draft...",
    ];

    useEffect(() => {
        if (!isGenerating) {
            setLoaderMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setLoaderMessageIndex((prev) => (prev + 1) % generatingMessages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, [isGenerating, generatingMessages.length]);

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


            const aiData = await response.json() as AIGeneratedCampaignData;
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
                            <Ionicons name="sparkles" size={32} color={colors.onPrimary} />
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
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
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
                transparent
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View style={styles.loadingModalOverlay}>
                    <View style={styles.loadingModalCard}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingModalTitle}>Generating campaign</Text>
                        <Text style={styles.loadingModalMessage}>
                            {generatingMessages[loaderMessageIndex]}
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: Platform.select({ web: 24, default: 16 }),
            paddingBottom: 40,
        },
        scrollContentWide: {
            maxWidth: 900,
            alignSelf: "center",
            width: "100%",
            paddingHorizontal: 40,
        },

        // Top Row (Back + Skip)
        topRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        backButton: {
            padding: 8,
            marginLeft: -8,
        },
        backButtonPressed: {
            opacity: 0.7,
        },
        topRowSpacer: {
            flex: 1,
        },

        // Skip Button
        skipButton: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.tag,
            gap: 6,
        },
        skipButtonPressed: {
            opacity: 0.7,
            backgroundColor: colors.outline,
        },
        skipButtonText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
        },

        // Header
        header: {
            marginTop: 32,
            marginBottom: 40,
        },
        iconContainer: {
            marginBottom: 20,
        },
        iconGradient: {
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
        },
        greeting: {
            fontSize: 16,
            color: colors.primary,
            fontWeight: "600",
            marginBottom: 8,
        },
        title: {
            fontSize: 32,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 12,
            lineHeight: 40,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            lineHeight: 24,
        },

        // Prompt Input
        promptContainer: {
            marginBottom: 32,
        },
        promptContainerWide: {
            maxWidth: 700,
        },
        inputWrapper: {
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: colors.outline,
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            ...Platform.select({
                web: {
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                },
                default: {
                    elevation: 2,
                },
            }),
        },
        inputIcon: {
            marginTop: 4,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
            minHeight: 80,
            maxHeight: 200,
            textAlignVertical: "top",
            ...Platform.select({
                web: {},
            }),
        },
        generateButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-end",
            ...Platform.select({
                web: {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                },
                default: {
                    elevation: 4,
                },
            }),
        },
        generateButtonDisabled: {
            backgroundColor: colors.outline,
            opacity: 0.6,
        },
        generateButtonPressed: {
            transform: [{ scale: 0.95 }],
        },

        // Quick Actions
        quickActionsContainer: {
            marginTop: 24,
        },
        quickActionsLabel: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 12,
        },
        quickActions: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        quickActionButton: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 24,
            backgroundColor: colors.background,
            borderWidth: 1.5,
            borderColor: colors.outline,
            gap: 8,
        },
        quickActionButtonPressed: {
            backgroundColor: colors.tag,
            transform: [{ scale: 0.98 }],
        },
        quickActionButtonDisabled: {
            opacity: 0.5,
        },
        quickActionIcon: {
            marginTop: 1,
        },
        quickActionText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },

        // Footer
        footer: {
            marginTop: 40,
        },
        infoCard: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            gap: 12,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
        },
        infoText: {
            flex: 1,
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        loadingModalOverlay: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdrop,
            paddingHorizontal: 20,
        },
        loadingModalCard: {
            width: "100%",
            maxWidth: 360,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 20,
            paddingVertical: 24,
            alignItems: "center",
            gap: 10,
        },
        loadingModalTitle: {
            marginTop: 4,
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        loadingModalMessage: {
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
            textAlign: "center",
            minHeight: 40,
        },
    });
}
