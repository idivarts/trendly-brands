import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import {
    faArrowUp,
    faMagicWandSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ─── FloatingPromptInput ──────────────────────────────────────────────────────
// Reusable AI-prompt surface used across the web app wherever a feature takes a
// natural-language prompt (image-gen, caption, hashtags, …).
//
// • Web (xl):   a compact floating box anchored near the top of the screen with a
//               purple → primary gradient frame — reads as a distinct "AI" surface.
// • Mobile (!xl): a plain centered modal sheet.
//
// The component owns the prompt text; the parent only receives the final string
// via onGenerate. Pass `loading` to show the in-flight state on the CTA.

export interface FloatingPromptInputProps {
    visible: boolean;
    title: string;
    /** Optional helper line under the title. */
    subtitle?: string;
    placeholder?: string;
    /** CTA label. Defaults to "Generate". */
    ctaLabel?: string;
    /** Shows a spinner + disables the CTA while a request is in flight. */
    loading?: boolean;
    /** Seed the field (e.g. an existing prompt to refine). */
    initialValue?: string;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
}

const FloatingPromptInput: React.FC<FloatingPromptInputProps> = ({
    visible,
    title,
    subtitle,
    placeholder = "Describe what you want the AI to create…",
    ctaLabel = "Generate",
    loading = false,
    initialValue = "",
    onClose,
    onGenerate,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    const [prompt, setPrompt] = useState(initialValue);

    // Reseed the field each time the box is (re)opened so a stale prompt from a
    // previous target doesn't linger.
    useEffect(() => {
        if (visible) setPrompt(initialValue);
    }, [visible, initialValue]);

    const submit = () => {
        const value = prompt.trim();
        if (!value || loading) return;
        onGenerate(value);
    };

    const gradient: [string, string] = [colors.aiGradientStart, colors.aiGradientEnd];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                {/* Gradient frame → gives the box its "AI" identity. */}
                <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.frame}
                >
                    <View style={styles.sheet}>
                        <View style={styles.header}>
                            <LinearGradient
                                colors={gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.sparkChip}
                            >
                                <FontAwesomeIcon
                                    icon={faMagicWandSparkles}
                                    size={14}
                                    color={colors.onPrimary}
                                />
                            </LinearGradient>
                            <View style={styles.headerText}>
                                <Text style={styles.title}>{title}</Text>
                                {subtitle ? (
                                    <Text style={styles.subtitle}>{subtitle}</Text>
                                ) : null}
                            </View>
                            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    size={15}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder={placeholder}
                                placeholderTextColor={colors.textSecondary}
                                value={prompt}
                                onChangeText={setPrompt}
                                multiline
                                maxLength={600}
                                textAlignVertical="top"
                                autoFocus
                                onSubmitEditing={submit}
                            />
                            <Pressable
                                onPress={submit}
                                disabled={!prompt.trim() || loading}
                                style={({ pressed }) => [pressed && styles.pressed]}
                                accessibilityRole="button"
                                accessibilityLabel={ctaLabel}
                            >
                                <LinearGradient
                                    colors={gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.sendBtn,
                                        (!prompt.trim() || loading) && styles.sendBtnDisabled,
                                    ]}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={colors.onPrimary} />
                                    ) : (
                                        <FontAwesomeIcon
                                            icon={faArrowUp}
                                            size={16}
                                            color={colors.onPrimary}
                                        />
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>

                        <Text style={styles.cta}>{loading ? "Generating…" : `Press ↵ to ${ctaLabel.toLowerCase()}`}</Text>
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            // Web floats near the top; mobile centers like a basic modal.
            justifyContent: xl ? "flex-start" : "center",
            paddingTop: xl ? 120 : 0,
            padding: 20,
        },
        // 1.5px gradient border around the card.
        frame: {
            width: "100%",
            maxWidth: xl ? 560 : 440,
            borderRadius: 20,
            padding: 1.5,
            shadowColor: colors.aiGradientStart,
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.32,
            elevation: 14,
        },
        sheet: {
            backgroundColor: colors.card,
            borderRadius: 18.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 12,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
        },
        sparkChip: {
            width: 30,
            height: 30,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
        },
        headerText: {
            flex: 1,
        },
        title: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
            lineHeight: 16,
        },
        closeBtn: {
            padding: 4,
        },
        inputRow: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 10,
        },
        input: {
            flex: 1,
            backgroundColor: colors.tag,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.text,
            minHeight: 52,
            maxHeight: 140,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        sendBtn: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.aiGradientStart,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.4,
            elevation: 4,
        },
        sendBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        cta: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 8,
            marginLeft: 2,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default FloatingPromptInput;
