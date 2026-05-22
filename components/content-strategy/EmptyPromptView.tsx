import Colors from "@/shared-uis/constants/Colors";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface EmptyPromptViewProps {
    onSubmit: (prompt: string) => void;
}

const SUGGESTIONS = [
    "Launch a 30-day influencer campaign",
    "Build brand awareness for a new product",
    "Plan seasonal content for Diwali",
    "Grow engagement on Instagram Reels",
];

const EmptyPromptView: React.FC<EmptyPromptViewProps> = ({ onSubmit }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [prompt, setPrompt] = useState("");
    const styles = useMemo(() => useStyles(colors), [colors]);

    const handleSubmit = () => {
        const trimmed = prompt.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
        setPrompt("");
    };

    const handleSuggestion = (text: string) => {
        onSubmit(text);
    };

    return (
        <View style={styles.container}>
            <View style={styles.hero}>
                <Text style={styles.heading}>What&apos;s your content strategy goal?</Text>
                <Text style={styles.subheading}>
                    Describe your campaign idea and I&apos;ll build a strategy tailored to your brand.
                </Text>
            </View>

            <View style={styles.suggestionsRow}>
                {SUGGESTIONS.map((s) => (
                    <Pressable
                        key={s}
                        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                        onPress={() => handleSuggestion(s)}
                    >
                        <Text style={styles.chipText}>{s}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { outline: "none" } as any]}
                    placeholder="Describe your brand and what you want to achieve…"
                    placeholderTextColor={colors.textSecondary}
                    value={prompt}
                    onChangeText={setPrompt}
                    multiline
                    onSubmitEditing={handleSubmit}
                />
                <Pressable
                    style={({ pressed }) => [
                        styles.sendBtn,
                        pressed && styles.sendBtnPressed,
                        !prompt.trim() && styles.sendBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!prompt.trim()}
                >
                    <FontAwesomeIcon icon={faArrowUp} size={16} color={colors.onPrimary} />
                </Pressable>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                    paddingBottom: 40,
                    gap: 32,
                },
                hero: {
                    alignItems: "center",
                    maxWidth: 560,
                    gap: 12,
                },
                heading: {
                    fontSize: 28,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    letterSpacing: -0.5,
                },
                subheading: {
                    fontSize: 15,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 22,
                },
                suggestionsRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 10,
                    maxWidth: 680,
                },
                chip: {
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                chipPressed: {
                    opacity: 0.7,
                },
                chipText: {
                    fontSize: 13,
                    fontWeight: "500",
                    color: colors.text,
                },
                inputContainer: {
                    width: "100%",
                    maxWidth: 680,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    paddingHorizontal: 18,
                    paddingVertical: 14,
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 16,
                    shadowOpacity: 0.08,
                    elevation: 6,
                },
                input: {
                    flex: 1,
                    maxHeight: 140,
                    fontSize: 15,
                    color: colors.text,
                    lineHeight: 22,
                },
                sendBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                sendBtnPressed: {
                    opacity: 0.75,
                },
                sendBtnDisabled: {
                    opacity: 0.35,
                    shadowOpacity: 0,
                    elevation: 0,
                },
            }),
        [colors]
    );
}

export default EmptyPromptView;
