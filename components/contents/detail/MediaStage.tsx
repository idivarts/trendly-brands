/**
 * MediaStage — the default "home" view of a content's media on the detail page.
 *
 * It shows the media that's already there and nothing else: there is no empty
 * placeholder box, because a large grey rectangle that says "No video yet" eats
 * the best space on the page to communicate nothing. With no media, the three
 * creation lanes ARE the stage.
 *
 * Exactly one lane owns the media at a time (see ./media-lane):
 *
 *   design   — an HTML design from the Design Studio. Previewed here even before
 *              it is rendered, by mounting the design's own frame read-only, so
 *              the user sees what the AI just made without exporting first.
 *   generate — photoreal image(s) from AI image generation, iterated from the
 *              prompt box below the preview (per-slide for a carousel).
 *   upload    — asset(s) the user picked. Slides can be added, removed, reordered.
 *
 * Picking a lane hides the others; clearing the media returns to the chooser.
 * Previews are laid out by ASPECT RATIO (measured where possible, else the
 * content type's canonical ratio) and never at a fixed height — a fixed height
 * renders a 9:16 reel inside a landscape box.
 */
import { ContentType } from "@/components/content-calendar/types";
import { fs, lh } from "@/constants/Typography";
import { useBreakpoints } from "@/hooks";
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { pickMedia, pickMediaMulti, PickedAsset } from "@/shared-libs/utils/media-picker";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpFromBracket,
    faChevronLeft,
    faChevronRight,
    faImage,
    faPen,
    faPlay,
    faPlus,
    faTrashCan,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    LayoutChangeEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import DesignFrame from "./design-stage/DesignFrame";
import { DesignPreview } from "./design-stage/use-design-preview";
import ImageGenPanel from "./ImageGenPanel";
import MediaAssetPreview from "./MediaAssetPreview";
import MediaLaneCards from "./MediaLaneCards";
import { clearLabelFor, MediaLane, MediaSource, resolveMediaLane } from "./media-lane";
import { aspectError, MEDIA_SPEC, parseAspectRatio, previewAspect } from "./media-spec";

/** Tallest a preview may get, so a 9:16 design doesn't push the page apart. */
const MAX_PREVIEW_H = 420;

interface MediaStageProps {
    contentType: ContentType;
    attachments: Attachment[];
    onAttachmentsChange: (next: Attachment[]) => void;
    /** Authoritative lane record from the content doc. */
    source?: MediaSource;
    /** Pointer to the current design revision, when the design lane owns the media. */
    designRef?: IContentDesignRef;
    /** Live HTML of that revision, for previewing a canvas that isn't rendered yet. */
    designPreview?: DesignPreview | null;
    /** Open the Design Studio — to start a design, or edit the existing one. */
    onOpenDesign: () => void;
    /** Clear the media (and the design pointer) back to the empty state. */
    onClearMedia: () => void;
    /** AI image generation for the generate lane. */
    imageGenerating?: boolean;
    imageGenError?: string | null;
    onGenerateImage?: (prompt: string, style: string, focusedSlideIndex?: number) => void;
    /** When true the media is read-only (content is scheduled or posted). */
    readOnly?: boolean;
}

const videoUrlOf = (a: Attachment): string | null =>
    Platform.OS === "ios"
        ? a.appleUrl ?? a.playUrl ?? null
        : a.playUrl ?? a.appleUrl ?? null;

const isVideoAttachment = (a: Attachment) => a.type === "video" || a.type === "reel";

