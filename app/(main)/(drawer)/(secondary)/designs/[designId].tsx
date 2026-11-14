import StudioBriefPanel from "@/components/designs/StudioBriefPanel";
import AIChatPanel from "@/components/shared/AIChatPanel";
import StudioSidePanel from "@/components/designs/StudioSidePanel";
import type { DesignRevision } from "@/components/designs/revisions";
import type { ElementEdit } from "@/components/designs/inspector-edit";
import type { DesignAsset, MediaPlacement, SceneOperation } from "@/components/designs/StudioSidePanel";
import type { CaptionTrack } from "@/components/designs/caption-tracks";
import AssetPreviewModal from "@/shared-uis/components/carousel/asset-preview-modal";
import { Audio } from "expo-av";
import { VOICE_PENDING, lineEdit, type ScriptLine } from "@/components/designs/script-lines";
import StudioStage from "@/components/designs/StudioStage";
import StudioTimeline from "@/components/designs/StudioTimeline";
import TimelineAddBar, { type TimelineAddTarget } from "@/components/designs/TimelineAddBar";
import { type Window as ClipWindow } from "@/components/designs/timeline-drag";
import {
    designAspect,
    designStatus,
    hasBeenSeen,
    isAuthoring,
    isPreviewing,
    isRendering,
    resolveDesignGate,
    type DesignStatusFields,
} from "@/components/designs/design-status";
import {
    sceneAt,
    timelineDurationMs,
    type DesignClip,
    type DesignScene,
} from "@/components/designs/studio-layout";
import { useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import PageHeader from "@/components/ui/page-header";
import { fs, lh } from "@/constants/Typography";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { formatTokens, useEntitlements } from "@/hooks/use-entitlements";
import AppLayout from "@/layouts/app-layout";
import { HttpError, HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { useTheme } from "@react-navigation/native";
import { selectionLabel, type Selection } from "@/components/designs/selection";
import type { Focus } from "@/types/focus";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Design Studio — one design, as an editor.
 *
 * Three panes over a timeline, which is the shape of the Hyperframes editor
 * this studio renders through. Matching it is not imitation for its own sake:
 * a design here IS a Hyperframes project, and a user who has seen one should
 * recognise the other.
 *
 *   ┌──────────┬─────────────────────┬──────────┐
 *   │  brief   │        stage        │  layers  │
 *   │ + actions│     + transport     │ + media  │
 *   ├──────────┴─────────────────────┴──────────┤
 *   │                timeline                   │
 *   └───────────────────────────────────────────┘
 *
 * ── One clock ─────────────────────────────────────────────────────────────
 * The playhead is a single position over the whole film, and everything else
 * is derived from it: the frame on the stage, the clip highlighted on the
 * timeline, the scene named in the layer tree. When a render exists the VIDEO
 * owns that clock and reports back, because two clocks that can disagree is
 * how you get a picture showing one scene while the timeline points at
 * another.
 *
 * ── Why the stage is a frame, not a live player ───────────────────────────
 * Hyperframes' own player would scrub the real composition, but the project
 * in S3 is not self-contained (GSAP is vendored at render time), and the
 * player needs a native WebView nothing here has tested. So an unrendered
 * design scrubs its PREVIEW FRAMES, and a rendered one plays its file. Both
 * drive the same transport, because which artefact is behind the picture is
 * our problem rather than the user's.
 *
 * ── Why this polls ────────────────────────────────────────────────────────
 * Authoring, previewing and rendering all outlive the request that starts
 * them — that is why they are queued — so their state lives on the design
 * document and the app reads it back. That is what lets the work survive a
 * reload or a locked phone.
 */

/** A design as the detail endpoint returns it. */
interface Design extends DesignStatusFields {
    id: string;
    name: string;
    contentId?: string;
    posterUrl?: string;
    previewUrl?: string;
    brief?: string;
    scenes?: DesignScene[];
    /** Every timed thing in the film, each on its row — the timeline. */
    clips?: DesignClip[];
    /** Every version this film has been — see components/designs/revisions. */
    revisions?: DesignRevision[];
}

const POLL_MS = 5000;

/** Which pane a phone is showing, since three columns do not fit one. */
type MobilePane = "brief" | "stage" | "layers";

const DesignDetail = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;
    const { designId } = useLocalSearchParams<{ designId: string }>();

    const { tokens } = useEntitlements();

    const [design, setDesign] = useState<Design | null>(null);
    const [brief, setBrief] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gate, setGate] = useState<string | null>(null);
    // Why the last inspector edit was refused, shown beside the controls.
    const [editError, setEditError] = useState<string | null>(null);
    // The film as words. Fetched beside the design rather than carried on
    // it: it is derived from the project, and a copy on the document would
    // be a second thing to keep in step with the film.
    const [script, setScript] = useState<ScriptLine[]>([]);
    // What the project directory holds. Read beside the script, and for
    // the same reason: it is a fact about the files, not about the
    // document, so the design cannot carry it.
    const [assets, setAssets] = useState<DesignAsset[]>([]);
    const [captions, setCaptions] = useState<CaptionTrack[]>([]);
    // What the preview modal is showing. Pictures and video go through
    // the same modal the rest of the app uses; sound does not, because a
    // full-screen black rectangle is not a preview of a wav.
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewIsVideo, setPreviewIsVideo] = useState(false);
    const [playingAsset, setPlayingAsset] = useState<string | null>(null);
    const sound = useRef<Audio.Sound | null>(null);
    const [positionMs, setPositionMs] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [loop, setLoop] = useState(true);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    // What the user clicked inside the player. Owned here because three
    // panels read it — the scene tree highlights its scene, the inspector
    // shows it, and from Phase 14 the AI panel scopes an edit to it.
    const [selection, setSelection] = useState<Selection | null>(null);
    /** A clip picked on the timeline that is not a scene — a voiceover, a
     *  music track, a photograph. Highlighted there and nowhere else. */
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    /** Where "put something here" is pointing, or null when it is closed. */
    const [addAt, setAddAt] = useState<TimelineAddTarget | null>(null);
    const [pane, setPane] = useState<MobilePane>("stage");
    // Watching the live composition rather than the rendered file. Web only:
    // the player is 776 KB of JavaScript and a React Native WebView has never
    // been tried with it, so a phone keeps the stills.
    const [live, setLive] = useState(false);

    // The stored brief is seeded ONCE, and never over text the user has
    // already typed: re-seeding on a poll would clobber their edits
    // mid-render, and seeding at all would clobber them if the first GET
    // lands while they are typing into what rendered as an empty box.
    const briefSeeded = useRef(false);
    const briefRef = useRef("");

    // ── Give the editor the width ─────────────────────────────────────────
    // Three panes and a timeline need room, and the expanded rail costs 280px
    // of it. Collapsed on arrival, and the user's own setting is PUT BACK on
    // the way out — quietly keeping a sidebar closed because they once opened
    // a design would be us deciding something that is theirs to decide.
    //
    // Desktop only: on a phone the rail is an overlay, so there is nothing to
    // reclaim and collapsing it would just change state behind their back.
    const { isCollapsed, setCollapsed } = useSidebarCollapsed();
    const collapsedOnArrival = useRef(isCollapsed);
    useEffect(() => {
        if (!xl) return;
        collapsedOnArrival.current = isCollapsed;
        setCollapsed(true);
        return () => setCollapsed(collapsedOnArrival.current);
        // Deliberately once per visit: re-running when `isCollapsed` changes
        // would fight the user if they expanded the rail while reading, and
        // would overwrite the state we are holding for them.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xl]);

    const load = useCallback(async () => {
        if (!brandId || !designId) return;
        try {
            const res = await HttpWrapper.fetch(`/api/design/brands/${brandId}/designs/${designId}`, {
                method: "GET",
            });
            const data = await res.json();
            if (data?.design) {
                const next = data.design as Design;
                setDesign(next);
                if (!briefSeeded.current && next.brief && !briefRef.current) {
                    briefSeeded.current = true;
                    briefRef.current = next.brief;
                    setBrief(next.brief);
                }
            }
        } catch {
            /* A failed poll is not worth a toast; the next one usually works. */
        }
    }, [brandId, designId]);

    useEffect(() => {
        load();
    }, [load]);

    // Re-read whenever the film changes — projectPrefix moves on every
    // revision, so this follows an edit from any of the panels, including
    // one made in another tab.
    const projectPrefix = design?.projectPrefix;
    useEffect(() => {
        if (!brandId || !designId || !projectPrefix) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await HttpWrapper.fetch(
                    `/api/design/brands/${brandId}/designs/${designId}/script`,
                    { method: "GET" }
                );
                const data = await res.json();
                if (!cancelled && Array.isArray(data?.lines)) setScript(data.lines as ScriptLine[]);
                if (!cancelled && Array.isArray(data?.captions)) {
                    setCaptions(data.captions as CaptionTrack[]);
                }

                const assetRes = await HttpWrapper.fetch(
                    `/api/design/brands/${brandId}/designs/${designId}/assets`,
                    { method: "GET" }
                );
                const assetData = await assetRes.json();
                if (!cancelled && Array.isArray(assetData?.assets)) {
                    setAssets(assetData.assets as DesignAsset[]);
                }
            } catch {
                /* The script is a view of the film; a failed read leaves
                   the last one on screen rather than emptying the panel. */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [brandId, designId, projectPrefix]);

    // A token gate the backend set has to be able to lift, or one 402 hides
    // the buttons for as long as the screen is open.
    useEffect(() => {
        if (gate === "tokens_exhausted" && tokens.state !== "exhausted" && tokens.total > 0) {
            setGate(null);
        }
    }, [gate, tokens.state, tokens.total]);

    useEffect(() => {
        if (!isAuthoring(design) && !isRendering(design) && !isPreviewing(design)) return;
        const t = setInterval(load, POLL_MS);
        return () => clearInterval(t);
    }, [design, load]);

    const act = useCallback(
        async (
            path: string,
            body: Record<string, unknown> | undefined,
            onOk: (data: Record<string, unknown>) => void,
            failTitle: string,
            // When a caller can show the reason in context — the inspector
            // can, beside the control that caused it — it takes the message
            // instead of a toast the user dismisses and then has a panel
            // showing a value that is not in the film.
            onFail?: (message: string) => void
        ) => {
            // Refused, not queued: the caller is told so it can keep its
            // own state honest. The inspector needs that — a change it
            // thinks landed and did not would never be sent again.
            if (!brandId || !designId || submitting) return false;
            setSubmitting(true);
            try {
                const res = await HttpWrapper.fetch(
                    `/api/design/brands/${brandId}/designs/${designId}/${path}`,
                    {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify(body ?? {}),
                    }
                );
                onOk((await res.json()) ?? {});
                setGate(null);
                await load();
                return true;
            } catch (err: unknown) {
                // 402 is a wall, not a failure: the design is fine, the
                // wallet is empty, and retrying unchanged would fail again.
                // So the buttons are replaced with the reason rather than a
                // toast the user can dismiss and press again.
                if (err instanceof HttpError && err.status === 402) {
                    setGate(err.data?.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked");
                } else if (onFail) {
                    const data = err instanceof HttpError ? err.data : undefined;
                    onFail(
                        (typeof data?.message === "string" && data.message) ||
                            (typeof data?.error === "string" && data.error) ||
                            "That change could not be applied."
                    );
                } else {
                    Toaster.error(failTitle, "Please try again.");
                }
                return false;
            } finally {
                setSubmitting(false);
            }
        },
        [brandId, designId, submitting, load]
    );

    // ── Going back ───────────────────────────────────────────────────────
    // The player and the stage both read what the document says, and `act`
    // reloads it, so putting the pointer back is the whole of this: the
    // next poll brings the restored film, its scenes and its player URL.
    //
    // No confirmation step. A restore is itself recorded as a revision, so
    // the thing it would be protecting against — losing the version you are
    // on — cannot happen; the version you left is the top of the list.
    const restore = useCallback(
        (n: number) =>
            act(
                `revisions/${n}/restore`,
                undefined,
                () => Toaster.success("Put back", `This film is version ${n} again.`),
                "Couldn't restore that version"
            ),
        [act]
    );

    // ── An inspector edit ────────────────────────────────────────────────
    // No model, no job, no charge: the answer carries the new player URL,
    // and `act` reloads the document, so the film on screen becomes the
    // edited one. A refusal is shown IN the panel rather than as a toast —
    // "that change would break the film" is about the control the user is
    // holding, and a toast they can dismiss would leave them with a panel
    // showing a value that is not in the film.
    const editElement = useCallback(
        (edit: ElementEdit) => {
            setEditError(null);
            return act(
                "element",
                edit as unknown as Record<string, unknown>,
                () => {},
                "Couldn't apply that change",
                setEditError
            );
        },
        [act]
    );

    // ── A scoped AI edit ─────────────────────────────────────────────────
    // The difference between an edit and a re-roll: with an element
    // selected the instruction goes to that element alone, and the backend
    // refuses an answer that is anything other than a replacement for it.
    // With nothing selected there is no box, and the only AI action is the
    // whole-film rewrite above it.
    const askAboutSelection = useCallback(
        (instruction: string) => {
            if (!selection) return;
            return act(
                "element/ai",
                { elementId: selection.elementId, instruction },
                () => Toaster.success("Changed", "The film has been updated."),
                "Couldn't make that change"
            );
        },
        [act, selection]
    );

    // ── The film's shape ─────────────────────────────────────────────────
    // Retime, reorder, duplicate, add, delete. No model and no charge; the
    // backend ripples the scenes after the one that moved and recomputes
    // the film's length, which is what a render is priced from.
    const changeScenes = useCallback(
        (op: SceneOperation) =>
            act(
                "structure",
                op as unknown as Record<string, unknown>,
                () => {},
                "Couldn't change the scenes",
                (message) => Toaster.error("Couldn't change the scenes", message)
            ),
        [act]
    );

    // ── One clip, moved or trimmed ───────────────────────────────────────
    // A different endpoint shape from a scene op and deliberately so: a
    // scene op relays the film around the scene that moved, and a clip op
    // moves exactly one element. Dragging the music must not relay the
    // scenes.
    //
    // The backend may MOVE the element out of the scene that held it, when
    // the new window escapes that scene's — otherwise the clip would be
    // clipped and silently absent from a film that still renders. Nothing
    // to say here: `act` reloads the document either way.
    const retimeClip = useCallback(
        (clip: { elementId: string }, window: ClipWindow) =>
            act(
                "structure",
                {
                    op: "clip-retime",
                    clipId: clip.elementId,
                    startMs: window.startMs,
                    durationMs: window.durationMs,
                },
                () => {},
                "Couldn't move that",
                (message) => Toaster.error("Couldn't move that", message)
            ),
        [act]
    );

    const deleteClip = useCallback(
        (clip: { elementId: string; label?: string }) =>
            act(
                "structure",
                { op: "clip-delete", clipId: clip.elementId },
                () => {
                    setSelectedClipId(null);
                    Toaster.success("Removed", `${clip.label || clip.elementId} is out of the film.`);
                },
                "Couldn't remove that",
                (message) => Toaster.error("Couldn't remove that", message)
            ),
        [act]
    );

    // ── Putting something at a moment ────────────────────────────────────
    // The same endpoint the media panel uses, with a moment and a row
    // instead of a scene — so the backend puts it at the film's own level
    // rather than inside a scene that may end before it.
    const addAtMoment = useCallback(
        (body: Record<string, unknown>) => {
            if (!addAt) return;
            return act(
                "media",
                { ...body, startMs: addAt.atMs, trackIndex: addAt.trackIndex },
                (data) => {
                    setAddAt(null);
                    if (data?.pending) {
                        Toaster.success(
                            "Asked for",
                            "It will be fetched the next time this film is previewed or rendered."
                        );
                    }
                },
                "Couldn't add that",
                (message) => Toaster.error("Couldn't add that", message)
            );
        },
        [act, addAt]
    );

    // ── A rewritten line ─────────────────────────────────────────────────
    // Through the same endpoint the inspector uses. A voiceover is the
    // exception that proves the rule: it writes the words to SAY rather
    // than the words to show, and the film does not say them until the
    // next preview or render — so the panel says so rather than letting
    // someone believe the film already changed.
    const editLine = useCallback(
        (line: ScriptLine, next: string) =>
            act(
                "element",
                lineEdit(line, next),
                () => {
                    if (line.kind === "voice") Toaster.success("Line saved", VOICE_PENDING);
                },
                "Couldn't change that line",
                (message) => Toaster.error("Couldn't change that line", message)
            ),
        [act]
    );

    // ── Media, placed by hand ────────────────────────────────────────────
    // A file the project already holds goes on immediately. Anything new
    // is a declaration the next preview or render fetches, which is what
    // `pending` in the answer means — said out loud, because the film
    // does not have the photograph yet.
    const addMedia = useCallback(
        (place: MediaPlacement) =>
            act(
                "media",
                place as unknown as Record<string, unknown>,
                (data) => {
                    if (data?.pending) {
                        Toaster.success(
                            "Asked for",
                            "It will be fetched the next time this film is previewed or rendered."
                        );
                    }
                },
                "Couldn't add that",
                (message) => Toaster.error("Couldn't add that", message)
            ),
        [act]
    );

    // ── Opening one of the film's own files ──────────────────────────────
    // A picture or a clip goes to the shared asset preview modal. A sound
    // plays in place: one at a time, and pressing the one that is playing
    // stops it, because two voiceovers over each other is not a preview
    // of either.
    const openAsset = useCallback(async (a: DesignAsset) => {
        if (!a.url) return;
        if (a.kind === "audio") {
            try {
                if (sound.current) {
                    await sound.current.unloadAsync();
                    sound.current = null;
                }
                if (playingAsset === a.path) {
                    setPlayingAsset(null);
                    return;
                }
                const { sound: s } = await Audio.Sound.createAsync({ uri: a.url }, { shouldPlay: true });
                sound.current = s;
                setPlayingAsset(a.path);
                s.setOnPlaybackStatusUpdate((st) => {
                    if ("didJustFinish" in st && st.didJustFinish) setPlayingAsset(null);
                });
            } catch {
                Toaster.error("Couldn't play that", "The file may still be uploading.");
                setPlayingAsset(null);
            }
            return;
        }
        setPreviewIsVideo(a.kind === "video");
        setPreviewUrl(a.url);
    }, [playingAsset]);

    // A sound left playing after the screen closes would follow the user
    // to the next page.
    useEffect(
        () => () => {
            sound.current?.unloadAsync().catch(() => {});
            sound.current = null;
        },
        []
    );

    const author = useCallback(() => {
        const text = brief.trim();
        if (!text) {
            Toaster.error("Tell it what to make", "Describe the film in a sentence or two.");
            return;
        }
        return act(
            "author",
            { brief: text },
            () => Toaster.success("Writing your design", "You can leave this page — we'll finish it."),
            "Couldn't start writing"
        );
    }, [brief, act]);

    const preview = useCallback(
        () => act("preview", undefined, () => undefined, "Couldn't start the preview"),
        [act]
    );

    const render = useCallback(
        () =>
            act(
                "render",
                { quality: "delivery" },
                (data) => {
                    if (data?.status === "done") {
                        Toaster.success("Already rendered", "This design is up to date.");
                    } else if (typeof data?.refunded === "number" && data.refunded > 0) {
                        // A balance that dropped for nothing and quietly
                        // recovered is indistinguishable from one never
                        // charged. The person who watched it drop is the one
                        // who needs telling it was put right.
                        Toaster.success(
                            `${formatTokens(data.refunded)} tokens returned`,
                            "The attempt that failed has been refunded. Rendering again now."
                        );
                    } else {
                        Toaster.success("Rendering your design", "You can leave this page — we'll finish it.");
                    }
                },
                "Couldn't start the render"
            ),
        [act]
    );

    const status = designStatus(design);
    const effectiveGate = resolveDesignGate(gate, tokens.state);
    const aspect = designAspect(design);
    const scenes = design?.scenes;
    const clips = design?.clips;
    const totalMs = timelineDurationMs(design?.durationMs, scenes, clips);
    const written = !!design?.projectPrefix;
    const seen = hasBeenSeen(design);

    // The scene under the playhead, unless the user picked one explicitly.
    const activeSceneId = selectedSceneId ?? sceneAt(scenes, positionMs)?.id ?? null;

    // Choosing a scene by hand clears the element. They are two answers to
    // "what are we looking at", and leaving a stale element selected while
    // the user moves to another scene makes the inspector lie.
    const onSelectScene = useCallback((id: string | null) => {
        setSelectedSceneId(id);
        setSelection(null);
        setSelectedClipId(null);
    }, []);

    const onSeek = useCallback((ms: number) => {
        setPositionMs(ms);
        setSelectedSceneId(null);
        setSelectedClipId(null);
    }, []);

    // ── Clicking something on the timeline ───────────────────────────────
    // Seeks to where it starts, which is the one thing a person always
    // means by clicking a clip: a voiceover row tells you nothing until the
    // film is at the moment it speaks.
    //
    // It does NOT populate the inspector. The inspector's properties are
    // the element's COMPUTED style, which only the player can report, and
    // an inspector filled in from a clip would show "unset" for a headline
    // that is plainly navy. So a clip selects itself on the timeline, and
    // clicking it in the player is still how you edit it.
    const onSelectClip = useCallback((clip: DesignClip) => {
        setPositionMs(clip.startMs ?? 0);
        // The inspector describes the element the PLAYER reported, and
        // picking a clip here means we are looking at something else. A
        // stale element left in the panel is not merely untidy: an edit
        // typed into it applies to the headline someone clicked a minute
        // ago rather than to the clip that is plainly highlighted.
        setSelection(null);
        if (clip.kind === "scene") {
            setSelectedClipId(null);
            return;
        }
        setSelectedClipId(clip.elementId);
        setSelectedSceneId(null);
    }, []);

    // ── The timeline, written once ───────────────────────────────────────
    // Mounted in two places — under the three desktop panes, and under the
    // stage on a phone. Two copies of eleven props is two copies that drift,
    // and the one that drifts is the phone's, because it is the one nobody
    // looks at while building the desktop layout.
    const timeline = (
        <>
            <StudioTimeline
                clips={clips}
                scenes={scenes}
                totalMs={totalMs}
                positionMs={positionMs}
                selectedSceneId={activeSceneId}
                selectedClipId={selectedClipId}
                onSeek={onSeek}
                onSelectScene={onSelectScene}
                onSelectClip={onSelectClip}
                onRetimeClip={retimeClip}
                onDeleteClip={deleteClip}
                onAddAt={(track, atMs) =>
                    setAddAt({
                        trackIndex: track.index,
                        rowLabel: track.label,
                        rowKind: track.kind,
                        atMs,
                    })
                }
                busy={submitting}
            />
            {addAt && (
                <TimelineAddBar
                    target={addAt}
                    assets={assets.map((a) => ({ path: a.path, name: a.name, kind: a.kind }))}
                    busy={submitting}
                    onClose={() => setAddAt(null)}
                    onPlaceAsset={(assetPath, type) => addAtMoment({ type, assetPath })}
                    onAskFor={(intent, type) => addAtMoment({ type, intent })}
                />
            )}
        </>
    );

    // ── The conversation beside the film ────────────────────────────────
    // One thread per film, on the `design` module — which runs on
    // TaskDesign and therefore on Claude Opus 4.8, not on the chat lane's
    // Gemini Flash. The backend's TaskForModule is the other half of that.
    //
    // The selection travels as a focus chip rather than as words in the
    // message: a chip is addressed (`film-element`, with the element's own
    // id), shown to the user before they send, and removable. "Make this
    // bigger" typed with nothing selected is then plainly a question about
    // the whole film rather than a guess the model has to make.
    const focusItems = useMemo<Focus[]>(() => {
        if (!selection || !designId) return [];
        return [
            {
                id: `film:${selection.elementId}`,
                focusText: selectionLabel(selection),
                focusArea: {
                    type: "film-element",
                    designId,
                    elementId: selection.elementId,
                    sceneId: selection.sceneId || undefined,
                    tag: selection.tag,
                    text: selection.text || undefined,
                },
            },
        ];
    }, [selection, designId]);

    // ⚠️ Not before the route has resolved. useLocalSearchParams returns {}
    // on the first render, and a thread created in that window is bound to
    // no film — designStudioBrief returns nothing for an empty designId, so
    // the studio would answer about nothing in particular.
    const studioChat = !designId ? null : (
        <AIChatPanel
            module="design"
            contextId={designId}
            title="Design Studio"
            isCompact
            placeholder="Ask for a change…"
            focusItems={focusItems}
            onRemoveFocusItem={() => setSelection(null)}
        />
    );

    const briefPanel = (
        <StudioBriefPanel
            brief={brief}
            renderUrl={design?.renderUrl}
            onBriefChange={(t) => {
                briefRef.current = t;
                setBrief(t);
            }}
            status={status}
            gate={effectiveGate}
            tokenState={tokens.state}
            written={written}
            authoring={isAuthoring(design)}
            rendering={isRendering(design)}
            preparing={isPreviewing(design)}
            preparationFailed={design?.previewStatus === "failed"}
            selectionLabel={selection ? selectionLabel(selection) : null}
            onAskAboutSelection={askAboutSelection}
            onRetryPreparation={preview}
            submitting={submitting}
            linkedToContent={!!design?.contentId}
            onAuthor={author}
            onRender={render}
            chat={studioChat}
        />
    );

    // Default to the live player when nothing is rendered yet: a written
    // design with no film is exactly the case stills were a stand-in for.
    // Once a render exists the FILE leads, because that is what gets
    // published, and the toggle is there to check a rewrite before paying to
    // render it again.
    const canGoLive = Platform.OS === "web" && !!design?.previewUrl;
    const showLive = canGoLive && (live || !design?.renderUrl);

    const stage = (
        <StudioStage
            previewUrl={design?.previewUrl}
            live={showLive}
            selection={selection}
            onSelectElement={setSelection}
            renderUrl={design?.renderUrl}
            posterUrl={design?.posterUrl}
            frames={design?.previewFrames}
            aspect={aspect}
            positionMs={positionMs}
            totalMs={totalMs}
            playing={playing}
            busy={status.busy}
            busyLabel={status.busy ? status.text : undefined}
            loop={loop}
            onPlayPause={() => setPlaying((p) => !p)}
            onSeek={onSeek}
            onToggleLoop={() => setLoop((l) => !l)}
            onPositionFromVideo={setPositionMs}
        />
    );

    const sidePanel = (
        <StudioSidePanel
            scenes={scenes}
            frames={design?.previewFrames}
            brief={brief}
            selectedSceneId={activeSceneId}
            selection={selection}
            revisions={design?.revisions}
            currentPrefix={design?.projectPrefix}
            onRestore={restore}
            restoring={submitting}
            assets={assets}
            onAddMedia={addMedia}
            onOpenAsset={openAsset}
            playingAsset={playingAsset}
            captions={captions}
            script={script}
            onEditLine={editLine}
            onScene={changeScenes}
            busyScenes={submitting}
            onEditElement={editElement}
            editing={submitting}
            editError={editError}
            onSelectScene={onSelectScene}
            onSeek={setPositionMs}
        />
    );

    return (
        <AppLayout>
            <PageHeader
                title={design?.name || "Design"}
                subtitle={status.bad ? "Something went wrong" : status.detail}
                showBackButton
                mobileActions="all"
            />

            {status.bad && (
                <View style={styles.errorWrap}>
                    <View style={styles.errorAccent} />
                    {/* The real reason goes in the body, not the header: a
                        validator message is the one thing that tells the user
                        what to change, and a header subtitle truncates it —
                        and is hidden entirely on a phone. */}
                    <Text style={styles.errorText}>{status.detail}</Text>
                </View>
            )}

            {xl ? (
                <View style={styles.desktop}>
                    <View style={styles.columns}>
                        <View style={styles.leftPane}>{briefPanel}</View>
                        <View style={styles.centerPane}>
                            {canGoLive && !!design?.renderUrl && (
                                <View style={styles.sourceTabs}>
                                    {[
                                        { on: showLive, label: "Live", v: true },
                                        { on: !showLive, label: "Rendered film", v: false },
                                    ].map((t) => (
                                        <Pressable
                                            key={t.label}
                                            onPress={() => setLive(t.v)}
                                            style={[styles.sourceTab, t.on && styles.sourceTabOn]}
                                            accessibilityRole="tab"
                                            accessibilityState={{ selected: t.on }}
                                        >
                                            <Text style={[styles.sourceLabel, t.on && styles.sourceLabelOn]}>
                                                {t.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                            {stage}
                        </View>
                        <View style={styles.rightPane}>{sidePanel}</View>
                    </View>
                    {timeline}
                </View>
            ) : (
                <View style={styles.mobile}>
                    {/* Three columns do not fit a phone, and shrinking them
                        gives three unusable ones. The stage keeps the width
                        it needs and the other two take turns. */}
                    <View style={styles.paneTabs}>
                        {(["brief", "stage", "layers"] as MobilePane[]).map((p) => (
                            <Pressable
                                key={p}
                                onPress={() => setPane(p)}
                                style={[styles.paneTab, pane === p && styles.paneTabOn]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: pane === p }}
                            >
                                <Text style={[styles.paneTabLabel, pane === p && styles.paneTabLabelOn]}>
                                    {p === "brief" ? "Brief" : p === "stage" ? "Film" : "Layers"}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.mobileBody}>
                        {pane === "brief" ? briefPanel : pane === "layers" ? sidePanel : stage}
                    </View>
                    {pane === "stage" && timeline}
                </View>
            )}

            {/* The asset preview the rest of the app uses, reused here so a
                file in the media panel opens the way a file opens
                everywhere else. */}
            <AssetPreviewModal
                previewImage={!!previewUrl}
                previewImageUrl={previewIsVideo ? null : previewUrl}
                previewVideoUrl={previewIsVideo ? previewUrl : null}
                setPreviewImage={(open) => {
                    const next = typeof open === "function" ? open(!!previewUrl) : open;
                    if (!next) setPreviewUrl(null);
                }}
                theme={theme}
            />
        </AppLayout>
    );
};

export default DesignDetail;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                desktop: { flex: 1 },
                columns: { flex: 1, flexDirection: "row" },
                leftPane: {
                    width: 320,
                    shadowColor: "#000",
                    shadowOffset: { width: 4, height: 0 },
                    shadowRadius: 12,
                    shadowOpacity: 0.06,
                    elevation: 6,
                    zIndex: 2,
                },
                centerPane: { flex: 1 },
                sourceTabs: {
                    flexDirection: "row",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.black,
                },
                sourceTab: {
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: withAlpha(colors.white, 0.1),
                },
                sourceTabOn: { backgroundColor: colors.primary },
                sourceLabel: {
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "700",
                    color: withAlpha(colors.white, 0.75),
                },
                sourceLabelOn: { color: colors.onPrimary },
                rightPane: {
                    width: 290,
                    shadowColor: "#000",
                    shadowOffset: { width: -4, height: 0 },
                    shadowRadius: 12,
                    shadowOpacity: 0.06,
                    elevation: 6,
                    zIndex: 2,
                },
                mobile: { flex: 1 },
                mobileBody: { flex: 1 },
                paneTabs: {
                    flexDirection: "row",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.card,
                },
                paneTab: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.tag,
                },
                paneTabOn: { backgroundColor: colors.primary },
                paneTabLabel: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                paneTabLabelOn: { color: colors.onPrimary },
                errorWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginHorizontal: 14,
                    marginTop: 10,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: colors.tag,
                },
                errorAccent: { width: 4, alignSelf: "stretch", backgroundColor: colors.red },
                errorText: {
                    flex: 1,
                    paddingVertical: 10,
                    paddingRight: 12,
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.text,
                },
            }),
        [colors]
    );
}
