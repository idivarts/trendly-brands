/**
 * MediaStage — the default "home" view of a content's media on the detail page.
 *
 * It is deliberately NOT a creation surface: it shows the media that's already
 * there — uploaded by the user, or baked (rendered) out of the Design Studio —
 * with large, fully-visible previews (single image, single video with a real
 * first-frame thumbnail, or a multi-image carousel). Creation happens in one of
 * two ways only: the prominent "Design with AI" action (opens the Design Stage)
 * or a quiet, secondary "Upload your own" link. There is no middle-ground
 * generate/enhance step here any more — that all lives in the Design Stage.
 */
import { ContentType } from "@/components/content-calendar/types";
import { useBreakpoints } from "@/hooks";
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { pickMedia, pickMediaMulti, PickedAsset } from "@/shared-libs/utils/media-picker";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpFromBracket,
    faChevronLeft,
    faChevronRight,
    faImage,
    faPlay,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { aspectError, MEDIA_SPEC } from "./media-spec";

interface MediaStageProps {
    contentType: ContentType;
    attachments: Attachment[];
    onAttachmentsChange: (next: Attachment[]) => void;
    /** Open the Design Stage (primary creation path). */
    onOpenDesign: () => void;
    /** When true the media is read-only (content is scheduled or posted). */
    readOnly?: boolean;
}

const videoUrlOf = (a: Attachment): string | null =>
    Platform.OS === "ios"
        ? a.appleUrl ?? a.playUrl ?? null
        : a.playUrl ?? a.appleUrl ?? null;