const MediaStage: React.FC<MediaStageProps> = ({
    contentType,
    attachments,
    onAttachmentsChange,
    source,
    designRef,
    designPreview,
    onOpenDesign,
    onClearMedia,
    imageGenerating = false,
    imageGenError,
    onGenerateImage,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const spec = MEDIA_SPEC[contentType];
    const { uploadFileUri } = useAWSContext();

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
    const [focusedSlide, setFocusedSlide] = useState<number | undefined>(undefined);
    // Measured width of the stage, needed to scale the design frame.
    const [stageWidth, setStageWidth] = useState(0);

    const hasMedia = attachments.length > 0;

    // The lane the data says owns this media, and the one the user just picked
    // (before any media exists to prove it). Resolved always wins.
    const resolvedLane = useMemo(
        () => resolveMediaLane({ designRef, attachments, source }),
        [designRef, attachments, source]
    );
    const [pickedLane, setPickedLane] = useState<MediaLane | null>(null);
    const lane = resolvedLane ?? pickedLane;

    // Once the data commits a lane, drop the local pick so the two can't disagree
    // (e.g. the user picks "generate", the generation lands, `source` takes over).
    useEffect(() => {
        if (resolvedLane) setPickedLane(null);
    }, [resolvedLane]);

    // A cleared stage must forget the focused slide too, or the next generation
    // would silently target a slide that no longer exists.
    useEffect(() => {
        if (!hasMedia) setFocusedSlide(undefined);
        else if (focusedSlide !== undefined && focusedSlide >= attachments.length) setFocusedSlide(undefined);
    }, [hasMedia, attachments.length, focusedSlide]);

    const onStageLayout = useCallback((e: LayoutChangeEvent) => {
        setStageWidth(e.nativeEvent.layout.width);
    }, []);

    const openPreview = useCallback((a: Attachment) => {
        if (isVideoAttachment(a)) {
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

    /** Returns true when at least one asset was uploaded. */
    const handleUpload = useCallback(async (): Promise<boolean> => {
        setError(null);
        try {
            if (spec.multi) {
                const picked = await pickMediaMulti(spec.kind === "video" ? "video" : "image");
                if (!picked.length) return false;

                const valid = picked.filter((p) => !aspectError(contentType, p.width, p.height));
                if (!valid.length) {
                    setError(aspectError(contentType, picked[0].width, picked[0].height));
                    return false;
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
                return true;
            }

            const cropAspect = spec.aspectRatios[0] ? parseAspectRatio(spec.aspectRatios[0]) : undefined;
            const picked = await pickMedia(spec.kind === "video" ? "video" : "image", cropAspect);
            if (!picked) return false;

            const ratioError = aspectError(contentType, picked.width, picked.height);
            if (ratioError) {
                setError(ratioError);
                return false;
            }

            setUploading(true);
            const uploaded = await uploadPicked(picked);
            onAttachmentsChange([uploaded]);
            return true;
        } catch (e) {
            setError("Upload failed. Please try again.");
            return false;
        } finally {
            setUploading(false);
        }
    }, [attachments, contentType, spec.kind, spec.multi, spec.aspectLabel, spec.aspectRatios, uploadPicked, onAttachmentsChange]);

    // Picking the upload lane goes straight to the picker — a card that opens a
    // panel with one more button in it is a wasted step. Backing out of the
    // picker without choosing anything returns to the chooser.
    const pickLane = useCallback(
        async (next: MediaLane) => {
            if (next === "design") {
                onOpenDesign();
                return;
            }
            setPickedLane(next);
            if (next === "upload") {
                const added = await handleUpload();
                if (!added) setPickedLane((cur) => (cur === "upload" ? null : cur));
            }
        },
        [handleUpload, onOpenDesign]
    );

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

    const handleClear = useCallback(() => {
        setPickedLane(null);
        setFocusedSlide(undefined);
        setError(null);
        onClearMedia();
    }, [onClearMedia]);

    const uploadLabel = spec.multi
        ? "Upload slides"
        : spec.kind === "video"
            ? "Upload a video"
            : "Upload an image";

    // ── Previews ─────────────────────────────────────────────────────────────

    /**
     * The design canvas itself, mounted read-only. This is what makes an
     * un-rendered design visible outside the Studio; the frame scales the design
     * to the stage width, so the aspect ratio is exact by construction.
     */
    const renderDesignCanvas = (preview: DesignPreview) => {
        const pad = 2;
        const byWidth = Math.max(stageWidth - pad, 0);
        const byHeight = preview.height > 0 ? (MAX_PREVIEW_H * preview.width) / preview.height : byWidth;
        const displayWidth = Math.min(byWidth || 320, byHeight);
        if (!(displayWidth > 0)) return null;
        return (
            <View style={styles.canvasWrap}>
                <DesignFrame
                    html={preview.html}
                    width={preview.width}
                    height={preview.height}
                    displayWidth={displayWidth}
                    onMessage={() => {
                        /* read-only preview — the Studio owns interaction */
                    }}
                />
                {preview.slideCount > 1 ? (
                    <View style={styles.slideCountChip}>
                        <Text style={styles.slideCountText}>{preview.slideCount} slides</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * Slide strip. `editable` is false for the design lane: there, slide order
     * belongs to the canvas, and reordering the rendered attachments would
     * silently desync them from the design they came from.
     */
    const renderSlides = (editable: boolean) => {
        const tileAspect = previewAspect(contentType);
        const tileW = xl ? 150 : 128;
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
                {attachments.map((a, i) => {
                    const isVideo = isVideoAttachment(a);
                    const vUrl = isVideo ? videoUrlOf(a) : null;
                    const canPreview = isVideo ? !!vUrl : !!a.imageUrl;
                    const focused = focusedSlide === i;
                    return (
                        <View key={`${a.imageUrl ?? a.playUrl ?? "a"}-${i}`} style={styles.slideCol}>
                            <Pressable
                                style={[
                                    styles.slideTile,
                                    { width: tileW, aspectRatio: tileAspect },
                                    focused && styles.slideTileFocused,
                                ]}
                                onPress={canPreview ? () => openPreview(a) : undefined}
                                disabled={!canPreview}
                                accessibilityLabel={`Preview slide ${i + 1}`}
                            >
                                {isVideo ? (
                                    vUrl ? (
                                        <Video
                                            source={{ uri: vUrl }}
                                            style={styles.fill}
                                            resizeMode={ResizeMode.COVER}
                                            shouldPlay={false}
                                            isMuted
                                            useNativeControls={false}
                                        />
                                    ) : (
                                        <View style={styles.mediaFallback}>
                                            <FontAwesomeIcon icon={faPlay} size={18} color={colors.textSecondary} />
                                        </View>
                                    )
                                ) : a.imageUrl ? (
                                    <Image source={{ uri: a.imageUrl }} style={styles.fill} resizeMode="cover" />
                                ) : (
                                    <View style={styles.mediaFallback}>
                                        <FontAwesomeIcon icon={faImage} size={18} color={colors.textSecondary} />
                                    </View>
                                )}

                                <View style={styles.orderBadge}>
                                    <Text style={styles.orderBadgeText}>{i + 1}</Text>
                                </View>

                                {editable && !readOnly ? (
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

                            {editable && !readOnly && attachments.length > 1 ? (
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

                            {editable && !readOnly && lane === "generate" ? (
                                <Pressable
                                    style={({ pressed }) => [styles.slideAiBtn, pressed && styles.pressed]}
                                    onPress={() => setFocusedSlide(focused ? undefined : i)}
                                    accessibilityLabel={`Edit slide ${i + 1} with AI`}
                                >
                                    <FontAwesomeIcon
                                        icon={faWandMagicSparkles}
                                        size={10}
                                        color={focused ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[styles.slideAiText, focused && styles.slideAiTextActive]}>
                                        {focused ? "Editing" : "Edit"}
                                    </Text>
                                </Pressable>
                            ) : null}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };

    // ── Lane bodies ──────────────────────────────────────────────────────────

    const laneActions = (primary?: { label: string; icon: typeof faPen; onPress: () => void }) => (
        <View style={styles.laneActionRow}>
            {primary ? (
                <Pressable
                    style={({ pressed }) => [styles.laneBtn, pressed && styles.pressed]}
                    onPress={primary.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={primary.label}
                >
                    <FontAwesomeIcon icon={primary.icon} size={12} color={colors.primary} />
                    <Text style={styles.laneBtnText}>{primary.label}</Text>
                </Pressable>
            ) : null}
            <Pressable
                style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel={clearLabelFor(lane!, contentType)}
            >
                <FontAwesomeIcon icon={faTrashCan} size={11} color={colors.textSecondary} />
                <Text style={styles.clearBtnText}>{clearLabelFor(lane!, contentType)}</Text>
            </Pressable>
        </View>
    );

    const renderDesignLane = () => {
        // Prefer the live canvas: it is correct before AND after a render, and it
        // is the only way to see a design that hasn't been exported yet.
        const body = designPreview
            ? renderDesignCanvas(designPreview)
            : hasMedia
                ? spec.multi
                    ? renderSlides(false)
                    : <MediaAssetPreview
                        attachment={attachments[0]}
                        contentType={contentType}
                        maxHeight={MAX_PREVIEW_H}
                        onPress={openPreview}
                    />
                : (
                    <View style={styles.laneLoading}>
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                        <Text style={styles.laneLoadingText}>Loading your design…</Text>
                    </View>
                );

        return (
            <>
                {body}
                {!readOnly
                    ? laneActions({ label: "Edit in Design Studio", icon: faPen, onPress: onOpenDesign })
                    : null}
            </>
        );
    };

    const renderGenerateLane = () => (
        <>
            {hasMedia ? (
                spec.multi ? renderSlides(true) : <MediaAssetPreview
                        attachment={attachments[0]}
                        contentType={contentType}
                        maxHeight={MAX_PREVIEW_H}
                        onPress={openPreview}
                    />
            ) : null}

            {!readOnly && onGenerateImage ? (
                <ImageGenPanel
                    contentType={contentType}
                    generating={imageGenerating}
                    error={imageGenError}
                    hasImages={hasMedia}
                    focusedSlideIndex={focusedSlide}
                    onClearFocusedSlide={() => setFocusedSlide(undefined)}
                    onGenerate={(prompt, style) => onGenerateImage(prompt, style, focusedSlide)}
                    onCancel={hasMedia ? undefined : () => setPickedLane(null)}
                />
            ) : null}

            {hasMedia && !readOnly ? laneActions() : null}
        </>
    );

    const renderUploadLane = () => (
        <>
            {hasMedia ? (
                spec.multi ? renderSlides(true) : <MediaAssetPreview
                        attachment={attachments[0]}
                        contentType={contentType}
                        maxHeight={MAX_PREVIEW_H}
                        onPress={openPreview}
                    />
            ) : null}

            {!readOnly ? (
                <View style={styles.laneActionRow}>
                    {spec.multi ? (
                        <Pressable
                            style={({ pressed }) => [styles.laneBtn, pressed && styles.pressed]}
                            onPress={handleUpload}
                            disabled={uploading}
                            accessibilityRole="button"
                            accessibilityLabel="Add slides"
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <FontAwesomeIcon icon={faPlus} size={12} color={colors.primary} />
                            )}
                            <Text style={styles.laneBtnText}>{uploading ? "Uploading…" : "Add slides"}</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [styles.laneBtn, pressed && styles.pressed]}
                            onPress={handleUpload}
                            disabled={uploading}
                            accessibilityRole="button"
                            accessibilityLabel={`Replace — ${uploadLabel.toLowerCase()}`}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <FontAwesomeIcon icon={faArrowUpFromBracket} size={12} color={colors.primary} />
                            )}
                            <Text style={styles.laneBtnText}>{uploading ? "Uploading…" : "Replace"}</Text>
                        </Pressable>
                    )}
                    {hasMedia ? (
                        <Pressable
                            style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
                            onPress={handleClear}
                            accessibilityRole="button"
                            accessibilityLabel={clearLabelFor("upload", contentType)}
                        >
                            <FontAwesomeIcon icon={faTrashCan} size={11} color={colors.textSecondary} />
                            <Text style={styles.clearBtnText}>{clearLabelFor("upload", contentType)}</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
        </>
    );

    const renderBody = () => {
        if (!lane) {
            // Locked + empty: there is nothing to show and nothing to do, so say
            // so in one line rather than rendering a large dead placeholder.
            if (readOnly) {
                return (
                    <Text style={styles.lockedEmpty}>
                        {spec.multi ? "No slides on this content." : `No ${spec.kind} on this content.`}
                    </Text>
                );
            }
            return <MediaLaneCards contentType={contentType} onPick={pickLane} />;
        }
        if (lane === "design") return renderDesignLane();
        if (lane === "generate") return renderGenerateLane();
        return renderUploadLane();
    };

    return (
        <View style={styles.card} onLayout={onStageLayout}>
            <View style={styles.headerRow}>
                <Text style={styles.cardTitle}>{spec.kind === "video" ? "Video" : "Visuals"}</Text>
                {spec.aspectLabel ? (
                    <View style={styles.ratioChip}>
                        <Text style={styles.ratioChipText}>{spec.aspectLabel}</Text>
                    </View>
                ) : null}
            </View>

            {renderBody()}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

function useStyles(colors: ReturnType<typeof Colors>) {
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
            fontSize: fs(15),
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
            fontSize: fs(11),
            fontWeight: "700",
            letterSpacing: 0.4,
            color: colors.primary,
        },

        // Previews are shaped by aspectRatio, never by a fixed height.
        previewBox: {
            alignSelf: "center",
            width: "100%",
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
        },
        fill: {
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

        canvasWrap: {
            alignItems: "center",
        },
        slideCountChip: {
            marginTop: 8,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 7,
            backgroundColor: colors.tag,
        },
        slideCountText: {
            fontSize: fs(11),
            fontWeight: "700",
            color: colors.textSecondary,
        },

        carousel: {
            gap: 12,
            paddingVertical: 2,
        },
        slideCol: {
            alignItems: "center",
            gap: 6,
        },
        slideTile: {
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.tag,
            alignItems: "center",
            justifyContent: "center",
        },
        slideTileFocused: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 10,
            shadowOpacity: 0.9,
            elevation: 6,
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
            fontSize: fs(12),
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
        slideAiBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: colors.tag,
        },
        slideAiText: {
            fontSize: fs(11),
            fontWeight: "700",
            color: colors.textSecondary,
        },
        slideAiTextActive: {
            color: colors.primary,
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

        laneActionRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
        },
        laneBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 10,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        laneBtnText: {
            fontSize: fs(13),
            fontWeight: "700",
            color: colors.primary,
        },
        clearBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 10,
        },
        clearBtnText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },

        laneLoading: {
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 28,
        },
        laneLoadingText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        lockedEmpty: {
            fontSize: fs(13),
            lineHeight: lh(19),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        errorText: {
            fontSize: fs(12),
            color: colors.toastError,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default MediaStage;
