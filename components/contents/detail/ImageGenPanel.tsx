/**
 * ImageGenPanel — the prompt surface for the AI image-generation lane.
 *
 * Deliberately narrower than a general image generator: the aspect ratio is NOT
 * offered, because the content type already dictates it (a story is 9:16, a post
 * 1:1) and letting the user pick a conflicting ratio only produces an asset that
 * fails upload validation later.
 *
 * It doubles as the iterate surface. Once an image exists the same box drives
 * enhance/regenerate, and for a carousel it can be scoped to one slide — the
 * backend decides edit-this-slide vs add-a-new-slide from the prompt.
 */
import { ContentType } from "@/components/content-calendar/types";
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MEDIA_SPEC } from "./media-spec";

/** Matches the styles the generation backend understands. */
const STYLES = [
    { value: "realistic", label: "Photoreal" },
    { value: "illustrated", label: "Illustrated" },
    { value: "minimal", label: "Minimal" },
];

interface Props {
    contentType: ContentType;
    generating: boolean;
    error?: string | null;
    /** True once at least one image has been generated — switches copy to iterate. */
    hasImages: boolean;
    /** Carousel only: the slide the next prompt is scoped to (0-based). */
    focusedSlideIndex?: number;
    onClearFocusedSlide?: () => void;
    onGenerate: (prompt: string, style: string) => void;
    /** Back out of the lane. Only offered before anything has been generated. */
    onCancel?: () => void;
}

const ImageGenPanel: React.FC<Props> = ({
    contentType,
    generating,
    error,
    hasImages,
    focusedSlideIndex,
    onClearFocusedSlide,
    onGenerate,
    onCancel,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const spec = MEDIA_SPEC[contentType];

    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("realistic");

    const canSubmit = prompt.trim().length > 0 && !generating;

    const submit = () => {
        if (!canSubmit) return;
        onGenerate(prompt.trim(), style);
        setPrompt("");
    };

    const placeholder = hasImages
        ? focusedSlideIndex !== undefined
            ? "Describe the change to this slide…"
            : spec.multi
                ? "Describe a change, or ask for another slide…"
                : "Describe a change to this image…"
        : spec.multi
            ? "Describe the slides you want — subject, setting, mood…"
            : "Describe the image you want — subject, setting, mood…";

    return (
        <View style={styles.wrap}>
            <View style={styles.headRow}>
                <Text style={styles.title}>
                    {hasImages ? "Refine with AI" : spec.multi ? "Generate slides" : "Generate an image"}
                </Text>
                <View style={styles.ratioChip}>
                    <Text style={styles.ratioChipText}>{spec.aspectRatios[0] ?? "1:1"}</Text>
                </View>
            </View>

            {focusedSlideIndex !== undefined ? (
                <Pressable style={styles.focusChip} onPress={onClearFocusedSlide}>
                    <Text style={styles.focusChipText}>Editing slide {focusedSlideIndex + 1}</Text>
                    <FontAwesomeIcon icon={faXmark} size={10} color={colors.primary} />
                </Pressable>
            ) : null}

            <TextInput
                style={styles.input}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                multiline
                editable={!generating}
                onSubmitEditing={submit}
            />

            {!hasImages ? (
                <View style={styles.styleRow}>
                    {STYLES.map((s) => {
                        const active = s.value === style;
                        return (
                            <Pressable
                                key={s.value}
                                style={[styles.styleChip, active && styles.styleChipActive]}
                                onPress={() => setStyle(s.value)}
                                accessibilityRole="button"
                                accessibilityLabel={`${s.label} style`}
                            >
                                <Text style={[styles.styleChipText, active && styles.styleChipTextActive]}>
                                    {s.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actionRow}>
                {onCancel ? (
                    <Pressable
                        style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                        onPress={onCancel}
                        disabled={generating}
                    >
                        <Text style={styles.ghostBtnText}>Cancel</Text>
                    </Pressable>
                ) : null}
                <Pressable
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        !canSubmit && styles.primaryBtnDisabled,
                        pressed && styles.pressed,
                    ]}
                    onPress={submit}
                    disabled={!canSubmit}
                    accessibilityRole="button"
                    accessibilityLabel={hasImages ? "Apply this change" : "Generate"}
                >
                    {generating ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                        <FontAwesomeIcon icon={faWandMagicSparkles} size={13} color={colors.onPrimary} />
                    )}
                    <Text style={styles.primaryBtnText}>
                        {generating ? "Generating…" : hasImages ? "Apply" : "Generate"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            gap: 10,
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        headRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        title: {
            fontSize: fs(14),
            fontWeight: "800",
            color: colors.text,
        },
        ratioChip: {
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 7,
            backgroundColor: colors.card,
        },
        ratioChipText: {
            fontSize: fs(11),
            fontWeight: "700",
            letterSpacing: 0.4,
            color: colors.primary,
        },
        focusChip: {
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: colors.card,
        },
        focusChipText: {
            fontSize: fs(12),
            fontWeight: "700",
            color: colors.primary,
        },
        input: {
            minHeight: 76,
            borderRadius: 11,
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: fs(13),
            lineHeight: lh(19),
            color: colors.text,
            textAlignVertical: "top",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        styleRow: {
            flexDirection: "row",
            gap: 8,
        },
        styleChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 9,
            backgroundColor: colors.card,
        },
        styleChipActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 10,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        styleChipText: {
            fontSize: fs(12),
            fontWeight: "700",
            color: colors.textSecondary,
        },
        styleChipTextActive: {
            color: colors.onPrimary,
        },
        error: {
            fontSize: fs(12),
            color: colors.toastError,
        },
        actionRow: {
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
        },
        ghostBtn: {
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
        },
        ghostBtnText: {
            fontSize: fs(13),
            fontWeight: "700",
            color: colors.textSecondary,
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnDisabled: {
            opacity: 0.5,
        },
        primaryBtnText: {
            fontSize: fs(13),
            fontWeight: "800",
            color: colors.onPrimary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default ImageGenPanel;
