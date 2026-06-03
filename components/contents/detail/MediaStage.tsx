import { ContentType } from "@/components/content-calendar/types";
import FloatingPromptInput from "@/components/shared/FloatingPromptInput";
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { pickMedia } from "@/shared-libs/utils/media-picker";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpFromBracket,
    faChevronLeft,
    faChevronRight,
    faImage,
    faMagicWandSparkles,
    faPlay,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { aspectError, MEDIA_SPEC } from "./media-spec";

interface MediaStageProps {
    contentType: ContentType;
    attachments: Attachment[];
    onAttachmentsChange: (next: Attachment[]) => void;
    /** AI image-generation prompt (only used when the type supports generation). */
    imagePrompt: string;
    onImagePromptChange: (v: string) => void;
    onGenerateImage: (prompt?: string) => void;
    isGeneratingImage: boolean;
}

const SUBTITLE: Record<ContentType, string> = {
    reel: "Upload your finished reel video. You can also draft a script below.",
    post: "Upload an image or generate one with AI.",
    carousel: "Add slides in order — upload or generate each one.",
    story: "Upload an image or generate one with AI.",
    live: "",
};

const MediaStage: React.FC<MediaStageProps> = ({
    contentType,
    attachments,
    onAttachmentsChange,
    imagePrompt,
    onImagePromptChange,
    onGenerateImage,
    isGeneratingImage,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);
    const spec = MEDIA_SPEC[contentType];
    const { uploadFileUri } = useAWSContext();

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    // Close the floating prompt once a generation finishes (true → false).
    const wasGeneratingRef = useRef(false);
    useEffect(() => {
        if (wasGeneratingRef.current && !isGeneratingImage) setShowPrompt(false);
        wasGeneratingRef.current = isGeneratingImage;
    }, [isGeneratingImage]);

    const handleUpload = useCallback(async () => {
        setError(null);
        try {
            const picked = await pickMedia(spec.kind === "video" ? "video" : "image");
            if (!picked) return;

            // Phase 2: enforce the per-type aspect-ratio range before uploading.
            const ratioError = aspectError(contentType, picked.width, picked.height);
            if (ratioError) {
                setError(ratioError);
                return;
            }

            setUploading(true);
            const uploaded = await uploadFileUri({
                id: picked.assetId ?? picked.uri,
                localUri: picked.uri,
                uri: picked.uri,
                type: picked.type,
            });
            onAttachmentsChange(spec.multi ? [...attachments, uploaded] : [uploaded]);
        } catch (e) {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }, [attachments, contentType, spec.kind, spec.multi, uploadFileUri, onAttachmentsChange]);

    const removeAt = useCallback(
        (index: number) => {
            onAttachmentsChange(attachments.filter((_, i) => i !== index));
        },
        [attachments, onAttachmentsChange]
    );

    const moveBy = useCallback(
        (index: number, dir: -1 | 1) => {
            const target = index + dir;
            if (target < 0 || target >= attachments.length) return;
            const next = [...attachments];
            [next[index], next[target]] = [next[target], next[index]];
            onAttachmentsChange(next);
        },
        [attachments, onAttachmentsChange]
    );

    const generateLabel = spec.kind === "video" ? "Generate" : "Generate with AI";

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.cardTitle}>
                    {spec.kind === "video" ? "Video" : "Visuals"}
                </Text>
                {spec.aspectLabel ? (
                    <View style={styles.ratioChip}>
                        <Text style={styles.ratioChipText}>{spec.aspectLabel}</Text>
                    </View>
                ) : null}
            </View>
            <Text style={styles.cardSub}>{SUBTITLE[contentType]}</Text>

            {/* Gallery */}
            {attachments.length > 0 ? (
                <View style={styles.gallery}>
                    {attachments.map((a, i) => {
                        const isVideo = a.type === "video" || a.type === "reel";
                        return (
                            <View key={`${a.imageUrl ?? a.playUrl ?? a.appleUrl ?? "a"}-${i}`} style={styles.tileWrap}>
                                <View style={styles.tile}>
                                    {isVideo ? (
                                        <View style={styles.videoTile}>
                                            <FontAwesomeIcon icon={faPlay} size={18} color={colors.onPrimary} />
                                            <Text style={styles.videoTileText}>Video</Text>
                                        </View>
                                    ) : a.imageUrl ? (
                                        <Image source={{ uri: a.imageUrl }} style={styles.tileImg} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.videoTile}>
                                            <FontAwesomeIcon icon={faImage} size={18} color={colors.onPrimary} />
                                        </View>
                                    )}

                                    <Pressable
                                        style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                                        onPress={() => removeAt(i)}
                                        accessibilityLabel="Remove media"
                                    >
                                        <FontAwesomeIcon icon={faXmark} size={11} color={colors.onPrimary} />
                                    </Pressable>

                                    {spec.multi ? (
                                        <View style={styles.orderBadge}>
                                            <Text style={styles.orderBadgeText}>{i + 1}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Reorder controls — carousel only */}
                                {spec.multi && attachments.length > 1 ? (
                                    <View style={styles.reorderRow}>
                                        <Pressable
                                            style={({ pressed }) => [styles.reorderBtn, pressed && styles.pressed]}
                                            onPress={() => moveBy(i, -1)}
                                            disabled={i === 0}
                                        >
                                            <FontAwesomeIcon
                                                icon={faChevronLeft}
                                                size={11}
                                                color={i === 0 ? colors.textSecondary : colors.primary}
                                            />
                                        </Pressable>
                                        <Pressable
                                            style={({ pressed }) => [styles.reorderBtn, pressed && styles.pressed]}
                                            onPress={() => moveBy(i, 1)}
                                            disabled={i === attachments.length - 1}
                                        >
                                            <FontAwesomeIcon
                                                icon={faChevronRight}
                                                size={11}
                                                color={i === attachments.length - 1 ? colors.textSecondary : colors.primary}
                                            />
                                        </Pressable>
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <FontAwesomeIcon
                        icon={spec.kind === "video" ? faPlay : faImage}
                        size={20}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.emptyText}>
                        {spec.multi ? "No slides yet" : spec.kind === "video" ? "No video yet" : "No image yet"}
                    </Text>
                </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Actions */}
            <View style={styles.actionRow}>
                <Pressable
                    style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}
                    onPress={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <FontAwesomeIcon icon={faArrowUpFromBracket} size={13} color={colors.primary} />
                    )}
                    <Text style={styles.uploadBtnText}>
                        {uploading
                            ? "Uploading…"
                            : spec.multi
                                ? "Upload slide"
                                : spec.kind === "video"
                                    ? "Upload video"
                                    : "Upload image"}
                    </Text>
                </Pressable>

                {spec.canGenerate ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.genToggleBtn,
                            showPrompt && styles.genToggleBtnActive,
                            pressed && styles.pressed,
                        ]}
                        onPress={() => setShowPrompt(true)}
                    >
                        <FontAwesomeIcon
                            icon={faMagicWandSparkles}
                            size={13}
                            color={showPrompt ? colors.onPrimary : colors.primary}
                        />
                        <Text
                            style={[
                                styles.genToggleText,
                                showPrompt && styles.genToggleTextActive,
                            ]}
                        >
                            {generateLabel}
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {/* AI generation prompt — floating gradient box (web) / modal (mobile) */}
            {spec.canGenerate ? (
                <FloatingPromptInput
                    visible={showPrompt}
                    title={spec.multi ? "Generate a slide with AI" : "Generate an image with AI"}
                    subtitle="Describe the visual — style, subject, brand colours…"
                    placeholder="E.g. minimalist flat-lay of orthopedic sandals on a warm beige background…"
                    ctaLabel={spec.multi ? "Generate slide" : "Generate image"}
                    loading={isGeneratingImage}
                    initialValue={imagePrompt}
                    onClose={() => setShowPrompt(false)}
                    onGenerate={(prompt) => {
                        onImagePromptChange(prompt);
                        onGenerateImage(prompt);
                    }}
                />
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        cardTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
        },
        ratioChip: {
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 7,
            backgroundColor: colors.aliceBlue,
        },
        ratioChipText: {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.4,
            color: colors.primary,
        },
        cardSub: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 18,
            marginTop: 4,
            marginBottom: 14,
        },
        gallery: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 12,
        },
        tileWrap: {
            alignItems: "center",
            gap: 6,
        },
        tile: {
            width: 96,
            height: 120,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.06,
            elevation: 1,
        },
        tileImg: {
            width: "100%",
            height: "100%",
        },
        videoTile: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: colors.primary,
        },
        videoTileText: {
            fontSize: 11,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        removeBtn: {
            position: "absolute",
            top: 5,
            right: 5,
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },
        orderBadge: {
            position: "absolute",
            bottom: 5,
            left: 5,
            minWidth: 20,
            height: 20,
            paddingHorizontal: 5,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
        },
        orderBadgeText: {
            fontSize: 11,
            fontWeight: "800",
            color: colors.onPrimary,
        },
        reorderRow: {
            flexDirection: "row",
            gap: 6,
        },
        reorderBtn: {
            width: 30,
            height: 24,
            borderRadius: 7,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        emptyState: {
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 22,
            borderRadius: 10,
            backgroundColor: colors.tag,
            marginBottom: 12,
        },
        emptyText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        errorText: {
            fontSize: 12,
            color: colors.toastError,
            marginBottom: 10,
        },
        actionRow: {
            flexDirection: "row",
            gap: 10,
        },
        uploadBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: colors.aliceBlue,
        },
        uploadBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        genToggleBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        genToggleBtnActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        genToggleText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
        },
        genToggleTextActive: {
            color: colors.onPrimary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default MediaStage;
