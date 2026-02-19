import { Console } from "@/shared-libs/utils/console";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";

interface AICampaignCreationProps {
    onSkip: () => void;
}

export default function AICampaignCreation({ onSkip }: AICampaignCreationProps) {
    const router = useMyNavigation();
    const { width } = useWindowDimensions();
    const isWide = width >= 768;
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

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
        handleGenerate(actionPrompt);
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
                }),
            });

            const aiData = await response.json();
            Console.log("AI Generated Data:", aiData);

            // Navigate to create collaboration with AI-generated data
            // Encode the data as a query parameter
            const encodedData = encodeURIComponent(JSON.stringify(aiData));
            router.push(`/create-collaboration?aiData=${encodedData}`);
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
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    isWide && styles.scrollContentWide,
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Skip Button */}
                <Pressable
                    onPress={onSkip}
                    style={({ pressed }) => [
                        styles.skipButton,
                        pressed && styles.skipButtonPressed,
                    ]}
                >
                    <Text style={styles.skipButtonText}>Skip</Text>
                    <Ionicons name="arrow-forward" size={16} color="#666" />
                </Pressable>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={["#667EEA", "#764BA2"]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="sparkles" size={32} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.greeting}>Hi there!</Text>
                    <Text style={styles.title}>Let AI help you create your campaign</Text>
                    <Text style={styles.subtitle}>
                        Describe your campaign goals and our AI will help you craft the perfect brief
                    </Text>
                </View>

                {/* Prompt Input */}
                <View style={[styles.promptContainer, isWide && styles.promptContainerWide]}>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="bulb-outline"
                            size={20}
                            color="#999"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Describe your campaign idea..."
                            placeholderTextColor="#999"
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
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
                                        color="#667EEA"
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
                        <Ionicons name="shield-checkmark" size={20} color="#667EEA" />
                        <Text style={styles.infoText}>
                            AI suggestions are a starting point. You can customize everything later.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
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

    // Skip Button
    skipButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
        gap: 6,
    },
    skipButtonPressed: {
        opacity: 0.7,
        backgroundColor: "#ECECEC",
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
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
        color: "#667EEA",
        fontWeight: "600",
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 12,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
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
        backgroundColor: "#F8F9FA",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#E8E8E8",
        padding: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        ...Platform.select({
            web: {
                shadowColor: "#000",
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
        color: "#1A1A1A",
        minHeight: 80,
        maxHeight: 200,
        textAlignVertical: "top",
        ...Platform.select({
            web: {
                outline: "none" as any,
            },
        }),
    },
    generateButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#667EEA",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-end",
        ...Platform.select({
            web: {
                shadowColor: "#667EEA",
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
        backgroundColor: "#CCC",
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
        color: "#666",
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
        backgroundColor: "#F8F9FA",
        borderWidth: 1.5,
        borderColor: "#E8E8E8",
        gap: 8,
    },
    quickActionButtonPressed: {
        backgroundColor: "#F0F0F0",
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
        color: "#333",
    },

    // Footer
    footer: {
        marginTop: 40,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderLeftWidth: 3,
        borderLeftColor: "#667EEA",
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
});
