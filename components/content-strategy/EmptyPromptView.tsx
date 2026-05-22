import Colors from "@/shared-uis/constants/Colors";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface EmptyPromptViewProps {
    onSubmit: (prompt: string) => void;
}

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

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>
                    Let&apos;s get started to create your content strategy.
                </Text>
                <Text style={styles.sublabel}>
                    Tell us about what you are thinking to create for your brand.
                </Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. I want to launch a 30-day influencer campaign for my skincare brand..."
                        placeholderTextColor={colors.textSecondary}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                        numberOfLines={4}
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
                        <FontAwesomeIcon
                            icon={faArrowRight}
                            size={18}
                            color={colors.onPrimary}
                        />
                    </Pressable>
                </View>
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
                    padding: 24,
                },
                card: {
                    width: "100%",
                    maxWidth: 640,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 32,
                    shadowColor: colors.panelShadow,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 1,
                    elevation: 8,
                },
                label: {
                    fontSize: 22,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                },
                sublabel: {
                    fontSize: 15,
                    color: colors.textSecondary,
                    marginBottom: 24,
                    lineHeight: 22,
                },
                inputRow: {
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "flex-end",
                },
                input: {
                    flex: 1,
                    minHeight: 100,
                    borderRadius: 14,
                    backgroundColor: colors.tag,
                    color: colors.text,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    lineHeight: 22,
                    textAlignVertical: "top",
                    shadowColor: colors.panelShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.5,
                    elevation: 2,
                },
                sendBtn: {
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                    shadowOpacity: 0.4,
                    elevation: 4,
                },
                sendBtnPressed: {
                    opacity: 0.75,
                },
                sendBtnDisabled: {
                    opacity: 0.4,
                    shadowOpacity: 0,
                    elevation: 0,
                },
            }),
        [colors]
    );
}

export default EmptyPromptView;
