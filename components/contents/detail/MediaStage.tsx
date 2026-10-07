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
import { IContentAudio, IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import DesignRenderBar, { DesignRenderChip, DesignRenderState } from "./DesignRenderBar";
import { useDesignRender } from "./design-stage/use-design-render";
import { useDesignWriters } from "./design-stage/use-design-writers";
import { DesignFrameHandle } from "./design-stage/bridge";

/** Tallest a preview may get, so a 9:16 design doesn't push the page apart. */
const MAX_PREVIEW_H = 420;

interface MediaStageProps {
    contentType: ContentType;
    /** Needed to persist a render straight from the stage. */
    contentId?: string | null;
    attachments: Attachment[];
    onAttachmentsChange: (next: Attachment[]) => void;
    /** Authoritative lane record from the content doc. */
    source?: MediaSource;
    /** Pointer to the current design revision, when the design lane owns the media. */
    designRef?: IContentDesignRef;
    /** Live HTML of that revision, for previewing a canvas that isn't rendered yet. */
    designPreview?: DesignPreview | null;
    /** Soundtrack/voiceover muxed into a video render. */
    audio?: IContentAudio;
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
    contentId = null,
    attachments,
    onAttachmentsChange,
    source,
    designRef,
    designPreview,
    audio,
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
    // The preview frame, so the stage can drive a render itself rather than
    // sending the user to the Studio to find the button.
    const frameRef = useRef<DesignFrameHandle | null>(null);

    const hasMedia = attachments.length > 0;

    /**
     * Has the design on screen been turned into a publishable asset?
     *
     * `renderUrl` is written onto the REVISION when it is rendered, and
     * `designRef.revisionId` points at the current one — so an empty renderUrl
     * means this exact design has never been exported, even when the content
     * still carries attachments captured from an earlier revision. That second
     * case ("stale") is the one worth catching: it looks completely finished and
     * would publish a version that doesn't match the canvas.
     */
    const designRenderState: DesignRenderState | null = useMemo(() => {
        if (!designPreview) return null;
        if (designPreview.renderUrl) return "current";
        return hasMedia ? "stale" : "never";
    }, [designPreview, hasMedia]);

    const designWriters = useDesignWriters(contentId);
    const designRender = useDesignRender({
        isVideoDesign: designPreview?.docType === "video",
        slideCount: designPreview?.slideCount ?? 1,
        revisionId: designRef?.revisionId,
        audio,
        setRenders: designWriters.setRenders,
        setVideoRender: designWriters.setVideoRender,
    });

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
    const renderDesignCanvas = (preview: DesignPreview, availableWidth?: number) => {
        const pad = 2;
        const byWidth = Math.max((availableWidth ?? stageWidth) - pad, 0);
        const byHeight = preview.height > 0 ? (MAX_PREVIEW_H * preview.width) / preview.height : byWidth;
        const displayWidth = Math.min(byWidth || 320, byHeight);
        if (!(displayWidth > 0)) return null;
        return (
            <View style={styles.canvasWrap}>
                {/* The frame and its overlay share this box. The overlay must be
                    positioned against the CANVAS, not against the centering
                    wrapper: absoluteFillObject sets both left:0 and right:0, so
                    adding a width pinned it to the wrapper's left edge and the
                    badge landed in the gutter beside the design. Sizing the
                    parent instead means the overlay just fills it. */}
                <View style={[styles.canvasFrame, { width: displayWidth }]}>
                    <DesignFrame
                        ref={frameRef}
                        html={preview.html}
                        width={preview.width}
                        height={preview.height}
                        displayWidth={displayWidth}
                        // Interaction still belongs to the Studio; the stage only
                        // listens for render traffic so it can drive a capture.
                        onMessage={designRender.onFrameMessage}
                    />
                    {/* The canvas is an iframe/WebView — it advertises nothing on
                        its own, while the rendered video beside it has a play
                        badge. This is its sibling: always visible (hover doesn't
                        exist on touch), and it doubles as the Design Studio entry
                        point, which was previously a small text button below the
                        fold. Kept available when readOnly: looking at a design is
                        not what the lock protects, and hiding it made the design
                        of a published post permanently unviewable. */}
                    <Pressable
                        style={({ pressed, hovered }: any) => [
                            styles.canvasOverlay,
                            hovered && styles.canvasOverlayHovered,
                            pressed && styles.canvasOverlayPressed,
                        ]}
                        onPress={onOpenDesign}
                        accessibilityRole="button"
                        accessibilityLabel={readOnly ? "View this design in Design Studio" : "Edit this design in Design Studio"}
                    >
                        <View style={styles.canvasBadge}>
                            <FontAwesomeIcon icon={faPen} size={12} color={colors.onPrimary} />
                            <Text style={styles.canvasBadgeText}>Design Studio</Text>
                        </View>
                    </Pressable>
                </View>
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

    // Clear only. The design lane's primary action moved onto the canvas itself
    // (see renderDesignCanvas) and the other lanes never had one here.
    const laneActions = () => (
        <View style={styles.laneActionRow}>
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

        /** The exported asset — what actually gets published. */
        // Keyed off what was ACTUALLY rendered, not spec.multi. A video design
        // captured as slides produces several PNGs even on a reel (where
        // spec.multi is false) — showing only attachments[0] there presents one
        // slide as if it were the whole output, and if that slide happens to be
        // a near-empty opening frame it reads as a blank box.
        const renderedView = (half?: boolean) =>
            attachments.length > 1 ? (
                renderSlides(false)
            ) : (
                <MediaAssetPreview
                    attachment={attachments[0]}
                    contentType={contentType}
                    maxHeight={half ? MAX_PREVIEW_H * 0.72 : MAX_PREVIEW_H}
                    onPress={openPreview}
                />
            );

        // Once the design has been rendered, show BOTH: the canvas is what you
        // edit, the asset is what ships. Previously the canvas won this ternary
        // unconditionally, so the rendered output — the only thing that actually
        // publishes — could never be seen, while a "Rendered" chip asserted it
        // existed. Side by side also makes a mismatch self-evident.
        const paired = designPreview && hasMedia && designRenderState === "current";

        let body: React.ReactNode;
        if (paired && designPreview) {
            // Half the stage minus the gap, so each canvas scales to its column.
            const halfWidth = Math.max((stageWidth - 14) / 2, 0);
            const colStyle = xl ? styles.pairCol : styles.pairColStacked;
            const pair = (
                <>
                    <View style={colStyle}>
                        <Text style={styles.pairLabel}>DESIGN</Text>
                        {renderDesignCanvas(designPreview, xl ? halfWidth : stageWidth)}
                        <Text style={styles.pairCaption}>
                            {designPreview.slideCount > 1
                                ? `${designPreview.slideCount} slides · what you edit`
                                : "What you edit"}
                        </Text>
                    </View>
                    <View style={colStyle}>
                        <Text style={styles.pairLabel}>RENDERED</Text>
                        {renderedView(xl)}
                        <Text style={styles.pairCaption}>What gets posted</Text>
                    </View>
                </>
            );
            // Side by side on desktop; stacked on a phone, where two columns
            // would leave each one too narrow to judge.
            body = <View style={xl ? styles.pairRow : styles.pairStack}>{pair}</View>;
        } else if (designPreview) {
            body = renderDesignCanvas(designPreview);
        } else if (hasMedia) {
            body = renderedView();
        } else {
            body = (
                <View style={styles.laneLoading}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                    <Text style={styles.laneLoadingText}>Loading your design…</Text>
                </View>
            );
        }

        return (
            <>
                {body}
                {designRenderState ? (
                    <DesignRenderBar
                        state={designRenderState}
                        label={designRender.label}
                        capturing={designRender.capturing}
                        progress={designRender.progress}
                        error={designRender.error}
                        onRender={() => designRender.startRender(frameRef.current)}
                        onDismissError={designRender.clearError}
                        readOnly={readOnly}
                    />
                ) : null}
                {/* No "Edit in Design Studio" here: the canvas badge above owns
                    that now. Keeping both would reintroduce the clutter this was
                    meant to remove. laneActions still carries Clear canvas. */}
                {!readOnly ? laneActions() : null}
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
                <View style={styles.headerChips}>
                    {designRenderState ? <DesignRenderChip state={designRenderState} /> : null}
                    {spec.aspectLabel ? (
                        <View style={styles.ratioChip}>
                            <Text style={styles.ratioChipText}>{spec.aspectLabel}</Text>
                        </View>
                    ) : null}
                </View>
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
        headerChips: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
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
        // Sized to the canvas and relatively positioned, so the overlay below
        // fills the design rather than the full-width centering wrapper.
        canvasFrame: {
            position: "relative",
            borderRadius: 10,
            overflow: "hidden",
        },
        // Sits over the design frame. Dimmed by default so the design still
        // reads, lifting on hover (web) / press.
        canvasOverlay: {
            ...StyleSheet.absoluteFillObject,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
        },
        canvasOverlayHovered: {
            backgroundColor: colors.backdrop,
        },
        canvasOverlayPressed: {
            backgroundColor: colors.backdrop,
            opacity: 0.85,
        },
        canvasBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 13,
            paddingVertical: 9,
            borderRadius: 22,
            backgroundColor: colors.backdropStrong,
        },
        canvasBadgeText: {
            fontSize: fs(12),
            fontWeight: "700",
            color: colors.onPrimary,
        },
        // Design | Rendered, once both exist.
        pairRow: {
            flexDirection: "row",
            gap: 14,
        },
        pairCol: {
            flex: 1,
            minWidth: 0,
        },
        pairColStacked: {
            width: "100%",
        },
        pairStack: {
            gap: 18,
        },
        pairLabel: {
            fontSize: fs(11),
            fontWeight: "700",
            letterSpacing: 0.4,
            color: colors.textSecondary,
            marginBottom: 6,
        },
        pairCaption: {
            fontSize: fs(11),
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 7,
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
