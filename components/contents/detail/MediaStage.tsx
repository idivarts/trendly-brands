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
import SectionLabel from "@/components/contents/detail/SectionLabel";
import { useBreakpoints } from "@/hooks";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { IContentCompositionRef } from "@/shared-libs/firestore/trendly-pro/models/composition";
import { pickMedia, pickMediaMulti, PickedAsset } from "@/shared-libs/utils/media-picker";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpFromBracket,
    faChevronLeft,
    faChevronRight,
    faImage,
    faFilm,
    faPen,
    faPhotoFilm,
    faPlay,
    faPlus,
    faTrashCan,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import VideoSurface from "@/components/shared/VideoSurface";
import { ResizeMode } from "expo-av";
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
import { AssetKind, IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { recordAsset } from "@/hooks/use-asset-library";
import AssetsPanel from "./AssetsPanel";
import DesignFrame from "./design-stage/DesignFrame";
import { DesignPreview } from "./design-stage/use-design-preview";
import MediaAssetPreview from "./MediaAssetPreview";
import MediaLaneCards from "./MediaLaneCards";
import Composer, { ComposerBrief } from "./composer/Composer";
import { clearLabelFor, lanesFor, MediaLane, MediaSource, resolveMediaLane } from "./media-lane";
import { aspectError, canonicalSize, MEDIA_SPEC, parseAspectRatio, previewAspect } from "./media-spec";
import DesignRenderBar, { DesignRenderChip, DesignRenderState } from "./DesignRenderBar";
import { useDesignRender } from "./design-stage/use-design-render";
import { useContentComposition } from "./design-stage/use-content-composition";
import { useFootageAsset } from "./design-stage/use-footage-asset";
import {
    appendClip,
    clipFromAsset,
    findClip,
    newClipId,
    patchFootage,
} from "./design-stage/composition-edits";
import { durationOptionsFor, secondsOf, useMediaModels } from "@/hooks/use-media-models";
import { Composition } from "@/shared-libs/design/composition-runtime";
import { HttpError, HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { COMPOSITION_FPS } from "./design-stage/use-content-composition";
import { DesignFrameHandle } from "./design-stage/bridge";
import { track } from "@/shared-libs/utils/analytics";

/** Tallest a preview may get, so a 9:16 design doesn't push the page apart. */
const MAX_PREVIEW_H = 420;

/**
 * How long to wait for a video to be READ before handing the cut to the AI
 * anyway.
 *
 * Ingest normally takes a minute or two — the render worker measures the file
 * and samples frames, then the backend transcribes and describes them. Three
 * minutes is comfortably past that without being a wait anybody sits through on
 * purpose, and the AI is still useful on a video it cannot read as long as it
 * is told so.
 */
const READ_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * The resolution to ask a video model for.
 *
 * The highest it offers, because the generation is charged per SECOND and not
 * per pixel — asking for less saves nothing and gives the user a softer clip to
 * publish. Falls through to whatever the model lists when it is something we
 * have not seen.
 */
function preferredResolution(resolutions?: string[]): string | undefined {
    if (!resolutions?.length) return undefined;
    for (const want of ["1080p", "720p", "540p"]) {
        if (resolutions.includes(want)) return want;
    }
    return resolutions[0];
}

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
    /**
     * Pointer to the authored timeline, when there is one. Needed here for the
     * render bar alone: a composition wins over a design when the backend
     * resolves what to render, so the chip and the progress have to follow the
     * composition's revision or they describe media nobody is making.
     */
    compositionRef?: IContentCompositionRef;
    /** Live HTML of that revision, for previewing a canvas that isn't rendered yet. */
    designPreview?: DesignPreview | null;
    /** Open the Design Studio — to edit an existing design on the full canvas. */
    onOpenDesign: () => void;
    /**
     * Send the composer's brief to the AI. Starting a design no longer means
     * leaving the page: the brief is collected here, beside the caption it
     * belongs with, and only the finished canvas is worth a takeover.
     */
    onSubmitBrief?: (brief: ComposerBrief) => void;
    /** A brief is with the AI and no design has landed yet. */
    briefPending?: boolean;
    /** What the user asked for, echoed back while they wait. */
    briefText?: string | null;
    /**
     * The live step the AI is on, pushed by the backend as it calls each tool.
     * Empty between steps — fall back to generic copy rather than blanking.
     */
    briefStatus?: string;
    /** Clear the media (and the design pointer) back to the empty state. */
    onClearMedia: () => void;
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
    compositionRef,
    designPreview,
    onOpenDesign,
    onSubmitBrief,
    briefPending = false,
    briefText,
    briefStatus,
    onClearMedia,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const spec = MEDIA_SPEC[contentType];
    const { uploadFileUri } = useAWSContext();
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [uploading, setUploading] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
    // Measured width of the stage, needed to scale the design frame.
    const [stageWidth, setStageWidth] = useState(0);
    // Slide-strip scrolling. The strip is horizontally scrollable, which a
    // trackpad handles and a plain mouse wheel does not — without arrows, every
    // slide past the visible ones is simply unreachable with a mouse.
    const stripRef = useRef<ScrollView | null>(null);
    const [stripX, setStripX] = useState(0);
    const [stripViewW, setStripViewW] = useState(0);
    const [stripContentW, setStripContentW] = useState(0);

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

    // The design is passed so the hook can derive the implicit one-clip timeline
    // every video already has: appending a generated clip to a content that has
    // a design has to put the design FIRST, not replace it.
    const timelineDesign = useMemo(
        () =>
            designRef?.revisionId && designPreview?.docType === "video"
                ? {
                      revisionId: designRef.revisionId,
                      width: designPreview.width,
                      height: designPreview.height,
                      durationMs: designPreview.durationMs ?? 0,
                  }
                : null,
        [
            designRef?.revisionId,
            designPreview?.docType,
            designPreview?.width,
            designPreview?.height,
            designPreview?.durationMs,
        ]
    );
    const timeline = useContentComposition(contentId, compositionRef, timelineDesign);
    const renderTarget = timeline.authored && timeline.revision
        ? ({
              targetKind: "composition" as const,
              revisionId: timeline.revision.id,
              renderStatus: timeline.revision.renderStatus,
              renderProgress: timeline.revision.renderProgress,
              renderError: timeline.revision.renderError,
          })
        : ({
              targetKind: "design" as const,
              revisionId: designRef?.revisionId,
              renderStatus: designPreview?.renderStatus,
              renderProgress: designPreview?.renderProgress,
              renderError: designPreview?.renderError,
          });
    const designRender = useDesignRender({
        contentId,
        isVideoDesign: designPreview?.docType === "video",
        slideCount: designPreview?.slideCount ?? 1,
        ...renderTarget,
    });

    // The lane the data says owns this media, and the one the user just picked
    // (before any media exists to prove it). Resolved always wins.
    const resolvedLane = useMemo(
        () => resolveMediaLane({ designRef, compositionRef, attachments, source }),
        [designRef, compositionRef, attachments, source]
    );
    const [pickedLane, setPickedLane] = useState<MediaLane | null>(null);
    const lane = resolvedLane ?? pickedLane;

    // Once the data commits a lane, drop the local pick so the two can't disagree
    // (e.g. the user picks "generate", the generation lands, `source` takes over).
    useEffect(() => {
        if (resolvedLane) setPickedLane(null);
    }, [resolvedLane]);

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

    /**
     * Upload a picked file AND file it in the brand's library.
     *
     * The second half is not bookkeeping. A library row is what makes the file
     * reachable from another post, and for a VIDEO it is also what starts
     * ingest — the backend queues the probe and the frame sampling when a new
     * video row is created, and the transcript and shot list follow from that.
     * An upload that is never recorded is usable here and nowhere else.
     *
     * The record is awaited rather than fired off, so a user who uploads and
     * immediately opens the library sees what they just added; it fails
     * silently by design (see `recordAsset`), because the file is already up.
     */
    const uploadAndFile = useCallback(
        async (p: PickedAsset): Promise<Attachment> => {
            const uploaded = await uploadPicked(p);
            // `playUrl` for a video, NOT `videoUrlOf` — that prefers the Apple
            // HLS url on iOS, which is a playlist. The library's url is what
            // ffprobe and ffmpeg are pointed at when the video is ingested, and
            // what a composition clip decodes, so it has to be the plain file.
            const url = isVideoAttachment(uploaded)
                ? uploaded.playUrl ?? uploaded.appleUrl ?? ""
                : uploaded.imageUrl ?? "";
            await recordAsset(brandId, {
                kind: (p.type === "video" ? "video" : "image") as AssetKind,
                url,
                width: p.width,
                height: p.height,
                originContentId: contentId ?? undefined,
            });
            return uploaded;
        },
        [uploadPicked, brandId, contentId]
    );

    /**
     * An asset chosen from the library becomes this content's media.
     *
     * Converted to an `Attachment` rather than stored as a reference: the whole
     * publish pipeline, every preview and the slide strip read attachments, and
     * a second shape meaning the same thing is how a preview and an export come
     * to disagree. The library row stays where it is — the same asset can be on
     * two posts, which is the point.
     */
    const attachmentFor = useCallback((asset: IAsset): Attachment => {
        if (asset.kind === "video") {
            // Both urls get the same value: the library stores one playable
            // url, and `videoUrlOf` picks per platform from a pair that an
            // upload happens to have. Giving it one url it can always use beats
            // leaving the iOS branch empty.
            return { type: "video", playUrl: asset.url, appleUrl: asset.url };
        }
        return {
            type: "image",
            imageUrl: asset.url,
            ...(asset.thumbUrl ? { thumbUrl: asset.thumbUrl } : {}),
        };
    }, []);

    const handleLibraryPick = useCallback(
        (picked: IAsset[]) => {
            if (!picked.length) return;
            setError(null);
            const next = picked.map(attachmentFor);
            onAttachmentsChange(spec.multi ? [...attachments, ...next] : [next[0]]);
            setPickedLane("upload");
            track("content_media_from_library", {
                count: next.length,
                sources: Array.from(new Set(picked.map((a) => a.source))).join(","),
            });
        },
        [attachmentFor, attachments, spec.multi, onAttachmentsChange]
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
                const uploaded = await Promise.all(valid.map(uploadAndFile));
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
            const uploaded = await uploadAndFile(picked);
            onAttachmentsChange([uploaded]);
            return true;
        } catch (e) {
            setError("Upload failed. Please try again.");
            return false;
        } finally {
            setUploading(false);
        }
    }, [attachments, contentType, spec.kind, spec.multi, spec.aspectLabel, spec.aspectRatios, uploadAndFile, onAttachmentsChange]);

    // ── The two video approaches that do not go through the chat ────────────
    //
    // A generated clip and a cut of your own footage are not briefs for the AI
    // to write a design from — they are a clip on the timeline and a provider
    // call. Routing them through the chat (as every other approach is) would
    // mean the model paraphrasing a request it cannot act on.
    const { models: videoModels } = useMediaModels("video");
    // What reads an upload before the AI cuts it. Registry-driven like the
    // video models, so switching transcription model is a field edit.
    const { models: sttModels } = useMediaModels("stt");
    const [briefBusy, setBriefBusy] = useState(false);
    // The footage whose ingest we are waiting on before handing the cut to the
    // AI, and the brief to hand over when it lands.
    const [reading, setReading] = useState<{
        assetId: string;
        /** The clip this upload was placed as, so its length can be corrected. */
        clipId: string;
        brief: ComposerBrief;
    } | null>(null);
    // Set when the wait has gone on too long. Explicit state rather than a
    // comparison against a stored timestamp, because nothing re-renders on its
    // own while we are only waiting for a clock.
    const [readTimedOut, setReadTimedOut] = useState(false);
    const { asset: readingAsset } = useFootageAsset(reading?.assetId);

    /** The timeline to append to: the stored one, the implicit one, or a new one. */
    const baseComposition = useCallback((): Composition => {
        if (timeline.composition) return timeline.composition;
        const { width, height } = canonicalSize(contentType);
        return { width, height, fps: COMPOSITION_FPS, tracks: [{ kind: "video", clips: [] }] };
    }, [timeline.composition, contentType]);

    /**
     * Queue a generated clip.
     *
     * Order matters and is not arbitrary: the clip is SAVED FIRST, because the
     * generate endpoint records the job against a composition revision and a
     * clip id, and writes the finished url onto exactly that clip. Submitting
     * first and saving after would leave a job whose result has nowhere to land.
     *
     * If the submit is refused the clip is taken back off. A clip that can never
     * land makes the whole timeline unrenderable, so leaving it there would
     * break a video the user could otherwise still render.
     */
    const startGeneratedClip = useCallback(
        async (brief: ComposerBrief) => {
            const model = videoModels.find((m) => m.id === brief.modelId) ?? videoModels[0];
            if (!brandId || !contentId || !model) return;

            const secs = secondsOf(brief.settings.length) ||
                secondsOf(durationOptionsFor(model)[0]);
            const startFrameUrl = model.startFrame ? brief.refs.startFrame?.imageUrl : undefined;
            const endFrameUrl = model.endFrame ? brief.refs.endFrame?.imageUrl : undefined;
            const base = baseComposition();
            // Whether there was a timeline here BEFORE this clip, which is what
            // decides how to undo a failed submit.
            const hadTimeline = timeline.authored;
            const clipId = newClipId();
            const withClip = appendClip(base, {
                id: clipId,
                durationMs: Math.max(1, secs) * 1000,
                source: {
                    kind: "genvideo",
                    model: model.id,
                    prompt: brief.prompt,
                    // Spread rather than assigned: an absent frame has to leave
                    // the KEY out, not set it to undefined, which Firestore
                    // refuses outright. (The writer prunes these too — this is
                    // the shape being honest at the source.)
                    //
                    // Only sent where the model can use them: the composer does
                    // not draw a slot the model cannot honour, but a ref kept
                    // from another approach would still be in state.
                    ...(startFrameUrl ? { startFrameUrl } : {}),
                    ...(endFrameUrl ? { endFrameUrl } : {}),
                },
            });

            setBriefBusy(true);
            try {
                const revisionId = await timeline.save(withClip);
                if (!revisionId) throw new Error("no revision");

                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/contents/${contentId}/clips/generate`,
                    {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            compositionId: revisionId,
                            clipId,
                            modelId: model.id,
                            prompt: brief.prompt,
                            aspectRatio: spec.aspectRatios[0],
                            durationSecs: secs,
                            resolution: preferredResolution(model.resolutions),
                            // The model's own sound — dialogue, ambience — when
                            // it can make any and the brief did not turn it off.
                            // It becomes a lane in the render's mix rather than
                            // a replacement for the soundtrack: the bed ducks
                            // under it the way it ducks under a voiceover.
                            generateAudio:
                                !!model.nativeAudio && brief.settings.sound !== "Off",
                            startFrameUrl,
                            endFrameUrl,
                        }),
                    }
                );
                track("content_brief_submitted", {
                    approach: "genvideo",
                    has_refs: !!(brief.refs.startFrame || brief.refs.endFrame),
                    settings_changed: true,
                });
                Toaster.success(
                    "Generating your clip",
                    "It takes a few minutes. You can leave this page — it lands on the timeline."
                );
                onOpenDesign();
            } catch (err) {
                // Undo the clip. Which undo depends on what was here first: a
                // timeline somebody arranged gets restored without the clip,
                // but a content that had none must be left with NONE — saving
                // the empty base would point it at a timeline with no clips,
                // which cannot render and is worse than the nothing it had.
                if (hadTimeline) {
                    await timeline.save(base).catch(() => undefined);
                } else {
                    await timeline.discard().catch(() => undefined);
                }
                if (err instanceof HttpError && err.status === 402) {
                    track("entitlement_blocked", {
                        reason: String(err.data?.reason ?? "tokens_exhausted"),
                        feature: "generative_video",
                    });
                    setError(
                        err.data?.reason === "plan_required"
                            ? "Generated video needs a higher plan. Upgrade to use this model."
                            : "You're out of AI tokens, so this clip can't be generated. Top up or upgrade."
                    );
                } else {
                    const detail = await HttpWrapper.extractErrorMessage(err).catch(() => null);
                    setError(detail || "We couldn't start that clip. Please try again.");
                }
            } finally {
                setBriefBusy(false);
            }
        },
        [
            brandId,
            contentId,
            videoModels,
            baseComposition,
            timeline,
            spec.aspectRatios,
            onOpenDesign,
        ]
    );

    /**
     * Place uploaded footage, then hand the cut to the AI.
     *
     * Two deliberate steps. The clip goes on the timeline IMMEDIATELY, so the
     * footage is usable — trimmable by hand, renderable — whatever the AI does
     * next. Then the brief waits for INGEST: the whole promise of this approach
     * is that the AI reads the footage first, and handing it the brief while the
     * transcript is still being made produces a model that says it will cut the
     * video later. `useFootageAsset` is a live listener, so the wait ends the
     * moment the backend writes the transcript and the shot list.
     */
    const startFootageCut = useCallback(
        async (brief: ComposerBrief) => {
            const video = brief.refs.sourceVideo;
            const url = video?.playUrl ?? video?.appleUrl;
            if (!brandId || !url) return;

            setBriefBusy(true);
            try {
                const assetId = await recordAsset(brandId, {
                    kind: "video",
                    url,
                    originContentId: contentId ?? undefined,
                });
                let clipId = "";
                if (assetId) {
                    // Placed from the library row, so the clip carries the
                    // assetId — which is what lets the inspector find the
                    // transcript and the shot list again later.
                    const clip = clipFromAsset({
                        id: assetId,
                        kind: "video",
                        source: "upload",
                        url,
                        createdAt: Date.now(),
                    });
                    clipId = clip.id;
                    await timeline.save(appendClip(baseComposition(), clip));
                }
                track("content_brief_submitted", {
                    approach: "footage",
                    has_refs: true,
                    settings_changed: true,
                });
                if (!assetId) {
                    // No library row means no ingest: the footage is placed and
                    // trimmable, but there is nothing for the AI to read.
                    setError(
                        "We couldn't file that video, so the AI can't read it. It's on the timeline — trim it by hand, or try the upload again."
                    );
                    return;
                }
                setReadTimedOut(false);
                setReading({ assetId, clipId, brief });
            } catch {
                setError("We couldn't start that. Please try again.");
            } finally {
                setBriefBusy(false);
            }
        },
        [brandId, contentId, timeline, baseComposition]
    );

    /**
     * Hand the waiting brief over once the footage has been read.
     *
     * Also hands it over on a FAILED ingest and after a few minutes of nothing,
     * because the AI is still useful on a video it cannot read — it just has to
     * be told so rather than left to discover an empty transcript.
     */
    useEffect(() => {
        if (!reading || !onSubmitBrief) return;
        const status = readingAsset?.ingest?.status;
        if (status !== "done" && status !== "failed" && !readTimedOut) return;

        // Said to the model as a NOTE on the brief rather than folded into the
        // user's own words: it is instruction about how to act, and the user did
        // not write it.
        // The real length, now that something has measured it. A freshly
        // uploaded video has none — the picker does not report one — so it was
        // placed at the default clip length, and leaving it there would have
        // the timeline claim three seconds of a thirty-second take.
        const measured = readingAsset?.ingest?.durationMs ?? readingAsset?.durationMs;
        if (reading.clipId && measured && timeline.composition) {
            const placed = findClip(timeline.composition, reading.clipId);
            const source = placed?.clip.source;
            // Only while it is still the whole take: a trim the user or the AI
            // has already made is theirs, not ours to stretch back out.
            if (source?.kind === "footage" && !source.outMs) {
                timeline.apply(
                    patchFootage(timeline.composition, reading.clipId, { outMs: measured }, measured)
                );
            }
        }

        const notes = [
            `The footage is on this content's timeline as asset ${reading.assetId}. ` +
                "Read it with get_footage, then cut it with cut_footage — keep the lines that " +
                "carry the message and drop the dead air.",
        ];
        if (status !== "done") {
            notes.push(
                "Its transcript is not ready yet. Say so plainly, and cut from the shot list if " +
                    "there is one rather than guessing at the words."
            );
        }
        setReading(null);
        onSubmitBrief?.({ ...reading.brief, notes });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reading, readingAsset?.ingest?.status, readTimedOut, onSubmitBrief]);

    // A stuck ingest must not leave the brief waiting forever.
    useEffect(() => {
        if (!reading) return;
        const t = setTimeout(() => setReadTimedOut(true), READ_TIMEOUT_MS);
        return () => clearTimeout(t);
    }, [reading]);

    /** Everything else is a brief for the AI, exactly as before. */
    const submitBrief = useCallback(
        (brief: ComposerBrief) => {
            if (brief.approach === "genvideo") {
                void startGeneratedClip(brief);
                return;
            }
            if (brief.approach === "footage") {
                void startFootageCut(brief);
                return;
            }
            onSubmitBrief?.(brief);
        },
        [startGeneratedClip, startFootageCut, onSubmitBrief]
    );

    // Picking the upload lane goes straight to the picker — a card that opens a
    // panel with one more button in it is a wasted step. Backing out of the
    // picker without choosing anything returns to the chooser.
    const pickLane = useCallback(
        async (next: MediaLane) => {
            // The lanes are mutually exclusive, so this is the cheapest read
            // there is on how people actually make media. Which APPROACH they
            // then take is a separate, finer-grained event on the composer —
            // this one only says AI-made versus their own file.
            track("content_media_lane_picked", { lane: next });
            setPickedLane(next);
            // "design" used to jump straight to the full-bleed Studio. It now
            // opens the composer in place: the brief is the thing being written,
            // and writing it beside the caption and the hashtags beats losing
            // the whole page to an empty canvas with a prompt box on it.
            if (next === "design") return;
            if (next === "upload") {
                const added = await handleUpload();
                if (!added) setPickedLane((cur) => (cur === "upload" ? null : cur));
            }
        },
        [handleUpload]
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
                        html={preview.html}
                        width={preview.width}
                        height={preview.height}
                        displayWidth={displayWidth}
                        // Interaction belongs to the Studio; here the frame is a
                        // picture. Rendering is a server call, so the stage has
                        // no reason to listen to the frame at all.
                        onMessage={() => undefined}
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
        const step = tileW + 12; // tile + carousel gap
        const canPrev = stripX > 2;
        const canNext = stripContentW - stripViewW - stripX > 2;
        const overflows = stripContentW > stripViewW + 2;
        const scrollBy = (dir: -1 | 1) => {
            const next = Math.max(
                0,
                Math.min(stripX + dir * step * 2, Math.max(stripContentW - stripViewW, 0))
            );
            stripRef.current?.scrollTo({ x: next, animated: true });
        };

        return (
            <View style={styles.stripWrap}>
            <ScrollView
                ref={stripRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
                scrollEventThrottle={16}
                onScroll={(e) => setStripX(e.nativeEvent.contentOffset.x)}
                onLayout={(e) => setStripViewW(e.nativeEvent.layout.width)}
                onContentSizeChange={(w) => setStripContentW(w)}
            >
                {attachments.map((a, i) => {
                    const isVideo = isVideoAttachment(a);
                    const vUrl = isVideo ? videoUrlOf(a) : null;
                    const canPreview = isVideo ? !!vUrl : !!a.imageUrl;
                    return (
                        <View key={`${a.imageUrl ?? a.playUrl ?? "a"}-${i}`} style={styles.slideCol}>
                            <Pressable
                                style={[
                                    styles.slideTile,
                                    { width: tileW, aspectRatio: tileAspect },
                                ]}
                                onPress={canPreview ? () => openPreview(a) : undefined}
                                disabled={!canPreview}
                                accessibilityLabel={`Preview slide ${i + 1}`}
                            >
                                {isVideo ? (
                                    vUrl ? (
                                        <VideoSurface
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
                                    // Prefer the render worker's WebP thumbnail:
                                    // these tiles are ~128px and the render is
                                    // 1080px. Falls back for uploads and for
                                    // anything rendered before thumbnails.
                                    <Image
                                        source={{ uri: a.thumbUrl ?? a.imageUrl }}
                                        style={styles.fill}
                                        resizeMode="cover"
                                    />
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

                        </View>
                    );
                })}
            </ScrollView>

            {/* Arrows, not just scroll. A horizontal ScrollView is reachable with
                a trackpad but NOT with a plain mouse wheel, so without these every
                slide past the visible ones is unreachable for a large share of
                desktop users. Shown only when the strip actually overflows, and
                each side hides at its end so they never lie about what's there. */}
            {overflows && canPrev ? (
                <Pressable
                    style={({ pressed }) => [styles.stripArrow, styles.stripArrowLeft, pressed && styles.pressed]}
                    onPress={() => scrollBy(-1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous slides"
                >
                    <FontAwesomeIcon icon={faChevronLeft} size={13} color={colors.text} />
                </Pressable>
            ) : null}
            {overflows && canNext ? (
                <Pressable
                    style={({ pressed }) => [styles.stripArrow, styles.stripArrowRight, pressed && styles.pressed]}
                    onPress={() => scrollBy(1)}
                    accessibilityRole="button"
                    accessibilityLabel="More slides"
                >
                    <FontAwesomeIcon icon={faChevronRight} size={13} color={colors.text} />
                </Pressable>
            ) : null}
            </View>
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
        // MAX_PREVIEW_H in both columns, always. The design canvas derives its
        // width as min(column, MAX_PREVIEW_H * aspect), so it always lands at
        // MAX_PREVIEW_H tall for a portrait design; giving the rendered column a
        // smaller cap made the two boxes different heights side by side, which
        // reads as the render being cropped or wrong rather than as a layout
        // choice. Same cap, same aspect, same height.
        const renderedView = () =>
            attachments.length > 1 ? (
                renderSlides(false)
            ) : (
                <MediaAssetPreview
                    attachment={attachments[0]}
                    contentType={contentType}
                    maxHeight={MAX_PREVIEW_H}
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
            // A multi-slide render is a horizontal strip: it wants WIDTH, not a
            // half column. Squeezed into one it showed ~3 of 7 tiles against a
            // tall empty gap (the column is matched to the design's height), so
            // the panel read as mostly blank. Stack instead and give the strip
            // the whole stage.
            const stripRender = attachments.length > 1;
            const sideBySide = xl && !stripRender;
            // Half the stage minus the gap, so each canvas scales to its column.
            const halfWidth = Math.max((stageWidth - 14) / 2, 0);
            const colStyle = sideBySide ? styles.pairCol : styles.pairColStacked;
            const pair = (
                <>
                    <View style={colStyle}>
                        <Text style={styles.pairLabel}>DESIGN</Text>
                        {renderDesignCanvas(designPreview, sideBySide ? halfWidth : stageWidth)}
                        <Text style={styles.pairCaption}>
                            {designPreview.slideCount > 1
                                ? `${designPreview.slideCount} slides · what you edit`
                                : "What you edit"}
                        </Text>
                    </View>
                    <View style={colStyle}>
                        <Text style={styles.pairLabel}>RENDERED</Text>
                        {renderedView()}
                        <Text style={styles.pairCaption}>What gets posted</Text>
                    </View>
                </>
            );
            // Side by side on desktop; stacked on a phone, where two columns
            // would leave each one too narrow to judge.
            body = <View style={sideBySide ? styles.pairRow : styles.pairStack}>{pair}</View>;
        } else if (designPreview) {
            body = renderDesignCanvas(designPreview);
        } else if (hasMedia) {
            body = renderedView();
        } else if (reading) {
            // Waiting for the footage to be READ. Named for what it is rather
            // than a generic spinner: the whole promise of this approach is
            // that the AI reads the video first, and the wait is the reading.
            body = (
                <View style={styles.generating} accessibilityLiveRegion="polite">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.generatingStep}>Reading your footage…</Text>
                    <Text style={styles.generatingHint}>
                        Measuring it, transcribing what's said and describing each shot. A minute or
                        two — it's already on the timeline, so you can start trimming it by hand.
                    </Text>
                </View>
            );
        } else if (briefPending) {
            // The brief is with the AI.
            //
            // Two things sit here deliberately. The STEP is the real one — the
            // backend names each tool as it runs, so this reports work rather
            // than animating a reassuring script; a fake progress list is a lie
            // that gets found out the first time something is slow. And the
            // user's own words stay on screen, in the place they typed them,
            // because the one spot they just acted should not go blank while
            // the only feedback moves to a panel they may not be looking at.
            body = (
                <View style={styles.generating} accessibilityLiveRegion="polite">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.generatingStep}>
                        {briefStatus || "Making it now…"}
                    </Text>
                    {briefText ? (
                        <View style={styles.briefEcho}>
                            <Text style={styles.briefEchoLabel}>YOUR BRIEF</Text>
                            <Text style={styles.briefEchoText} numberOfLines={6}>
                                {briefText}
                            </Text>
                        </View>
                    ) : null}
                    <Text style={styles.generatingHint}>
                        You can follow along in the chat, or keep writing the caption below.
                    </Text>
                </View>
            );
        } else if (timeline.authored && timeline.clipCount > 0) {
            // A timeline and no design — a generated clip, or a cut of footage.
            // It is a whole video, so it gets a summary and a way in rather
            // than the composer, which would ask what to make next to media
            // that already exists.
            body = (
                <Pressable
                    style={({ pressed }) => [styles.timelineCard, pressed && styles.pressed]}
                    onPress={onOpenDesign}
                    accessibilityRole="button"
                    accessibilityLabel="Open the Studio to edit this timeline"
                >
                    <View style={styles.iconBadge}>
                        <FontAwesomeIcon icon={faFilm} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.timelineBody}>
                        <Text style={styles.timelineTitle}>
                            {timeline.clipCount === 1
                                ? "One clip on the timeline"
                                : `${timeline.clipCount} clips on the timeline`}
                            {timeline.totalMs > 0
                                ? ` · ${(timeline.totalMs / 1000).toFixed(1)}s`
                                : ""}
                        </Text>
                        <Text style={styles.timelineSub}>
                            Open the Studio to trim it, reorder it or add more. Render it when it's
                            ready to post.
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (designRef?.revisionId) {
            // A design exists but its HTML hasn't arrived yet.
            body = (
                <View style={styles.laneLoading}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                    <Text style={styles.laneLoadingText}>Loading your design…</Text>
                </View>
            );
        } else if (onSubmitBrief && !readOnly) {
            // Nothing made yet: the composer IS the design lane's empty state.
            body = (
                <Composer
                    contentType={contentType}
                    onSubmit={submitBrief}
                    videoModels={videoModels}
                    sttModels={sttModels}
                    disabled={readOnly || briefBusy}
                />
            );
        } else {
            body = (
                <View style={styles.laneLoading}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                    <Text style={styles.laneLoadingText}>Loading your design…</Text>
                </View>
            );
        }

        // Before anything EXISTS there is nothing to render, nothing to clear
        // and nothing to export — the composer (or the wait for it) owns the
        // whole lane.
        //
        // `briefPending` is included deliberately. It used to be excluded, which
        // put a "Clear canvas" button under the spinner: it offered to clear a
        // design that did not exist yet, and pressing it would not have stopped
        // the AI turn — so the one action on screen was a no-op dressed as a
        // cancel. Nothing is better than a button that lies. A real cancel needs
        // to abort the turn, which belongs with the generating stage.
        const nothingYet = !hasMedia && !designPreview && !designRef?.revisionId;
        if (nothingYet) return body;

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
                        onRender={designRender.startRender}
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

    /**
     * "Your media" — the brand's library, which is neither a lane nor a device
     * picker.
     *
     * It sits beside Upload rather than beside the two lane cards on purpose: a
     * file already in the library and a file on the phone end up in exactly the
     * same place, so offering the library as a third peer card would imply a
     * third kind of media. What it prevents is the thing it is worth a button
     * for — uploading the same product shot for the fourth time because the
     * previous three are only reachable from the posts they were used on.
     */
    const libraryBtn = () => (
        <Pressable
            style={({ pressed }) => [styles.laneBtn, pressed && styles.pressed]}
            onPress={() => setLibraryOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose from your media"
        >
            <FontAwesomeIcon icon={faPhotoFilm} size={12} color={colors.primary} />
            <Text style={styles.laneBtnText}>Your media</Text>
        </Pressable>
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
                    {libraryBtn()}
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
            return (
                <>
                    <MediaLaneCards contentType={contentType} onPick={pickLane} />
                    <View style={styles.laneActionRow}>{libraryBtn()}</View>
                </>
            );
        }
        return (
            <>
                {laneControl()}
                {lane === "design" ? renderDesignLane() : renderUploadLane()}
            </>
        );
    };

    /**
     * What the two cards become once one is picked: a control at the top of the
     * section, with the other lane one tap away.
     *
     * Only while the lane is still reversible. Once media exists the lane is a
     * fact about the content, not a preference — switching would have to throw
     * work away, and "Clear" already says that honestly.
     */
    const laneControl = () => {
        const reversible = !hasMedia && !designRef?.revisionId && !briefPending && !readOnly;
        if (!reversible) return null;
        const offered = lanesFor(contentType);
        if (offered.length < 2) return null;
        return (
            <View style={styles.laneControl}>
                {offered.map((l) => {
                    const active = l === lane;
                    return (
                        <Pressable
                            key={l}
                            style={({ pressed }) => [
                                styles.lanePill,
                                active && styles.lanePillActive,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => {
                                if (!active) pickLane(l);
                            }}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={l === "design" ? "Design with AI" : "Upload your own"}
                        >
                            <FontAwesomeIcon
                                icon={l === "design" ? faWandMagicSparkles : faArrowUpFromBracket}
                                size={11}
                                color={active ? colors.text : colors.textSecondary}
                            />
                            <Text style={[styles.lanePillText, active && styles.lanePillTextActive]}>
                                {l === "design" ? "Design with AI" : "Upload your own"}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        );
    };

    return (
        <>
            {/* The heading names a REGION of the editor, exactly like CAPTION and
                HASHTAGS below it, so it is a section label outside the card —
                not a bold title inside one, which made a peer read as a
                different kind of thing. The chips ride with it: the ratio and
                the render status describe the section, not its contents. */}
            <SectionLabel
                right={
                    <>
                        {designRenderState ? <DesignRenderChip state={designRenderState} /> : null}
                        {spec.aspectLabel ? (
                            <View style={styles.ratioChip}>
                                <Text style={styles.ratioChipText}>{spec.aspectLabel}</Text>
                            </View>
                        ) : null}
                    </>
                }
            >
                {spec.kind === "video" ? "VIDEO" : "VISUALS"}
            </SectionLabel>
            <View style={styles.card} onLayout={onStageLayout}>
                {renderBody()}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <AssetsPanel
                    visible={libraryOpen}
                    onClose={() => setLibraryOpen(false)}
                    onPick={(asset) => handleLibraryPick([asset])}
                    // Several at a time only where several can land: on a
                    // single-image post the second pick would replace the first.
                    onPickMany={spec.multi ? handleLibraryPick : undefined}
                    kinds={[(spec.kind === "video" ? "video" : "image") as AssetKind]}
                />

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
        </>
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
        timelineCard: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            padding: 16,
            borderRadius: 14,
            backgroundColor: colors.tag,
        },
        iconBadge: {
            width: 38,
            height: 38,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        timelineBody: { flex: 1, gap: 4 },
        timelineTitle: {
            fontSize: fs(14),
            lineHeight: lh(19),
            fontWeight: "800",
            color: colors.text,
        },
        timelineSub: {
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.textSecondary,
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
        stripWrap: {
            position: "relative",
            justifyContent: "center",
        },
        stripArrow: {
            position: "absolute",
            top: "50%",
            marginTop: -18,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.18,
            elevation: 4,
        },
        stripArrowLeft: {
            left: 2,
        },
        stripArrowRight: {
            right: 2,
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

        laneControl: {
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
        },
        // ── The lane switch ──
        // Deliberately quiet. It used to be a filled primary pill, identical to
        // the approach tabs below it, so two rows of navigation shouted equally
        // — while the lane is a decision the user made a step ago and the
        // approach is the one in front of them. This is now a "you are here,
        // tap to go back" control: no fill on the inactive side, a soft one on
        // the active side, and no primary anywhere.
        lanePill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: "transparent",
        },
        lanePillActive: {
            backgroundColor: colors.tag,
        },
        lanePillText: {
            fontSize: fs(11.5),
            lineHeight: lh(15),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        lanePillTextActive: {
            // Text colour, not onPrimary: the active lane now sits on a soft
            // tag fill rather than a primary one.
            color: colors.text,
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
        generating: {
            alignItems: "center",
            gap: 10,
            paddingVertical: 26,
            paddingHorizontal: 16,
        },
        generatingStep: {
            fontSize: fs(14),
            lineHeight: lh(19),
            fontWeight: "600",
            color: colors.text,
            textAlign: "center",
        },
        briefEcho: {
            alignSelf: "stretch",
            maxWidth: 460,
            width: "100%",
            marginHorizontal: "auto",
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            gap: 4,
        },
        briefEchoLabel: {
            fontSize: fs(10),
            lineHeight: lh(13),
            fontWeight: "700",
            letterSpacing: 0.8,
            color: colors.textSecondary,
        },
        briefEchoText: {
            fontSize: fs(12.5),
            lineHeight: lh(18),
            color: colors.text,
        },
        generatingHint: {
            fontSize: fs(11.5),
            lineHeight: lh(16),
            color: colors.textSecondary,
            textAlign: "center",
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