const MediaStage: React.FC<MediaStageProps> = ({
    contentType,
    attachments,
    onAttachmentsChange,
    onOpenDesign,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);
    const spec = MEDIA_SPEC[contentType];
    const { uploadFileUri } = useAWSContext();

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

    const hasMedia = attachments.length > 0;

    const openPreview = useCallback((a: Attachment) => {
        const isVideo = a.type === "video" || a.type === "reel";
        if (isVideo) {
            setPreviewVideoUrl(videoUrlOf(a));
            setPreviewImageUrl(null);
        } else {
            setPreviewImageUrl(a.imageUrl ?? null);
            setPreviewVideoUrl(null);
        }
        setPreviewOpen(true);
    }, []);

    const uploadPicked = useCallback(
        (p: PickedAsset) =>
            uploadFileUri({
                id: p.assetId ?? p.uri,
                localUri: p.uri,
                uri: p.uri,
                type: p.type,
            }),
        [uploadFileUri]
    );

    const handleUpload = useCallback(async () => {
        setError(null);
        try {
            if (spec.multi) {
                const picked = await pickMediaMulti(spec.kind === "video" ? "video" : "image");
                if (!picked.length) return;

                const valid = picked.filter((p) => !aspectError(contentType, p.width, p.height));
                if (!valid.length) {
                    setError(aspectError(contentType, picked[0].width, picked[0].height));
                    return;
                }

                setUploading(true);
                const uploaded = await Promise.all(valid.map(uploadPicked));
                onAttachmentsChange([...attachments, ...uploaded]);

                const skipped = picked.length - valid.length;
                if (skipped > 0) {
                    setError(
                        `${skipped} ${skipped === 1 ? "image was" : "images were"} skipped — slides need ${spec.aspectLabel}.`
                    );
                }
                return;
            }

            const picked = await pickMedia(spec.kind === "video" ? "video" : "image");
            if (!picked) return;

            const ratioError = aspectError(contentType, picked.width, picked.height);
            if (ratioError) {
                setError(ratioError);
                return;
            }

            setUploading(true);
            const uploaded = await uploadPicked(picked);
            onAttachmentsChange([uploaded]);
        } catch (e) {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }, [attachments, contentType, spec.kind, spec.multi, spec.aspectLabel, uploadPicked, onAttachmentsChange]);

    const removeAt = useCallback(
        (index: number) => onAttachmentsChange(attachments.filter((_, i) => i !== index)),
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

    const uploadLabel = spec.multi
        ? "Upload slides"
        : spec.kind === "video"
            ? "Upload a video"
            : "Upload an image";

    // ── Preview renderers ────────────────────────────────────────────────────
    const renderSingle = (a: Attachment) => {
        const isVideo = a.type === "video" || a.type === "reel";
        const vUrl = isVideo ? videoUrlOf(a) : null;
        const canPreview = isVideo ? !!vUrl : !!a.imageUrl;
        return (
            <Pressable
                style={styles.singleWrap}
                onPress={canPreview ? () => openPreview(a) : undefined}
                disabled={!canPreview}
                accessibilityLabel={isVideo ? "Preview video full screen" : "Preview image full screen"}
            >
                {isVideo ? (
                    vUrl ? (
                        <>
                            <Video
                                source={{ uri: vUrl }}
                                style={styles.singleMedia}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay={false}
                                isMuted
                                useNativeControls={false}
                            />
                            <View style={styles.playOverlay} pointerEvents="none">
                                <View style={styles.playBadge}>
                                    <FontAwesomeIcon icon={faPlay} size={18} color={colors.onPrimary} />
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={styles.mediaFallback}>
                            <FontAwesomeIcon icon={faPlay} size={22} color={colors.textSecondary} />
                        </View>
                    )
                ) : a.imageUrl ? (
                    <Image source={{ uri: a.imageUrl }} style={styles.singleMedia} resizeMode="contain" />
                ) : (
                    <View style={styles.mediaFallback}>
                        <FontAwesomeIcon icon={faImage} size={22} color={colors.textSecondary} />
                    </View>
                )}

                {!readOnly ? (
                    <Pressable
                        style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                        onPress={(e) => {
                            e.stopPropagation();
                            removeAt(0);
                        }}
                        accessibilityLabel="Remove media"
                    >
                        <FontAwesomeIcon icon={faXmark} size={12} color={colors.onPrimary} />
                    </Pressable>
                ) : null}
            </Pressable>
        );
    };

    const renderCarousel = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
        >
            {attachments.map((a, i) => {
                const isVideo = a.type === "video" || a.type === "reel";
                const vUrl = isVideo ? videoUrlOf(a) : null;
                const canPreview = isVideo ? !!vUrl : !!a.imageUrl;
                return (
                    <View key={`${a.imageUrl ?? a.playUrl ?? "a"}-${i}`} style={styles.slideCol}>
                        <Pressable
                            style={styles.slideTile}
                            onPress={canPreview ? () => openPreview(a) : undefined}
                            disabled={!canPreview}
                            accessibilityLabel={`Preview slide ${i + 1}`}
                        >
                            {isVideo ? (
                                vUrl ? (
                                    <>
                                        <Video
                                            source={{ uri: vUrl }}
                                            style={styles.slideMedia}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={false}
                                            isMuted
                                            useNativeControls={false}
                                        />
                                        <View style={styles.playOverlay} pointerEvents="none">
                                            <View style={styles.playBadgeSm}>
                                                <FontAwesomeIcon icon={faPlay} size={12} color={colors.onPrimary} />
                                            </View>
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.mediaFallback}>
                                        <FontAwesomeIcon icon={faPlay} size={18} color={colors.textSecondary} />
                                    </View>
                                )
                            ) : a.imageUrl ? (
                                <Image source={{ uri: a.imageUrl }} style={styles.slideMedia} resizeMode="cover" />
                            ) : (
                                <View style={styles.mediaFallback}>
                                    <FontAwesomeIcon icon={faImage} size={18} color={colors.textSecondary} />
                                </View>
                            )}

                            <View style={styles.orderBadge}>
                                <Text style={styles.orderBadgeText}>{i + 1}</Text>
                            </View>

                            {!readOnly ? (
                                <Pressable
                                    style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        removeAt(i);
                                    }}
                                    accessibilityLabel={`Remove slide ${i + 1}`}
                                >
                                    <FontAwesomeIcon icon={faXmark} size={11} color={colors.onPrimary} />
                                </Pressable>
                            ) : null}
                        </Pressable>

                        {!readOnly && attachments.length > 1 ? (
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
        </ScrollView>
    );

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.cardTitle}>{spec.kind === "video" ? "Video" : "Visuals"}</Text>
                {spec.aspectLabel ? (
                    <View style={styles.ratioChip}>
                        <Text style={styles.ratioChipText}>{spec.aspectLabel}</Text>
                    </View>
                ) : null}
            </View>

            {/* Preview of what's already here (uploaded or baked from the Studio) */}
            {hasMedia ? (
                spec.multi ? renderCarousel() : renderSingle(attachments[0])
            ) : (
                <View style={styles.emptyPreview}>
                    <FontAwesomeIcon
                        icon={spec.kind === "video" ? faPlay : faImage}
                        size={22}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.emptyText}>
                        {spec.multi ? "No slides yet" : spec.kind === "video" ? "No video yet" : "No image yet"}
                    </Text>
                </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Primary path — design with AI. The whole block invites the user in. */}
            {!readOnly ? (
                <>
                    <Pressable
                        style={({ pressed }) => [styles.designHero, pressed && styles.heroPressed]}
                        onPress={onOpenDesign}
                        accessibilityRole="button"
                        accessibilityLabel="Open the Design Stage to create with AI"
                    >
                        <View style={styles.heroIcon}>
                            <FontAwesomeIcon icon={faWandMagicSparkles} size={18} color={colors.onPrimary} />
                        </View>
                        <View style={styles.heroBody}>
                            <Text style={styles.heroTitle}>
                                {hasMedia ? "Refine in the Design Stage" : "Design with AI"}
                            </Text>
                            <Text style={styles.heroSub}>
                                {hasMedia
                                    ? "Open the Studio to edit this design, or ask the AI for a new one."
                                    : "Create an on-brand, editable design — the AI does the heavy lifting."}
                            </Text>
                        </View>
                        <FontAwesomeIcon icon={faChevronRight} size={15} color={colors.onPrimary} />
                    </Pressable>

                    {/* Secondary, intentionally quiet — upload your own. */}
                    <Pressable
                        style={styles.uploadLink}
                        onPress={handleUpload}
                        disabled={uploading}
                        accessibilityRole="button"
                        accessibilityLabel={uploadLabel}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                        ) : (
                            <FontAwesomeIcon icon={faArrowUpFromBracket} size={12} color={colors.textSecondary} />
                        )}
                        <Text style={styles.uploadLinkText}>
                            {uploading ? "Uploading…" : `or ${uploadLabel.toLowerCase()} instead`}
                        </Text>
                    </Pressable>
                </>
            ) : null}

            {previewOpen ? (
                <AssetPreviewModal
                    previewImage={previewOpen}
                    previewImageUrl={previewImageUrl}
                    previewVideoUrl={previewVideoUrl}
                    setPreviewImage={setPreviewOpen}
                    theme={theme}
                />
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    const previewHeight = xl ? 340 : 260;
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            gap: 14,
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

        // Single preview — big and fully visible (contain, not cropped).
        singleWrap: {
            width: "100%",
            height: previewHeight,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
        },
        singleMedia: {
            width: "100%",
            height: "100%",
        },
        mediaFallback: {
            flex: 1,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
        },
        playOverlay: {
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
        },
        playBadge: {
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },
        playBadgeSm: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },

        // Multi-image carousel — larger tiles than before.
        carousel: {
            gap: 12,
            paddingVertical: 2,
        },
        slideCol: {
            alignItems: "center",
            gap: 6,
        },
        slideTile: {
            width: 150,
            height: 188,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
        },
        slideMedia: {
            width: "100%",
            height: "100%",
        },
        orderBadge: {
            position: "absolute",
            bottom: 6,
            left: 6,
            minWidth: 22,
            height: 22,
            paddingHorizontal: 6,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
        },
        orderBadgeText: {
            fontSize: 12,
            fontWeight: "800",
            color: colors.onPrimary,
        },
        reorderRow: {
            flexDirection: "row",
            gap: 8,
        },
        reorderBtn: {
            width: 34,
            height: 26,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },

        removeBtn: {
            position: "absolute",
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },

        emptyPreview: {
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: previewHeight,
            borderRadius: 12,
            backgroundColor: colors.tag,
        },
        emptyText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        errorText: {
            fontSize: 12,
            color: colors.toastError,
        },

        // Primary CTA — dominant, this is where we want the user to go.
        designHero: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 16,
            borderRadius: 14,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.35,
            elevation: 6,
        },
        heroPressed: {
            opacity: 0.9,
        },
        heroIcon: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },
        heroBody: {
            flex: 1,
            gap: 3,
        },
        heroTitle: {
            fontSize: 15,
            fontWeight: "800",
            color: colors.onPrimary,
        },
        heroSub: {
            fontSize: 12,
            lineHeight: 17,
            color: colors.onPrimary,
            opacity: 0.85,
        },

        // Secondary — quiet, low-emphasis upload link.
        uploadLink: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            paddingVertical: 4,
        },
        uploadLinkText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default MediaStage;
