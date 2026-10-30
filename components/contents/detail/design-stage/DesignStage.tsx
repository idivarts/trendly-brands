/**
 * DesignStage — the full-screen design canvas that takes over the content
 * detail's centre column. The AI authors the post as HTML/CSS; this renders it
 * in a WebView/iframe (WYSIWYG), lets the user tap an element to edit its text
 * (deterministic, via the frame's DOM) or pin a comment / AI directive, captures
 * the frame to a PNG/MP4 on "Render" (preview == export), and hands off to Canva.
 *
 * It is opened explicitly from the MediaStage (or auto-opened when the AI writes
 * a new design), and closed with the ✕ in its header — which returns the user to
 * the MediaStage where the caption, script and everything else lives. When there
 * is no design yet it shows a clean empty state pointing at the AI chat. Video
 * contents get a collapsible Soundtrack panel that slides up from the bottom.
 */
import { ContentType } from "@/components/content-calendar/types";
import { useBreakpoints } from "@/hooks";
import AIModelSelector from "@/components/ai/AIModelSelector/AIModelSelector";
import { useAIModels } from "@/hooks/use-ai-models";
import { Focus, FocusArea } from "@/types/focus";
import { useContentComments } from "@/hooks/use-content-comments";
import { IContentAudio, IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { IContentCompositionRef } from "@/shared-libs/firestore/trendly-pro/models/composition";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { IViralityScore } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import {
    faBullseye,
    faClockRotateLeft,
    faGaugeHigh,
    faComment,
    faEllipsisVertical,
    faPen,
    faFilm,
    faPenRuler,
    faPhotoFilm,
    faTriangleExclamation,
    faWandMagicSparkles,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    GestureResponderEvent,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Menu } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DesignSystemNudge from "@/components/design-system/DesignSystemNudge";
import { DesignFrameHandle, FrameOutMsg } from "./bridge";
import DesignFrame from "./DesignFrame";
import AudioLanes from "./AudioLanes";
import AudioAddSheet from "./AudioAddSheet";
import DesignScoreCard from "./DesignScoreCard";
import InspectorPanel from "./InspectorPanel";
import AssetsPanel from "../AssetsPanel";
import ClipInspector from "./ClipInspector";
import ClipPreview from "./ClipPreview";
import TimelineStrip, { TimelineAction } from "./TimelineStrip";
import { appendClip, clipFromAsset, setTransition } from "./composition-edits";
import { useContentComposition } from "./use-content-composition";
import { useSoundtrackPlayer } from "./use-audio-player";
import { useContentDesign } from "./use-content-design";
import { useDesignRender } from "./use-design-render";
import { fs, lh } from "@/constants/Typography";
import { MEDIA_SPEC } from "../media-spec";

interface DesignStageProps {
    contentId: string;
    brandId: string;
    contentType: ContentType;
    isVideo: boolean;
    designRef?: IContentDesignRef;
    /** Pointer to the authored timeline, when there is one. */
    compositionRef?: IContentCompositionRef;
    /** The design's last virality score, if it has been scored before. */
    designScore?: IViralityScore;
    voiceoverSource: string;
    audio?: IContentAudio;
    onAudioChange: (audio: IContentAudio) => void;
    onSendToChat: (text: string) => void;
    /** Auto-send an AI directive with a structured focus on the picked element. */
    onAskAI: (instruction: string, focus: Focus) => void;
    /** Attach the picked element to the AI chat as a focus (no message sent). */
    onFocus: (focus: Focus) => void;
    /** Close the Design Stage and return to the MediaStage view. */
    onClose: () => void;
    /**
     * Start a design from the user's brief: opens a NEW AI conversation with the
     * brief as its first message. Called from the empty-canvas brief step.
     */
    onSubmitBrief: (brief: string) => void;
    /**
     * A brief has been handed to the AI and no design exists yet — the middle
     * of the studio's three states (waiting for a prompt → generating →
     * design). Owned by the page, because only it can see both the chat turn
     * and the content document the design lands on.
     */
    generating?: boolean;
    /** The brief being worked on, echoed back while `generating`. */
    pendingBrief?: string;
    readOnly?: boolean;
}

type Rect = { x: number; y: number; w: number; h: number };
type Selected = { id: string; text: string; editable: boolean; rect: Rect } | null;

const fmtTime = (ms: number) => `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;

// Gap between the selected element and its floating toolbar, and the min inset
// the toolbar keeps from the frame edges.
const TB_GAP = 8;
const TB_EDGE = 4;

const DesignStage: React.FC<DesignStageProps> = (props) => {
    const { contentId, brandId, designRef, isVideo, readOnly, onClose, onSubmitBrief } = props;
    const { generating, pendingBrief } = props;
    const theme = useTheme();
    const colors = Colors(theme);
    const { width, xl } = useBreakpoints();
    // The stage is a full-bleed takeover: the page header that normally owns the
    // top inset is hidden while it is open, so this header owns it instead.
    const insets = useSafeAreaInsets();
    const styles = useStyles(colors, insets.top);

    // The brief composer runs the same lane the backend will: the design task.
    // Shared selection with the chat composer, so a choice in either shows in both.
    const {
        models: designModels,
        selectedModel: designModel,
        setSelectedModel,
    } = useAIModels("design");

    const { revision, history, addRevision, revertTo } = useContentDesign(contentId, designRef);
    const { addComment } = useContentComments(contentId);
    // Video-synced audio: plays the music bed + voiceover in step with the video
    // preview so "play" reflects the final mix (music ducked under the voice).
    const player = useSoundtrackPlayer(props.audio);

    const frameRef = useRef<DesignFrameHandle>(null);
    // Scrubber (video timeline drag-to-seek) plumbing.
    const wasPlayingBeforeScrubRef = useRef(false);
    const scrubHandlersRef = useRef<{
        onGrant: (e: GestureResponderEvent) => void;
        onMove: (e: GestureResponderEvent) => void;
        onRelease: (e: GestureResponderEvent) => void;
        onTerminate: () => void;
    } | null>(null);
    // Created once; its callbacks delegate to the latest handlers via the ref so a
    // gesture already in progress keeps working across re-renders.
    const scrubResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (e) => scrubHandlersRef.current?.onGrant(e),
            onPanResponderMove: (e) => scrubHandlersRef.current?.onMove(e),
            onPanResponderRelease: (e) => scrubHandlersRef.current?.onRelease(e),
            onPanResponderTerminate: () => scrubHandlersRef.current?.onTerminate(),
        }),
    ).current;
    const [selected, setSelected] = useState<Selected>(null);
    const [modalOpen, setModalOpen] = useState<null | "edit" | "comment">(null);
    const [modalText, setModalText] = useState("");
    const [slide, setSlide] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [curMs, setCurMs] = useState(0);
    const [durMs, setDurMs] = useState(0);
    const [trackW, setTrackW] = useState(1);
    // While the user drags the scrubber, curMs (which lags behind, arriving via
    // "time" messages from the frame) is overridden by this local fraction so the
    // fill + thumb track the finger with zero lag. null = not scrubbing.
    const [scrubFrac, setScrubFrac] = useState<number | null>(null);
    // (render progress / errors now live in useDesignRender)
    // "preparing" phase). Drives the on-canvas progress overlay + header %.
    // Render failure surfaced on the canvas (gracious, dismissible, with retry).
    // Which audio sheet is open, if any. The lanes themselves are always
    // visible for a video — audio used to hide behind a collapsed trigger, so
    // most people never found it.
    const [audioSheet, setAudioSheet] = useState<"music" | "voice" | null>(null);
    // The brief typed on the empty canvas, before any design exists.
    const [brief, setBrief] = useState("");
    // Header overflow (⋮) menu — currently just the Canva hand-off.
    const [menuOpen, setMenuOpen] = useState(false);
    // Revert is a strong action — confirm before rewinding to the last version.
    const [confirmRevert, setConfirmRevert] = useState(false);
    // Measured size of the floating selection toolbar (for edge-clamped anchoring).
    const [tbSize, setTbSize] = useState({ w: 172, h: 40 });
    // Measured available canvas area — the design is scaled to fit inside it.
    const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

    const html = revision?.html ?? "";
    // The canvas box. With no design at all — a timeline of generated clips or
    // footage — the COMPOSITION's own size is the right shape to fit into; the
    // 1080x1350 fallback would letterbox a 9:16 clip inside a 4:5 box.
    const w = revision?.width ?? designRef?.width ?? props.compositionRef?.width ?? 1080;
    const h = revision?.height ?? designRef?.height ?? props.compositionRef?.height ?? 1350;
    const docType = revision?.docType ?? designRef?.docType ?? "image";
    const isVideoDesign = docType === "video";
    const slideCount = Math.max(revision?.slideCount ?? designRef?.slideCount ?? 1, 1);

    // ── The timeline ─────────────────────────────────────────────────────────
    // `composition` is never null while there is a video design: with nothing
    // authored it is the implicit one-clip timeline the render worker derives
    // for every pre-composition video, so the strip has something real to show
    // from the first open and "add a clip" is an edit rather than a mode.
    //
    // The design's length comes from the FRAME's live measurement where there
    // is one, and from the stored revision before the frame has reported. A
    // design edited in this session is longer or shorter than the document
    // says, and the first clip's duration is what the render is billed on.
    const timelineDesign = useMemo(
        () =>
            revision?.id && isVideoDesign
                ? {
                      revisionId: revision.id,
                      width: w,
                      height: h,
                      durationMs: durMs || revision.durationMs || 0,
                  }
                : null,
        [revision?.id, revision?.durationMs, isVideoDesign, w, h, durMs]
    );
    const timeline = useContentComposition(contentId, props.compositionRef, timelineDesign);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [clipSheetOpen, setClipSheetOpen] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);

    // A clip that was removed — or a timeline that was dropped — must not leave
    // an inspector pointed at nothing.
    useEffect(() => {
        if (!selectedClipId) return;
        const clips = (timeline.composition?.tracks ?? []).flatMap((t) => t.clips ?? []);
        if (!clips.some((c) => c.id === selectedClipId)) {
            setSelectedClipId(null);
            setClipSheetOpen(false);
        }
    }, [timeline.composition, selectedClipId]);

    const selectClip = (clipId: string | null) => {
        setSelectedClipId(clipId);
        // On a phone the inspector is not docked, so a selection has to open
        // something. On a wide screen it lands in the pane already on screen.
        if (clipId && !xl) setClipSheetOpen(true);
    };

    // Shown at once, written a moment later — the inspector's controls are
    // steppers, and a tap that waits for a revision to come back would both feel
    // broken and read a stale composition on the next tap.
    const saveTimeline = timeline.apply;

    // A failed write is reported once, where the user is looking.
    useEffect(() => {
        if (timeline.saveError) Toaster.error("Timeline not saved", timeline.saveError);
    }, [timeline.saveError]);

    const addFromLibrary = (asset: IAsset) => {
        const current = timeline.composition;
        if (!current) return;
        saveTimeline(appendClip(current, clipFromAsset(asset)));
    };

    const timelineActions: TimelineAction[] = [
        {
            key: "library",
            label: "From your media",
            sub: "Footage or a photo you've already got.",
            icon: faPhotoFilm,
            onPress: () => setLibraryOpen(true),
        },
    ];

    // Ask the server to render. Shared with the Media Stage's render action so
    // there is one render pipeline, not two. Nothing is paused first: the worker
    // renders the SAVED HTML in its own browser, so whatever this preview is
    // doing is irrelevant to the output.
    // An authored timeline is what gets rendered — the backend prefers a
    // composition over a design, because the composition is the thing the user
    // arranged and the design is one clip inside it. So the render is pointed
    // at the composition revision and reports from it, and the request names no
    // revision at all (naming one would be read as naming a design revision).
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
              revisionId: revision?.id,
              renderStatus: revision?.renderStatus,
              renderProgress: revision?.renderProgress,
              renderError: revision?.renderError,
          });
    const render = useDesignRender({
        contentId,
        isVideoDesign,
        slideCount,
        ...renderTarget,
    });
    const hasDesign = !!html;

    // Fit the design into the measured canvas area, preserving aspect ratio AND
    // reserving room for the on-canvas controls (video scrubber / slide nav) so a
    // tall reel is never clipped. Falls back to a sensible width before measured.
    const CANVAS_PAD = 32;
    const CONTROLS_H = isVideoDesign ? 64 : slideCount > 1 ? 52 : 8;
    const availW = Math.max(0, canvasSize.w - CANVAS_PAD);
    const availH = Math.max(0, canvasSize.h - CANVAS_PAD - CONTROLS_H);
    const fitByHeight = availH > 0 && h > 0 ? (availH * w) / h : Infinity;
    const MAX_CANVAS_W = 680;
    let displayWidth = Math.min(availW || width - 32, fitByHeight, MAX_CANVAS_W);
    if (!(displayWidth > 0)) displayWidth = Math.min(width - 32, 340);
    const displayHeight = w > 0 ? (displayWidth * h) / w : displayWidth;
    // ── Brief step (empty canvas) ───────────────────────────────────────────
    // Per-type copy, so the prompt asks for the thing actually being made. Keyed
    // off the CONTENT TYPE, not the revision: on an empty canvas there is no
    // revision, so slideCount would always read 1 and a carousel would be asked
    // for a "design" rather than "slides".
    const briefNoun = isVideo ? "video" : MEDIA_SPEC[props.contentType].multi ? "slides" : "design";
    const briefSubtitle =
        briefNoun === "video"
            ? "Explain what you want in the video — the message, the mood, who it's for. The AI turns it into an editable design."
            : briefNoun === "slides"
                ? "Explain what you want across the slides — the message, the mood, who it's for. The AI turns it into an editable design."
                : "Explain what you want in the design — the message, the mood, who it's for. The AI turns it into an editable design.";
    const briefPlaceholder =
        briefNoun === "video"
            ? "e.g. A 15s launch teaser for our new cold brew — punchy, upbeat, ends on the bottle with the 20% off code"
            : briefNoun === "slides"
                ? "e.g. Five slides explaining why our cold brew is less acidic — one idea per slide, warm and friendly"
                : "e.g. A bold announcement for our new cold brew launch, warm tones, big headline and the 20% off code";

    const submitBrief = () => {
        const text = brief.trim();
        if (!text) return;
        onSubmitBrief(text);
        setBrief("");
    };

    const progress = durMs > 0 ? Math.min(curMs / durMs, 1) : 0;
    // What the fill + thumb actually render: the live drag fraction while
    // scrubbing, otherwise the real playback progress.
    const displayFrac = scrubFrac ?? progress;

    // Render-overlay derived values: a determinate fraction (null while the total
    // is still unknown) + a human label per render type.
    const capturing = render.capturing;
    const renderError = render.error;
    const renderFrac = render.progress != null ? Math.min(render.progress, 1) : null;
    const renderLabel = isVideoDesign
        ? renderFrac != null
            ? `Rendering video… ${Math.round(renderFrac * 100)}%`
            : "Preparing video…"
        : slideCount > 1
            ? renderFrac != null
                ? `Rendering slides… ${Math.round(renderFrac * 100)}%`
                : "Rendering slides…"
            : "Rendering image…";

    // Clear the selection everywhere (RN state + the frame's outline).
    const clearSelection = () => {
        setSelected(null);
        frameRef.current?.deselect();
    };

    // Any new design revision (AI edit, text edit, revert) reloads the frame, so
    // the previous selection + its cached rect are stale — drop them.
    useEffect(() => {
        setSelected(null);
    }, [revision?.id]);

    // Anchor the floating toolbar to the selected element: centred over it,
    // above by default and flipped below when the element hugs the top; both
    // axes clamped inside the frame so it never escapes the canvas.
    const toolbarPos = useMemo(() => {
        if (!selected) return { left: 0, top: 0 };
        const r = selected.rect;
        let left = r.x + r.w / 2 - tbSize.w / 2;
        left = Math.max(TB_EDGE, Math.min(left, displayWidth - tbSize.w - TB_EDGE));
        const above = r.y - tbSize.h - TB_GAP;
        let top = above >= TB_EDGE ? above : r.y + r.h + TB_GAP;
        top = Math.max(TB_EDGE, Math.min(top, displayHeight - tbSize.h - TB_EDGE));
        return { left, top };
    }, [selected, tbSize.w, tbSize.h, displayWidth, displayHeight]);

    const goToSlide = (i: number) => {
        const clamped = Math.max(0, Math.min(i, slideCount - 1));
        setSlide(clamped);
        clearSelection();
        frameRef.current?.showSlide(clamped, w);
    };

    const onMessage = (msg: FrameOutMsg) => {
        if (msg.type === "ready") {
            if (isVideoDesign) frameRef.current?.seek(0);
        } else if (msg.type === "time") {
            setCurMs(msg.ms);
            setDurMs(msg.duration);
        } else if (msg.type === "ended") {
            setPlaying(false);
            void player.pause();
        } else if (msg.type === "tap") {
            setSelected({ id: msg.id, text: msg.text, editable: msg.editable, rect: msg.rect });
        } else if (msg.type === "deselect") {
            setSelected(null);
        } else if (msg.type === "html") {
            addRevision(msg.html, w, h, slideCount, docType, "text", revision?.id);
        }
    };

    const togglePlay = () => {
        if (playing) {
            frameRef.current?.pause();
            void player.pause();
            setPlaying(false);
        } else {
            const from = progress >= 1 ? 0 : curMs;
            if (progress >= 1) frameRef.current?.seek(0);
            clearSelection();
            frameRef.current?.play();
            void player.playFrom(from);
            setPlaying(true);
        }
    };

    // Seek both the video frame and the soundtrack/voiceover mix to `ms`.
    const seekBoth = (ms: number) => {
        frameRef.current?.seek(Math.max(0, ms));
        void player.seek(Math.max(0, ms));
    };

    // Map a tap/drag X (relative to the track) to a 0..1 fraction of the timeline.
    const fracFromX = (x: number) => Math.max(0, Math.min(x / Math.max(trackW, 1), 1));

    // Latest scrub handlers, refreshed every render so the (stable) PanResponder
    // below always closes over the current durMs / playing / player / clearSelection
    // — avoids the classic "PanResponder captured stale state" bug without
    // re-creating the responder (which would drop an in-flight gesture).
    const scrubHandlers = {
        onGrant: (e: GestureResponderEvent) => {
            if (durMs <= 0) return;
            // Remember whether we interrupted playback so we can resume on release.
            wasPlayingBeforeScrubRef.current = playing;
            if (playing) {
                frameRef.current?.pause();
                void player.pause();
                setPlaying(false);
            }
            const frac = fracFromX(e.nativeEvent.locationX);
            setScrubFrac(frac);
            seekBoth(Math.round(frac * durMs));
        },
        onMove: (e: GestureResponderEvent) => {
            if (durMs <= 0) return;
            const frac = fracFromX(e.nativeEvent.locationX);
            setScrubFrac(frac);
            seekBoth(Math.round(frac * durMs));
        },
        onRelease: (e: GestureResponderEvent) => {
            if (durMs <= 0) return;
            const frac = fracFromX(e.nativeEvent.locationX);
            const ms = Math.round(frac * durMs);
            seekBoth(ms);
            setScrubFrac(null);
            // Resume playback from the dropped position if we were playing.
            if (wasPlayingBeforeScrubRef.current) {
                clearSelection();
                frameRef.current?.play();
                void player.playFrom(ms);
                setPlaying(true);
            }
        },
        onTerminate: () => setScrubFrac(null),
    };
    scrubHandlersRef.current = scrubHandlers;

    const saveRender = () => {
        if (!hasDesign) return;
        render.startRender();
    };

    const openEdit = () => {
        setModalText(selected?.text ?? "");
        setModalOpen("edit");
    };
    const openComment = () => {
        setModalText("");
        setModalOpen("comment");
    };
    const close = () => {
        setModalOpen(null);
        setModalText("");
    };

    const saveTextEdit = () => {
        if (selected) frameRef.current?.setText(selected.id, modalText);
        close();
    };

    const addPlainComment = async () => {
        if (!modalText.trim() || !selected) return;
        await addComment(modalText, { mediaAnchor: { elementId: selected.id, label: "element" } });
        close();
    };
    // Structured focus on the exact selected element — carries elementId, slide,
    // doc type + content id so the AI can target precisely (not just prose).
    // The virality read on the design, as a floating card rather than a panel:
    // what is useful here is a verdict and three fixes while you are looking at
    // the artefact, and the canvas should keep the space when you are not.
    //
    // Open by default on a wide screen once there is a design to judge. A card
    // nobody knows to look for is a feature nobody uses, and on xl there is
    // room beside the canvas for it to cost nothing. Below xl it stays shut:
    // 300px of overlay on a narrow screen is in the way, not in support.
    const [showScore, setShowScore] = useState(false);
    // Auto-open happens at most once per mount, so closing it means closed —
    // the design changing, or a resize, must not reopen something dismissed.
    const autoOpenedScore = useRef(false);
    useEffect(() => {
        if (autoOpenedScore.current || !xl || !hasDesign) return;
        autoOpenedScore.current = true;
        setShowScore(true);
    }, [xl, hasDesign]);

    // The score's fixes are about the design as a whole, so they scope to the
    // CONTENT rather than to whichever element happens to be selected — there
    // is no element focus for "the carousel's last slide does not ask for
    // anything", and attaching one would point the AI at the wrong thing.
    const askAboutDesign = (instruction: string) => {
        props.onAskAI(instruction, {
            id: `focus-${Date.now()}`,
            focusText: "Design",
            focusArea: { type: "content", contentId },
        });
    };

    const buildElementFocus = (): Focus | null => {
        if (!selected) return null;
        const multi = slideCount > 1;
        const area: FocusArea = {
            type: "design-element",
            contentId,
            revisionId: revision?.id,
            elementId: selected.id,
            slideIndex: multi || isVideoDesign ? slide : undefined,
            slideCount: multi ? slideCount : undefined,
            docType,
            text: selected.text?.trim() || undefined,
        };
        const focusText = selected.text?.trim()
            ? `Design${multi ? ` · slide ${slide + 1}` : ""}: "${selected.text.trim().slice(0, 60)}"`
            : `Design element${multi ? ` · slide ${slide + 1}` : ""}`;
        return { id: `focus-${Date.now()}`, focusText, focusArea: area };
    };

    const askAI = async () => {
        if (!modalText.trim() || !selected) return;
        const focus = buildElementFocus();
        if (!focus) return;
        const instruction = modalText.trim();
        await addComment(instruction, { mediaAnchor: { elementId: selected.id, label: "element" }, isDirective: true });
        props.onAskAI(instruction, focus);
        close();
    };

    // Just attach the element to the chat as a focus — no message, no comment.
    const focusElement = () => {
        const focus = buildElementFocus();
        if (!focus) return;
        props.onFocus(focus);
        clearSelection();
    };

    const designInCanva = async () => {
        try {
            const res = await HttpWrapper.fetch(
                `/api/integrations/canva/brands/${brandId}/contents/${contentId}/design`,
                { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }
            );
            const data = await res.json();
            if (data.editUrl) props.onSendToChat(`Opening this design in Canva: ${data.editUrl}`);
        } catch {
            props.onSendToChat("Connect Canva in Settings → Connected accounts to deep-edit this design.");
        }
    };


    /**
     * The clip the canvas should show instead of the design frame.
     *
     * A selected non-design clip wins, because selecting one is asking to look
     * at it. With nothing selected and no design to fall back on, the first
     * clip stands in — otherwise a content whose only media is a generated clip
     * opens the studio showing nothing at all.
     */
    const previewClip = useMemo(() => {
        const clips = (timeline.composition?.tracks ?? []).flatMap((t) => t.clips ?? []);
        const selected = clips.find((c) => c.id === selectedClipId);
        if (selected) return selected.source?.kind === "design" ? null : selected;
        if (hasDesign) return null;
        const first = (timeline.composition?.tracks ?? []).find((t) => t.kind === "video")
            ?.clips?.[0];
        return first && first.source?.kind !== "design" ? first : null;
    }, [timeline.composition, selectedClipId, hasDesign]);

    const clipInspector =
        selectedClipId && timeline.composition ? (
            <ClipInspector
                composition={timeline.composition}
                clipId={selectedClipId}
                designSceneCount={slideCount}
                onChange={saveTimeline}
                onDeselect={() => {
                    setSelectedClipId(null);
                    setClipSheetOpen(false);
                }}
                onAskAI={(instruction) => props.onSendToChat(instruction)}
                readOnly={readOnly}
            />
        ) : null;

    return (
        <View style={styles.container}>
            {/* Header — close (✕) on the left, primary Render on the right. */}
            <View style={styles.header}>
                <Pressable
                    style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close the Design Stage"
                    hitSlop={8}
                >
                    <FontAwesomeIcon icon={faXmark} size={16} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>Design Studio</Text>
                <View style={styles.headerActions}>
                    {hasDesign && history.length > 1 && !readOnly ? (
                        <Pressable
                            onPress={() => setConfirmRevert(true)}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Revert to the previous version"
                            hitSlop={8}
                        >
                            <FontAwesomeIcon icon={faClockRotateLeft} size={15} color={colors.text} />
                        </Pressable>
                    ) : null}
                    {hasDesign ? (
                        <Pressable
                            onPress={() => setShowScore((v) => !v)}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel={showScore ? "Hide the virality check" : "Check how this design will perform"}
                            hitSlop={8}
                        >
                            <FontAwesomeIcon
                                icon={faGaugeHigh}
                                size={15}
                                color={showScore ? colors.primary : colors.text}
                            />
                        </Pressable>
                    ) : null}
                    {hasDesign && !readOnly ? (
                        <Pressable
                            onPress={saveRender}
                            style={({ pressed }) => [styles.renderBtn, pressed && styles.pressed]}
                            disabled={capturing}
                        >
                            {capturing ? (
                                renderFrac != null ? (
                                    <Text style={styles.renderBtnText}>{Math.round(renderFrac * 100)}%</Text>
                                ) : (
                                    <ActivityIndicator size="small" color={colors.onPrimary} />
                                )
                            ) : (
                                <Text style={styles.renderBtnText}>{render.label}</Text>
                            )}
                        </Pressable>
                    ) : null}
                    {hasDesign && !readOnly ? (
                        <Menu
                            visible={menuOpen}
                            onDismiss={() => setMenuOpen(false)}
                            anchor={
                                <Pressable
                                    onPress={() => setMenuOpen(true)}
                                    style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                                    accessibilityRole="button"
                                    accessibilityLabel="More design actions"
                                    hitSlop={8}
                                >
                                    <FontAwesomeIcon icon={faEllipsisVertical} size={16} color={colors.textSecondary} />
                                </Pressable>
                            }
                            contentStyle={styles.menuContent}
                        >
                            <Menu.Item
                                onPress={() => {
                                    setMenuOpen(false);
                                    designInCanva();
                                }}
                                title="Deep-edit in Canva"
                                titleStyle={styles.menuItemText}
                                leadingIcon={() => (
                                    <FontAwesomeIcon icon={faPenRuler} size={15} color={colors.text} />
                                )}
                            />
                        </Menu>
                    ) : null}
                </View>
            </View>

            {/* Floating, top right, clear of the header. A verdict you consult
                while looking at the design — not a panel that takes the canvas. */}
            {showScore && hasDesign ? (
                <View style={styles.scoreFloat} pointerEvents="box-none">
                    <DesignScoreCard
                        contentId={contentId}
                        stored={props.designScore}
                        hasDesign={hasDesign}
                        onAskAI={askAboutDesign}
                        onClose={() => setShowScore(false)}
                        readOnly={readOnly}
                    />
                </View>
            ) : null}

            {/* Nudge to complete the brand's Design System for better AI designs. */}
            {!readOnly && <DesignSystemNudge />}

            {/* Body — canvas when there's a design, else a clean empty state.
                On a wide screen the Inspector docks to its left: the canvas is
                what you look at, the pane is where you change what you picked.
                Not on a phone, where the canvas needs the whole width and the
                floating toolbar is the right affordance for touch. */}
            <View style={styles.bodyRow}>
            {xl && hasDesign ? (
                <InspectorPanel
                    selection={selected}
                    clipSection={clipInspector}
                    slide={slide}
                    slideCount={slideCount}
                    isVideo={isVideoDesign}
                    readOnly={readOnly}
                    onSetText={(id, text) => {
                        frameRef.current?.setText(id, text);
                        setSelected((cur) => (cur && cur.id === id ? { ...cur, text } : cur));
                    }}
                    // Attach the element to the chat as a focus and let the
                    // user type the instruction there, rather than opening a
                    // one-line modal over the thing they are editing. The chat
                    // is where the conversation already is.
                    onAskAI={() => {
                        const focus = buildElementFocus();
                        if (focus) props.onFocus(focus);
                    }}
                    onComment={openComment}
                    onDeselect={() => {
                        frameRef.current?.deselect();
                        setSelected(null);
                    }}
                />
            ) : null}
            <View
                style={styles.body}
                onLayout={(e) => {
                    const { width: bw, height: bh } = e.nativeEvent.layout;
                    if (Math.abs(bw - canvasSize.w) > 1 || Math.abs(bh - canvasSize.h) > 1) {
                        setCanvasSize({ w: bw, h: bh });
                    }
                }}
            >
                {previewClip ? (
                    /* A clip that is not the design: footage, a still, a
                       generated clip. The frame below can only play HTML, so
                       without this the strip let you arrange media you could
                       never look at — and on a content with no design, the only
                       way to see a generated clip was to render the video. */
                    <ScrollView
                        contentContainerStyle={styles.canvasScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.canvasWrap}>
                            <ClipPreview
                                clip={previewClip}
                                width={displayWidth}
                                height={displayHeight}
                            />
                            <Text style={styles.clipPreviewNote}>
                                One clip, on its own. The render is what puts the timeline together.
                            </Text>
                        </View>
                    </ScrollView>
                ) : hasDesign ? (
                    <ScrollView
                        contentContainerStyle={styles.canvasScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.canvasWrap}>
                            <View style={[styles.frameWrap, { width: displayWidth, height: displayHeight }]}>
                                <DesignFrame
                                    ref={frameRef}
                                    html={html}
                                    width={w}
                                    height={h}
                                    displayWidth={displayWidth}
                                    onMessage={onMessage}
                                />
                                {/* Floating contextual toolbar anchored to the selected
                                    element (like Figma/Canva). box-none lets taps fall
                                    through to the canvas everywhere except the toolbar. */}
                                {selected && !readOnly ? (
                                    <View style={styles.selectionOverlay} pointerEvents="box-none">
                                        <View
                                            style={[styles.floatToolbar, { left: toolbarPos.left, top: toolbarPos.top }]}
                                            onLayout={(e) => {
                                                const { width: tw, height: th } = e.nativeEvent.layout;
                                                if (Math.abs(tw - tbSize.w) > 1 || Math.abs(th - tbSize.h) > 1) {
                                                    setTbSize({ w: tw, h: th });
                                                }
                                            }}
                                        >
                                            {selected.editable ? (
                                                <Pressable
                                                    style={({ pressed }) => [styles.tbBtn, pressed && styles.pressed]}
                                                    onPress={openEdit}
                                                    accessibilityRole="button"
                                                    accessibilityLabel="Edit text"
                                                >
                                                    <FontAwesomeIcon icon={faPen} size={12} color={colors.text} />
                                                    <Text style={styles.tbBtnText}>Edit</Text>
                                                </Pressable>
                                            ) : null}
                                            <Pressable
                                                style={({ pressed }) => [styles.tbBtn, pressed && styles.pressed]}
                                                onPress={focusElement}
                                                accessibilityRole="button"
                                                accessibilityLabel="Focus this element in the AI chat"
                                            >
                                                <FontAwesomeIcon icon={faBullseye} size={12} color={colors.text} />
                                                <Text style={styles.tbBtnText}>Focus</Text>
                                            </Pressable>
                                            <Pressable
                                                style={({ pressed }) => [styles.tbBtn, pressed && styles.pressed]}
                                                onPress={openComment}
                                                accessibilityRole="button"
                                                accessibilityLabel="Comment or ask AI"
                                            >
                                                <FontAwesomeIcon icon={faComment} size={12} color={colors.text} />
                                                <Text style={styles.tbBtnText}>Ask AI</Text>
                                            </Pressable>
                                            <View style={styles.tbDivider} />
                                            <Pressable
                                                style={({ pressed }) => [styles.tbClose, pressed && styles.pressed]}
                                                onPress={clearSelection}
                                                accessibilityRole="button"
                                                accessibilityLabel="Deselect"
                                                hitSlop={6}
                                            >
                                                <FontAwesomeIcon icon={faXmark} size={13} color={colors.textSecondary} />
                                            </Pressable>
                                        </View>
                                    </View>
                                ) : null}

                                {/* Render progress — a determinate bar over the
                                    canvas so a slow export (esp. video) shows how
                                    much is done, not just a spinner. */}
                                {capturing ? (
                                    <View style={styles.renderOverlay}>
                                        <View style={styles.renderCard}>
                                            <View style={styles.renderRow}>
                                                <ActivityIndicator size="small" color={colors.primary} />
                                                <Text style={styles.renderLabelText}>{renderLabel}</Text>
                                            </View>
                                            <View style={styles.renderTrack}>
                                                {renderFrac != null ? (
                                                    <View
                                                        style={[styles.renderFill, { width: `${Math.round(renderFrac * 100)}%` }]}
                                                    />
                                                ) : (
                                                    <View style={styles.renderFillIndeterminate} />
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                            {isVideoDesign ? (
                                <View style={[styles.videoBar, { width: displayWidth }]}>
                                    <Pressable style={styles.playBtn} onPress={togglePlay}>
                                        <Text style={styles.playIcon}>{playing ? "❚❚" : "▶"}</Text>
                                    </Pressable>
                                    <View
                                        style={styles.trackHit}
                                        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
                                        {...scrubResponder.panHandlers}
                                    >
                                        <View style={styles.track}>
                                            <View
                                                pointerEvents="none"
                                                style={[styles.trackFill, { width: `${displayFrac * 100}%` }]}
                                            />
                                        </View>
                                        <View
                                            pointerEvents="none"
                                            style={[styles.thumb, { left: `${displayFrac * 100}%` }]}
                                        />
                                    </View>
                                    <Text style={styles.time}>
                                        {fmtTime(scrubFrac != null ? scrubFrac * durMs : curMs)} / {fmtTime(durMs)}
                                    </Text>
                                </View>
                            ) : slideCount > 1 ? (
                                <View style={styles.slideNav}>
                                    <Pressable style={styles.slideArrow} onPress={() => goToSlide(slide - 1)}>
                                        <Text style={styles.slideArrowText}>‹</Text>
                                    </Pressable>
                                    <View style={styles.dots}>
                                        {Array.from({ length: slideCount }).map((_, i) => (
                                            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
                                                <View style={[styles.dot, i === slide && styles.dotActive]} />
                                            </Pressable>
                                        ))}
                                    </View>
                                    <Pressable style={styles.slideArrow} onPress={() => goToSlide(slide + 1)}>
                                        <Text style={styles.slideArrowText}>›</Text>
                                    </Pressable>
                                </View>
                            ) : null}

                            {/* Gracious render-failure card — calm, explains what
                                happened, and offers a retry. */}
                            {!capturing && renderError ? (
                                <View style={styles.renderErrorCard}>
                                    <View style={styles.renderErrorAccent} />
                                    <View style={styles.renderErrorBody}>
                                        <View style={styles.renderErrorHead}>
                                            <FontAwesomeIcon
                                                icon={faTriangleExclamation}
                                                size={13}
                                                color={colors.toastError}
                                            />
                                            <Text style={styles.renderErrorTitle}>Render didn't finish</Text>
                                        </View>
                                        <Text style={styles.renderErrorMsg}>{renderError.message}</Text>
                                        <View style={styles.renderErrorActions}>
                                            {renderError.retry ? (
                                                <Pressable
                                                    style={({ pressed }) => [styles.renderRetryBtn, pressed && styles.pressed]}
                                                    onPress={saveRender}
                                                >
                                                    <Text style={styles.renderRetryText}>Try again</Text>
                                                </Pressable>
                                            ) : null}
                                            <Pressable
                                                style={({ pressed }) => [styles.renderDismissBtn, pressed && styles.pressed]}
                                                onPress={render.clearError}
                                            >
                                                <Text style={styles.renderDismissText}>Dismiss</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    </ScrollView>
                ) : (
                    /* No design yet — collect a brief instead of pointing at the
                       chat. An empty canvas plus "describe it over there" gives
                       the user nothing to act on; a prompt box does, and the
                       brief becomes the first message of a fresh AI thread. */
                    <ScrollView contentContainerStyle={styles.briefScroll} showsVerticalScrollIndicator={false}>
                        {generating ? (
                            /* State 2 — the brief is with the AI.
                               The canvas used to go on showing an empty prompt box
                               after submitting, so the one place the user had just
                               acted gave no sign it had heard them, and the only
                               feedback was in a panel they were not looking at.
                               This holds their words and the work in the same spot
                               they typed them. */
                            <View style={styles.brief} accessibilityLiveRegion="polite">
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.emptyTitle, styles.generatingTitle]}>
                                    Designing your {briefNoun}…
                                </Text>
                                <Text style={styles.emptySub}>
                                    The AI is drafting it, then checking its own render. This takes a
                                    moment — you can follow along in the chat.
                                </Text>
                                {pendingBrief ? (
                                    <View style={styles.pendingBrief}>
                                        <Text style={styles.pendingBriefLabel}>Your brief</Text>
                                        <Text style={styles.pendingBriefText}>{pendingBrief}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ) : timeline.authored ? (
                            /* A timeline, but no design — a generated clip or a
                               cut of footage, which is a whole video on its own.
                               It used to fall through to "What should we make?",
                               which denies the thing the user just made and
                               hides the strip that holds it. */
                            <View style={styles.brief}>
                                <View style={styles.emptyIcon}>
                                    <FontAwesomeIcon icon={faFilm} size={26} color={colors.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>
                                    {timeline.clipCount === 1 ? "One clip" : `${timeline.clipCount} clips`} on
                                    the timeline
                                </Text>
                                <Text style={styles.emptySub}>
                                    It's below — trim it, reorder it, or add more. The canvas stays empty
                                    until you design something to go with it, and the render puts the whole
                                    timeline together.
                                </Text>
                            </View>
                        ) : (
                        <View style={styles.brief}>
                            <View style={styles.emptyIcon}>
                                <FontAwesomeIcon icon={faWandMagicSparkles} size={26} color={colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>What should we make?</Text>
                            <Text style={styles.emptySub}>{briefSubtitle}</Text>

                            <TextInput
                                style={styles.briefInput}
                                value={brief}
                                onChangeText={setBrief}
                                placeholder={briefPlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                autoFocus={xl}
                                editable={!readOnly}
                            />

                            {/* The model belongs with the prompt that uses it. This
                                is the primary composer while no design exists, and
                                it was the only one WITHOUT a picker — the chat
                                composer beside it had one, which read as the chat
                                being the real input. Same shared selection, so
                                choosing here changes it there too. */}
                            <View style={styles.briefActions}>
                                <AIModelSelector
                                    models={designModels}
                                    selectedModel={designModel}
                                    onSelect={setSelectedModel}
                                    compact
                                    surface="design_stage"
                                    task="design"
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.briefCta,
                                        !brief.trim() && styles.briefCtaDisabled,
                                        pressed && styles.pressed,
                                    ]}
                                    onPress={submitBrief}
                                    disabled={!brief.trim() || readOnly}
                                    accessibilityRole="button"
                                    accessibilityLabel="Start designing"
                                >
                                    <FontAwesomeIcon icon={faWandMagicSparkles} size={14} color={colors.onPrimary} />
                                    <Text style={styles.briefCtaText}>Start designing</Text>
                                </Pressable>
                            </View>

                            <Text style={styles.briefHint}>
                                The AI picks it up from here — you can keep refining it in the chat.
                            </Text>

                            {/* A cleared canvas only drops the pointer, so earlier
                                revisions are still there. Without this they would
                                be unreachable, since Revert lives on the canvas. */}
                            {!readOnly && history.length > 0 ? (
                                <Pressable
                                    style={({ pressed }) => [styles.restoreBtn, pressed && styles.pressed]}
                                    onPress={() => revertTo(history[0].id)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Restore the previous design"
                                >
                                    <FontAwesomeIcon icon={faClockRotateLeft} size={12} color={colors.textSecondary} />
                                    <Text style={styles.restoreBtnText}>Restore previous design</Text>
                                </Pressable>
                            ) : null}
                        </View>
                        )}
                    </ScrollView>
                )}
            </View>
            </View>

            {/* The timeline — the picture track, to scale, under the player.
                Only for a video: an image has no sequence, and a carousel's
                order is its slide strip. */}
            {isVideo && timeline.composition && (hasDesign || timeline.authored) ? (
                <TimelineStrip
                    composition={timeline.composition}
                    selectedClipId={selectedClipId}
                    onSelectClip={selectClip}
                    onToggleTransition={(clipId) => {
                        const current = timeline.composition;
                        if (!current) return;
                        const clips = (current.tracks ?? []).flatMap((t) => t.clips ?? []);
                        const clip = clips.find((c) => c.id === clipId);
                        const next = clip?.transitionIn?.kind === "fade" ? "cut" : "fade";
                        saveTimeline(setTransition(current, clipId, next));
                    }}
                    actions={timelineActions}
                    authored={timeline.authored}
                    onReset={() => {
                        void timeline.discard();
                        setSelectedClipId(null);
                    }}
                    readOnly={readOnly}
                />
            ) : null}

            {/* Sound — two lanes under the player (video only).
                Always visible: audio used to live behind a collapsed trigger
                that opened a sheet which narrowed the design above it, so you
                lost sight of the video while working on its audio. */}
            {isVideo ? (
                <AudioLanes
                    audio={props.audio}
                    onAudioChange={props.onAudioChange}
                    videoMs={durMs}
                    onAddMusic={() => setAudioSheet("music")}
                    onAddVoice={() => setAudioSheet("voice")}
                    readOnly={readOnly}
                />
            ) : null}

            <AssetsPanel
                visible={libraryOpen}
                onClose={() => setLibraryOpen(false)}
                onPick={addFromLibrary}
                title="Add a clip"
            />

            {/* On a phone the properties column does not exist, so a selected
                clip opens a sheet with the same body in it. */}
            <Modal
                visible={clipSheetOpen && !xl && !!clipInspector}
                transparent
                animationType="slide"
                onRequestClose={() => setClipSheetOpen(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setClipSheetOpen(false)}>
                    <Pressable style={styles.clipSheet} onPress={() => {}}>
                        <ScrollView contentContainerStyle={styles.clipSheetBody}>
                            {clipInspector}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            <AudioAddSheet
                mode={audioSheet}
                brandId={brandId}
                videoMs={durMs}
                voiceoverSource={props.voiceoverSource}
                audio={props.audio}
                onAudioChange={props.onAudioChange}
                onClose={() => setAudioSheet(null)}
            />

            <Modal visible={modalOpen !== null} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close}>
                    <Pressable style={styles.sheet} onPress={() => {}}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>
                                {modalOpen === "edit" ? "Edit text" : "Comment"}
                            </Text>
                            <Pressable
                                style={({ pressed }) => [styles.sheetClose, pressed && styles.pressed]}
                                onPress={close}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                hitSlop={8}
                            >
                                <FontAwesomeIcon icon={faXmark} size={15} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                        <TextInput
                            style={styles.sheetInput}
                            value={modalText}
                            onChangeText={setModalText}
                            placeholder={
                                modalOpen === "edit"
                                    ? "Type the new text"
                                    : "e.g. move this to the bottom and make it bigger"
                            }
                            placeholderTextColor={colors.textSecondary}
                            multiline={modalOpen === "comment"}
                            autoFocus
                        />
                        <View style={styles.sheetBtns}>
                            {modalOpen === "edit" ? (
                                <Pressable style={styles.primaryBtn} onPress={saveTextEdit}>
                                    <Text style={styles.primaryBtnText}>Save</Text>
                                </Pressable>
                            ) : (
                                <>
                                    <Pressable style={styles.modalSecondaryBtn} onPress={addPlainComment}>
                                        <Text style={styles.modalSecondaryBtnText}>Comment</Text>
                                    </Pressable>
                                    <Pressable style={styles.primaryBtn} onPress={askAI}>
                                        <Text style={styles.primaryBtnText}>Ask AI to apply</Text>
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Revert confirmation — rewinding to the previous version is a strong,
                easy-to-mistap action, so gate it behind an explicit confirm. */}
            <Modal visible={confirmRevert} transparent animationType="fade" onRequestClose={() => setConfirmRevert(false)}>
                <Pressable style={styles.backdrop} onPress={() => setConfirmRevert(false)}>
                    <Pressable style={styles.sheet} onPress={() => {}}>
                        <Text style={styles.sheetTitle}>Revert to previous version?</Text>
                        <Text style={styles.confirmBody}>
                            This rewinds the design to the last version. Your current version stays in
                            history, so you can move forward again.
                        </Text>
                        <View style={styles.sheetBtns}>
                            <Pressable style={styles.modalSecondaryBtn} onPress={() => setConfirmRevert(false)}>
                                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.primaryBtn}
                                onPress={() => {
                                    setConfirmRevert(false);
                                    if (history.length > 1) revertTo(history[1].id);
                                }}
                            >
                                <Text style={styles.primaryBtnText}>Revert</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const useStyles = (colors: any, topInset: number) =>
    useMemo(
        () =>
            StyleSheet.create({
                container: {
                    // Full-area surface (not a card): fills the whole centre column
                    // and sits on the app background so the header/soundtrack read as
                    // real toolbars rather than a floating card.
                    flex: 1,
                    backgroundColor: colors.background,
                    overflow: "hidden",
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingTop: 12 + topInset,
                    paddingBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.06,
                    elevation: 3,
                    backgroundColor: colors.card,
                    zIndex: 2,
                },
                closeBtn: {
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                title: { flex: 1, fontSize: fs(16), fontWeight: "700", color: colors.text },
                headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
                iconBtn: {
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                menuContent: { backgroundColor: colors.modalBackground, borderRadius: 12 },
                menuItemText: { fontSize: fs(14), fontWeight: "500", color: colors.text },
                renderBtn: {
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 9,
                    backgroundColor: colors.primary,
                    minWidth: 84,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                renderBtnText: { fontSize: fs(13), fontWeight: "700", color: colors.onPrimary },

                bodyRow: { flex: 1, flexDirection: "row", minHeight: 0 },
                body: { flex: 1, minWidth: 0 },
                canvasScroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 12 },
                canvasWrap: { alignItems: "center", gap: 12 },
                frameWrap: { borderRadius: 12, overflow: "visible" },

                // Render progress overlay (over the canvas while capturing)
                renderOverlay: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: colors.backdrop,
                    padding: 16,
                },
                renderCard: {
                    width: "100%",
                    maxWidth: 300,
                    gap: 12,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 16,
                    shadowOpacity: 0.2,
                    elevation: 10,
                },
                renderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
                renderLabelText: { flex: 1, fontSize: fs(13), fontWeight: "700", color: colors.text },
                renderTrack: { height: 8, borderRadius: 4, backgroundColor: colors.tag, overflow: "hidden" },
                renderFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
                renderFillIndeterminate: { height: 8, borderRadius: 4, width: "40%", backgroundColor: colors.primary, opacity: 0.5 },

                // Render-failure card (accent stripe, not a border, per style rules)
                renderErrorCard: {
                    alignSelf: "stretch",
                    flexDirection: "row",
                    overflow: "hidden",
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                renderErrorAccent: { width: 4, backgroundColor: colors.toastError },
                renderErrorBody: { flex: 1, padding: 12, gap: 6 },
                renderErrorHead: { flexDirection: "row", alignItems: "center", gap: 8 },
                renderErrorTitle: { fontSize: fs(13), fontWeight: "700", color: colors.text },
                renderErrorMsg: { fontSize: fs(12), lineHeight: lh(17), color: colors.textSecondary },
                renderErrorActions: { flexDirection: "row", gap: 8, marginTop: 2 },
                renderRetryBtn: {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                renderRetryText: { fontSize: fs(13), fontWeight: "700", color: colors.onPrimary },
                renderDismissBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.tag },
                renderDismissText: { fontSize: fs(13), fontWeight: "600", color: colors.text },

                // Selection overlay + floating contextual toolbar
                selectionOverlay: { ...StyleSheet.absoluteFillObject },
                scoreFloat: {
                    position: "absolute",
                    top: 64,
                    right: 16,
                    zIndex: 40,
                },
                floatToolbar: {
                    position: "absolute",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    paddingHorizontal: 5,
                    paddingVertical: 4,
                    borderRadius: 11,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 16,
                    shadowOpacity: 0.2,
                    elevation: 10,
                },
                tbBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 8,
                },
                tbBtnText: { fontSize: fs(13), fontWeight: "600", color: colors.text },
                tbDivider: { width: 1, height: 20, backgroundColor: colors.tag, marginHorizontal: 2 },
                tbClose: {
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                },

                slideNav: { flexDirection: "row", alignItems: "center", gap: 12 },
                slideArrow: {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                slideArrowText: { fontSize: fs(18), color: colors.text, lineHeight: lh(20) },
                dots: { flexDirection: "row", alignItems: "center", gap: 6 },
                dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tag },
                dotActive: { backgroundColor: colors.primary, width: 20 },
                videoBar: { flexDirection: "row", alignItems: "center", gap: 10 },
                playBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                playIcon: { color: colors.onPrimary, fontSize: fs(13) },
                // Tall, transparent hit area so the thin bar is easy to grab/drag.
                trackHit: { flex: 1, height: 24, justifyContent: "center" },
                track: { height: 6, borderRadius: 3, backgroundColor: colors.tag, overflow: "hidden" },
                trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
                thumb: {
                    position: "absolute",
                    top: "50%",
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    marginTop: -7,
                    marginLeft: -7,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.4,
                    elevation: 3,
                },
                time: { fontSize: fs(12), color: colors.textSecondary, minWidth: 64, textAlign: "right" },

                // Empty canvas → brief step
                emptyIcon: {
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.aliceBlue,
                },
                emptyTitle: { fontSize: fs(17), fontWeight: "700", color: colors.text },
                emptySub: {
                    fontSize: fs(13),
                    lineHeight: lh(20),
                    color: colors.textSecondary,
                    textAlign: "center",
                    maxWidth: 320,
                },

                // Brief step — the empty-canvas prompt that starts a design.
                briefScroll: {
                    flexGrow: 1,
                    justifyContent: "center",
                },
                brief: {
                    alignItems: "center",
                    alignSelf: "center",
                    width: "100%",
                    maxWidth: 560,
                    padding: 28,
                    gap: 12,
                },
                briefInput: {
                    width: "100%",
                    minHeight: 128,
                    marginTop: 4,
                    borderRadius: 14,
                    // Background (not an outline) signals the field is editable.
                    backgroundColor: colors.card,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: fs(14),
                    lineHeight: lh(21),
                    color: colors.text,
                    textAlignVertical: "top",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                // The picker and the CTA share a row: the model is part of the
                // decision being made here, not a separate setting elsewhere.
                briefActions: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginTop: 16,
                },
                generatingTitle: {
                    marginTop: 20,
                },
                // The user's own words, held where they typed them, so the wait
                // shows what is being worked on rather than a bare spinner.
                pendingBrief: {
                    marginTop: 24,
                    maxWidth: 520,
                    width: "100%",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: colors.tag,
                },
                pendingBriefLabel: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    fontWeight: "700",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                    marginBottom: 6,
                },
                pendingBriefText: {
                    fontSize: fs(14),
                    lineHeight: lh(21),
                    color: colors.text,
                },
                briefCta: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 11,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                briefCtaDisabled: { opacity: 0.5 },
                briefCtaText: { color: colors.onPrimary, fontSize: fs(14), fontWeight: "800" },
                briefHint: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    textAlign: "center",
                },
                restoreBtn: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                restoreBtnText: {
                    fontSize: fs(13),
                    fontWeight: "700",
                    color: colors.textSecondary,
                },

                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                sheet: { width: "100%", maxWidth: 420, borderRadius: 16, backgroundColor: colors.card, padding: 16, gap: 12 },
                // The clip's properties on a phone. Capped at most of the
                // screen rather than sized to its contents: a footage clip's
                // transcript is long, and a sheet that grows with it would push
                // its own controls off the bottom.
                clipPreviewNote: {
                    marginTop: 10,
                    maxWidth: 420,
                    textAlign: "center",
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                },
                clipSheet: {
                    width: "100%",
                    maxWidth: 480,
                    maxHeight: "80%",
                    borderRadius: 16,
                    backgroundColor: colors.card,
                },
                clipSheetBody: { padding: 16 },
                sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                sheetClose: {
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                sheetTitle: { fontSize: fs(16), fontWeight: "600", color: colors.text },
                confirmBody: { fontSize: fs(13), lineHeight: lh(19), color: colors.textSecondary },
                sheetInput: {
                    minHeight: 44,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.text,
                    backgroundColor: colors.tag,
                },
                sheetBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
                modalSecondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.tag },
                modalSecondaryBtnText: { color: colors.text, fontSize: fs(14) },
                primaryBtn: {
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                primaryBtnText: { color: colors.onPrimary, fontSize: fs(14), fontWeight: "600" },
                pressed: { opacity: 0.72 },
            }),
        [colors, topInset]
    );

export default DesignStage;
