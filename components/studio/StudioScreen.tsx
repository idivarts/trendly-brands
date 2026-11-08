/**
 * StudioScreen — the Design Studio.
 *
 * ── The shell, and what it owns ─────────────────────────────────────────────
 * It owns exactly one piece of state the other components do not: THE PLAYHEAD.
 * A single position over the whole timeline, from which the scene currently on
 * screen is derived. The old studio kept a slide index and a video position
 * separately, which could and did disagree — the state where the picture showed
 * one scene and the sound played over the next.
 *
 * Everything else lives where it belongs: order and length in `use-studio`
 * (measured by code shared with the renderer), layout in `studio-runtime`,
 * media in `use-studio-media`.
 *
 * ── It opens blank ──────────────────────────────────────────────────────────
 * No scenes, and the director is an OFFER beside "Add scene" rather than a gate
 * in front of it. A studio that opened with a scene in it would have guessed
 * what the user is making, and someone who knows what they want should never
 * have to decline help to get a canvas.
 */
import { fs, lh, fbox } from "@/constants/Typography";
import { TokenMeterBar } from "@/components/billing/TokenMeter";
import CastSheet from "@/components/studio/CastSheet";
import DirectorSheet from "@/components/studio/DirectorSheet";
import GenerateSheet from "@/components/studio/GenerateSheet";
import MediaPickerSheet from "@/components/studio/MediaPickerSheet";
import SceneInspector from "@/components/studio/SceneInspector";
import SceneRail from "@/components/studio/SceneRail";
import StudioStage, {
    StudioStageHandle,
    TappedText,
} from "@/components/studio/StudioStage";
import StudioTransport from "@/components/studio/StudioTransport";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useStudio } from "@/hooks/use-studio";
import { useStudioMedia } from "@/hooks/use-studio-media";
import { useSceneVideo } from "@/hooks/use-scene-video";
import { useStudioDirector } from "@/hooks/use-studio-director";
import { useStudioGenerate } from "@/hooks/use-studio-generate";
import { useStudioUpload } from "@/hooks/use-studio-upload";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import {
    IStudioLayer,
    NarrationSource,
    TransitionKind,
    effectiveSceneMs,
    isTimedFormat,
} from "@/shared-libs/firestore/trendly-pro/models/studio";
import Colors from "@/shared-uis/constants/Colors";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import { withAlpha } from "@/utils/color";
import { faChevronLeft, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

/** How often the playhead advances while playing. */
const TICK_MS = 100;

export interface StudioScreenProps {
    contentId: string;
}

const StudioScreen: React.FC<StudioScreenProps> = ({ contentId }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors);
    const router = useRouter();
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const studioState = useStudio(brandId, contentId);
    const { studio, scenes, totalMs, starts, loading, error, saving } = studioState;
    const { media, library, loadingLibrary, refreshLibrary } = useStudioMedia(brandId, scenes);
    const upload = useStudioUpload(brandId, contentId);
    // Ambient, in the header: quiet while healthy, visible as soon as it is
    // not. The studio is the most expensive screen in the product, so the
    // number belongs where the work happens rather than on a billing page.
    const { tokens } = useEntitlements();
    // The generation run feeds its responses straight back in: each scene has
    // to appear the instant it lands, and waiting for the subscription would
    // make the rail trail the work it is meant to be showing.
    const generate = useStudioGenerate(
        brandId,
        contentId,
        studio?.id,
        studioState.applyState,
        // One scene at a time, merged — the parallel fill depends on it.
        (state, sceneId) => studioState.applyScenesFrom(state, [sceneId])
    );
    const video = useSceneVideo(brandId, contentId, studio?.id, studioState.applyState);
    // The director plans the whole video: the scene list, the cast, the sound
    // and what has to be generated. Approval materialises it into scenes; the
    // per-scene endpoints then fill them.
    const director = useStudioDirector(
        brandId,
        contentId,
        studio?.id,
        studioState.applyState
    );

    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [positionMs, setPositionMs] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [pickerFor, setPickerFor] = useState<string | null>(null);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [directorOpen, setDirectorOpen] = useState(false);
    const [castOpen, setCastOpen] = useState(false);
    const [castError, setCastError] = useState<string | null>(null);
    /** Set while the media picker is choosing an anchor for a cast member. */
    const [anchorFor, setAnchorFor] = useState<string | null>(null);

    const timed = studio ? isTimedFormat(studio.format) : true;

    /**
     * Scenes left marked "Making…" that nothing is making.
     *
     * A fill only lives as long as the tab that started it: the work is a
     * per-scene request driven from here, so closing the studio halfway leaves
     * the rest pending with nobody coming back for them. Reopening used to
     * show those scenes spinning forever — there was no way to tell a scene
     * being worked on from one abandoned hours ago.
     *
     * ⚠️ OFFERED, NOT AUTOMATIC. Each scene costs money. Approving a plan is
     * an agreement to spend on that run; opening a studio days later is not,
     * so the pick-up is a button rather than something that happens because
     * the screen mounted.
     */
    const stranded = useMemo(
        () => (generate.running ? [] : scenes.filter((sc) => sc.pending && !sc.gen?.model).map((sc) => sc.id)),
        [scenes, generate.running]
    );

    /**
     * Pending scenes the planner chose AI VIDEO for, which this cannot pick up.
     *
     * ⚠️ DELIBERATELY NOT SWEPT INTO THE FILL. `gen.model` set means the plan
     * asked for a generated clip, and the fill asks for a designed document —
     * running it over these would quietly produce a motion graphic where a
     * person approved footage, and charge for it. The scene also needs its
     * cast and location to keep one face across clips, and `ApproveRun` does
     * not yet put those on the scene, so there is nothing here to send even if
     * the endpoint were called. Counted separately and said out loud instead.
     */
    const strandedVideo = useMemo(
        () => (generate.running ? [] : scenes.filter((sc) => sc.pending && !!sc.gen?.model)),
        [scenes, generate.running]
    );

    // ── The playhead ───────────────────────────────────────────────────────
    const tick = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (!playing || !timed) {
            if (tick.current) clearInterval(tick.current);
            tick.current = null;
            return;
        }
        tick.current = setInterval(() => {
            setPositionMs((p) => {
                const next = p + TICK_MS;
                if (next >= totalMs) {
                    // Stop at the end rather than loop. A looping preview makes
                    // it impossible to tell whether the last scene is too short
                    // or the thing simply restarted.
                    setPlaying(false);
                    return totalMs;
                }
                return next;
            });
        }, TICK_MS);
        return () => {
            if (tick.current) clearInterval(tick.current);
            tick.current = null;
        };
    }, [playing, timed, totalMs]);

    /**
     * Which scene the playhead is in, and how far into it.
     *
     * Derived, never stored. One clock means the picture and the sound cannot
     * drift apart, which is the bug this replaces.
     */
    const current = useMemo(() => {
        if (!scenes.length) return { scene: null, index: -1, sceneMs: 0 };
        if (!timed) {
            const index = Math.max(0, Math.min(pagedIndex.current, scenes.length - 1));
            return { scene: scenes[index], index, sceneMs: 0 };
        }
        for (let i = scenes.length - 1; i >= 0; i--) {
            const s = scenes[i];
            const start = starts[s.id] ?? 0;
            if (positionMs >= start) {
                return { scene: s, index: i, sceneMs: positionMs - start };
            }
        }
        return { scene: scenes[0], index: 0, sceneMs: 0 };
    }, [scenes, starts, positionMs, timed]);

    /** For paged formats, the page the user is on. */
    const pagedIndex = useRef(0);

    // Keep the selection on whatever is on screen, unless the user picked
    // something else on the rail. A selection that lags the playhead means the
    // inspector edits a scene nobody is looking at.
    useEffect(() => {
        if (current.scene && !selectedSceneId) setSelectedSceneId(current.scene.id);
    }, [current.scene, selectedSceneId]);

    const selectedScene = useMemo(
        () => scenes.find((s) => s.id === selectedSceneId) ?? current.scene,
        [scenes, selectedSceneId, current.scene]
    );

    const shownScene = timed ? current.scene : selectedScene;

    /** The scene before the selected one, which is what a chain continues. */
    const previousScene = useMemo(() => {
        if (!selectedScene) return null;
        const i = scenes.findIndex((s) => s.id === selectedScene.id);
        return i > 0 ? scenes[i - 1] : null;
    }, [scenes, selectedScene]);

    // ── Edits ──────────────────────────────────────────────────────────────

    const handleSelect = useCallback(
        (sceneId: string) => {
            setSelectedSceneId(sceneId);
            setSelectedLayerId(null);
            const index = scenes.findIndex((s) => s.id === sceneId);
            if (index >= 0) {
                pagedIndex.current = index;
                if (timed) {
                    // Move the playhead to the scene, so picking a card on the
                    // rail shows that scene rather than leaving the canvas
                    // where it was.
                    setPositionMs(starts[sceneId] ?? 0);
                    setPlaying(false);
                }
            }
        },
        [scenes, starts, timed]
    );

    const handlePickMedia = useCallback((asset: IAsset) => {
        // The same picker serves two jobs. An anchor is a CAST decision, not a
        // scene one, so it is handled before the scene path — and only a still
        // may anchor a face, which the backend also refuses.
        if (anchorFor) {
            const castId = anchorFor;
            setAnchorFor(null);
            setPickerFor(null);
            const next = (studio?.cast ?? []).map((m) =>
                m.id === castId ? { ...m, anchorMediaId: asset.id } : m
            );
            void studioState.setCast(next).then(setCastError);
            setCastOpen(true);
            return;
        }
        const sceneId = pickerFor;
        setPickerFor(null);
        if (!sceneId) return;
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return;

        const layer: IStudioLayer = {
            id: `l_${Date.now().toString(36)}`,
            kind: "media",
            // The first layer fills the frame; a second one goes to an inset,
            // which is the only placement that reads as deliberate without
            // being asked where to put it.
            slot: (scene.layers?.length ?? 0) === 0 ? "full" : "pip-br",
            mediaId: asset.id,
            fit: "cover",
        };
        void studioState.setLayers(sceneId, [...(scene.layers ?? []), layer]);
        void refreshLibrary();
    }, [anchorFor, pickerFor, scenes, studio, studioState, refreshLibrary]);

    /**
     * Change one layer of a scene.
     *
     * The WHOLE stack is sent, because the backend moves media reference counts
     * by the difference between the old stack and the new one and needs both to
     * compute it. Sending one layer would make that difference this client's job
     * to describe, which is how a count goes wrong.
     */
    const patchLayer = useCallback(
        (layerId: string, patch: Partial<IStudioLayer>) => {
            if (!selectedScene) return;
            const next = (selectedScene.layers ?? []).map((l) =>
                l.id === layerId ? { ...l, ...patch } : l
            );
            void studioState.setLayers(selectedScene.id, next);
        },
        [selectedScene, studioState]
    );

    // ── Click-to-edit text on a motion scene ────────────────────────────────
    //
    // The frame reports what was tapped; this holds the editor over it and
    // asks the frame to rewrite itself on save. The scene id is captured AT
    // TAP TIME rather than read from `selectedScene` when the save lands,
    // because the playhead can move a selection between the two and the edit
    // belongs to the scene the user was looking at.
    const stageRef = useRef<StudioStageHandle>(null);
    const [textEdit, setTextEdit] = useState<(TappedText & { sceneId: string }) | null>(null);
    const [textDraft, setTextDraft] = useState("");
    // Which layer of which scene is waiting for the frame's rewritten
    // document. Without it, any `html` message would be treated as an edit to
    // persist — including one arriving after the user cancelled.
    const pendingText = useRef<{ sceneId: string; layerId: string } | null>(null);

    const handleTapText = useCallback((tapped: TappedText) => {
        if (!shownScene) return;
        setTextEdit({ ...tapped, sceneId: shownScene.id });
        setTextDraft(tapped.text);
        // Editing while the clip plays under your hands is unusable.
        setPlaying(false);
    }, [shownScene]);

    const commitText = useCallback(() => {
        if (!textEdit) return;
        // Armed only if a frame took the call. Arming first left the handler
        // waiting for an answer nobody was going to send, and the next `html`
        // message for that layer — a save the user made and cancelled out of —
        // would have been written against this scene instead.
        const taken = stageRef.current?.setLayerText(
            textEdit.layerId,
            textEdit.elementId,
            textDraft
        );
        pendingText.current = taken
            ? { sceneId: textEdit.sceneId, layerId: textEdit.layerId }
            : null;
        setTextEdit(null);
    }, [textEdit, textDraft]);

    const handleLayerHtml = useCallback(
        (layerId: string, html: string) => {
            const pending = pendingText.current;
            if (!pending || pending.layerId !== layerId) return;
            pendingText.current = null;

            // Written against the scene the edit started on, found by id — the
            // optimistic copy in `scenes` is the one the rail is drawing, so
            // its layer list is the right base for the patch.
            const scene = scenes.find((s) => s.id === pending.sceneId);
            if (!scene) return;
            const next = (scene.layers ?? []).map((l) =>
                l.id === layerId ? { ...l, html } : l
            );
            void studioState.setLayers(scene.id, next);
        },
        [scenes, studioState]
    );

    const removeLayer = useCallback(
        (layerId: string) => {
            if (!selectedScene) return;
            const next = (selectedScene.layers ?? []).filter((l) => l.id !== layerId);
            setSelectedLayerId(null);
            void studioState.setLayers(selectedScene.id, next);
        },
        [selectedScene, studioState]
    );

    const moveLayer = useCallback(
        (layerId: string, delta: number) => {
            if (!selectedScene) return;
            const layers = [...(selectedScene.layers ?? [])];
            const from = layers.findIndex((l) => l.id === layerId);
            if (from < 0) return;
            const to = Math.max(0, Math.min(from + delta, layers.length - 1));
            if (to === from) return;
            const [moved] = layers.splice(from, 1);
            layers.splice(to, 0, moved);
            void studioState.setLayers(selectedScene.id, layers);
        },
        [selectedScene, studioState]
    );

    /** Upload something and put it straight into the scene that asked. */
    const handleUpload = useCallback(async () => {
        const sceneId = pickerFor;
        if (!sceneId) return;
        const out = await upload.pickAndUpload("all");
        if (!out?.mediaId) return;
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return;
        const layer: IStudioLayer = {
            id: `l_${Date.now().toString(36)}`,
            kind: "media",
            slot: (scene.layers?.length ?? 0) === 0 ? "full" : "pip-br",
            mediaId: out.mediaId,
            fit: "cover",
        };
        setPickerFor(null);
        void studioState.setLayers(sceneId, [...(scene.layers ?? []), layer]);
        void refreshLibrary();
    }, [pickerFor, upload, scenes, studioState, refreshLibrary]);

    /**
     * A generated voiceover landed: point the scene's narration at it.
     *
     * The duration is NOT written onto the scene. Whether the scene stretches
     * to fit is `fitToNarration`, which the user already chose — overwriting
     * their length with the audio's would silently override a deliberate
     * decision every time they regenerate.
     */
    const handleVoiceoverReady = useCallback(
        (mediaId: string) => {
            if (!selectedScene?.narration) return;
            void studioState.setNarration(selectedScene.id, {
                ...selectedScene.narration,
                mediaId,
            });
            void refreshLibrary();
        },
        [selectedScene, studioState, refreshLibrary]
    );

    const handleSplit = useCallback(
        (sceneId: string) => {
            const scene = scenes.find((s) => s.id === sceneId);
            if (!scene) return;
            // Half way, which is what "split" means when nobody has dragged a
            // playhead to a specific frame.
            void studioState.splitScene(sceneId, Math.round(effectiveSceneMs(scene) / 2));
        },
        [scenes, studioState]
    );

    if (!brandId) {
        return (
            <View style={styles.center}>
                <Text style={styles.message}>Pick a brand first.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (!studio) {
        return (
            <View style={styles.center}>
                <Text style={styles.message}>{error ?? "We couldn't open the studio."}</Text>
            </View>
        );
    }

    const stageWidth = xl ? 420 : 320;

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
                    <FontAwesomeIcon icon={faChevronLeft} size={14} color={colors.text} />
                </Pressable>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Design studio</Text>
                    <Text style={styles.headerMeta}>
                        {studio.format} · {scenes.length}{" "}
                        {scenes.length === 1 ? "scene" : "scenes"}
                        {timed ? ` · ${(totalMs / 1000).toFixed(1)}s` : ""}
                        {saving ? " · saving…" : ""}
                    </Text>
                </View>
                <TokenMeterBar tokens={tokens} />
                {!xl ? (
                    <Pressable style={styles.back} onPress={() => setInspectorOpen(true)} hitSlop={8}>
                        <FontAwesomeIcon icon={faSliders} size={14} color={colors.text} />
                    </Pressable>
                ) : null}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {upload.error ? <Text style={styles.error}>{upload.error}</Text> : null}

            <View style={xl ? styles.bodyWide : styles.body}>
                <View style={styles.stageColumn}>
                    <View style={styles.stageCenter}>
                        <StudioStage
                            ref={stageRef}
                            scene={shownScene}
                            canvasWidth={studio.width}
                            canvasHeight={studio.height}
                            displayWidth={stageWidth}
                            media={media}
                            playing={playing}
                            positionMs={current.sceneMs}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={setSelectedLayerId}
                            onFillEmpty={() =>
                                shownScene ? setPickerFor(shownScene.id) : undefined
                            }
                            onTapText={handleTapText}
                            onLayerHtml={handleLayerHtml}
                        />
                    </View>

                    <StudioTransport
                        studio={studio}
                        scenes={scenes}
                        positionMs={positionMs}
                        totalMs={totalMs}
                        playing={playing}
                        sceneIndex={current.index < 0 ? 0 : current.index}
                        onPlayPause={() => setPlaying((p) => !p)}
                        onSeek={(ms) => {
                            setPositionMs(Math.max(0, Math.min(ms, totalMs)));
                            setPlaying(false);
                        }}
                        onStep={(delta) => {
                            const next = Math.max(
                                0,
                                Math.min((current.index < 0 ? 0 : current.index) + delta, scenes.length - 1)
                            );
                            pagedIndex.current = next;
                            const id = scenes[next]?.id;
                            if (id) handleSelect(id);
                        }}
                    />
                </View>

                {xl ? (
                    <View style={styles.inspectorPanel}>
                        <SceneInspector
                            brandId={brandId}
                            studio={studio}
                            scene={selectedScene}
                            media={media}
                            busy={saving}
                            totalMs={totalMs}
                            onSetDuration={(ms) =>
                                selectedScene && studioState.setDuration(selectedScene.id, ms)
                            }
                            onSetTransition={(kind: TransitionKind, durationMs: number) =>
                                selectedScene &&
                                studioState.setTransition(selectedScene.id, { kind, durationMs })
                            }
                            onSetNarration={(line, source: NarrationSource, fit) =>
                                selectedScene &&
                                studioState.setNarration(selectedScene.id, {
                                    line,
                                    source,
                                    fitToNarration: fit,
                                })
                            }
                            onDuplicate={() =>
                                selectedScene && studioState.duplicateScene(selectedScene.id)
                            }
                            onVoiceoverReady={handleVoiceoverReady}
                            onRegenerate={(brief) =>
                                selectedScene &&
                                void generate.regenerate(selectedScene.id, { brief })
                            }
                            regenerating={generate.running}
                            previousScene={previousScene}
                            video={video}
                            onOpenCast={() => setCastOpen(true)}
                            onPatchStudio={(input) => void studioState.patchStudio(input)}
                            onPickMedia={() => selectedScene && setPickerFor(selectedScene.id)}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={setSelectedLayerId}
                            onChangeLayer={patchLayer}
                            onRemoveLayer={removeLayer}
                            onMoveLayer={moveLayer}
                        />
                    </View>
                ) : null}
            </View>

            {stranded.length + strandedVideo.length > 0 ? (
                <View style={styles.strandedBar}>
                    <View style={styles.strandedStripe} />
                    <View style={styles.strandedBody}>
                        <Text style={styles.strandedTitle}>
                            {stranded.length + strandedVideo.length === 1
                                ? "1 scene was never made"
                                : `${stranded.length + strandedVideo.length} scenes were never made`}
                        </Text>
                        <Text style={styles.strandedNote}>
                            {strandedVideo.length === 0
                                ? "They were planned and approved, but the run stopped before they were designed. Picking up costs the same as making them the first time."
                                : stranded.length === 0
                                  ? "They were planned and approved, but the run stopped. These ones are AI video — open each scene and generate its clip from the video panel."
                                  : `They were planned and approved, but the run stopped. ${stranded.length} can be picked up here; the other ${strandedVideo.length} are AI video and need their clips generated from each scene's video panel.`}
                        </Text>
                    </View>
                    {stranded.length > 0 ? (
                        <Pressable
                            style={styles.strandedAction}
                            onPress={() => void generate.fill(stranded)}
                        >
                            <Text style={styles.strandedActionText}>Pick up</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            <SceneRail
                studio={studio}
                scenes={scenes}
                media={media}
                selectedSceneId={selectedSceneId}
                busy={saving}
                onSelect={handleSelect}
                onAdd={() => void studioState.addScene()}
                onInsertAt={(index) => void studioState.insertSceneAt(index)}
                onDelete={(id) => void studioState.deleteScene(id)}
                onDuplicate={(id) => void studioState.duplicateScene(id)}
                onSplit={handleSplit}
                onMove={(id, to) => void studioState.moveScene(id, to)}
                onAskAI={() => setDirectorOpen(true)}
            />

            <DirectorSheet
                visible={directorOpen}
                director={director}
                onClose={() => setDirectorOpen(false)}
                onApproved={(pendingScenes) => {
                    // The scenes exist and are pending. Closing takes the user
                    // straight to the rail, which is where the filling happens.
                    setDirectorOpen(false);
                    director.reset();
                    // ⚠️ AND THEN SOMEBODY HAS TO MAKE THEM. `ApproveRun`
                    // writes the scenes and marks them pending; its own header
                    // says the per-scene endpoints fill them, driven by the
                    // client. This IS that client. Without this line approval
                    // produced a rail of scenes that said "Making…" and stayed
                    // that way — approved, planned, paid for at the planning
                    // step, and never made.
                    //
                    // No confirmation: approving a plan that priced itself IS
                    // the agreement to spend.
                    // Only the scenes this can actually make, read off the
                    // approve response rather than off `scenes` — that state
                    // has not re-rendered yet, so it does not know these
                    // scenes exist. A plan that asked for AI video leaves
                    // those to the video panel; see `strandedVideo` for why
                    // running the fill over them would be worse than leaving
                    // them pending.
                    void generate.fill(
                        pendingScenes.filter((sc) => !sc.gen?.model).map((sc) => sc.id)
                    );
                }}
                onUseSimpleFlow={() => {
                    setDirectorOpen(false);
                    setGenerateOpen(true);
                }}
            />

            <GenerateSheet
                visible={generateOpen}
                timed={timed}
                running={generate.running}
                progress={generate.progress}
                error={generate.error}
                blocked={generate.blocked}
                onClose={() => setGenerateOpen(false)}
                onGenerate={(input) => void generate.generate(input)}
                onCancel={generate.cancel}
            />

            <CastSheet
                visible={castOpen}
                cast={studio.cast ?? []}
                locations={studio.locations ?? []}
                media={media}
                busy={saving}
                error={castError}
                onClose={() => {
                    setCastOpen(false);
                    setCastError(null);
                }}
                onSaveCast={(next) => void studioState.setCast(next).then(setCastError)}
                onPickAnchor={(castId) => {
                    // Reuse the media picker, restricted to stills by the
                    // backend's own refusal — a clip has no single frame to be
                    // the reference.
                    setCastOpen(false);
                    setAnchorFor(castId);
                    setPickerFor("anchor");
                }}
            />

            <MediaPickerSheet
                visible={!!pickerFor}
                library={library}
                loading={loadingLibrary}
                kind={anchorFor ? "image" : undefined}
                onClose={() => {
                    setPickerFor(null);
                    if (anchorFor) {
                        setAnchorFor(null);
                        setCastOpen(true);
                    }
                }}
                onPick={handlePickMedia}
                onUpload={handleUpload}
                uploading={upload.uploading}
            />

            {!xl ? (
                <Modal
                    visible={inspectorOpen}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setInspectorOpen(false)}
                >
                    <View style={styles.sheetBackdrop}>
                        <View style={styles.sheet}>
                            <Pressable
                                style={styles.sheetHandle}
                                onPress={() => setInspectorOpen(false)}
                            />
                            <SceneInspector
                                brandId={brandId}
                                studio={studio}
                                scene={selectedScene}
                                media={media}
                                busy={saving}
                                totalMs={totalMs}
                                onSetDuration={(ms) =>
                                    selectedScene && studioState.setDuration(selectedScene.id, ms)
                                }
                                onSetTransition={(kind: TransitionKind, durationMs: number) =>
                                    selectedScene &&
                                    studioState.setTransition(selectedScene.id, { kind, durationMs })
                                }
                                onSetNarration={(line, source: NarrationSource, fit) =>
                                    selectedScene &&
                                    studioState.setNarration(selectedScene.id, {
                                        line,
                                        source,
                                        fitToNarration: fit,
                                    })
                                }
                                onDuplicate={() =>
                                    selectedScene && studioState.duplicateScene(selectedScene.id)
                                }
                                onVoiceoverReady={handleVoiceoverReady}
                                onRegenerate={(brief) =>
                                    selectedScene &&
                                    void generate.regenerate(selectedScene.id, { brief })
                                }
                                regenerating={generate.running}
                                previousScene={previousScene}
                                video={video}
                                onOpenCast={() => {
                                    setInspectorOpen(false);
                                    setCastOpen(true);
                                }}
                                onPatchStudio={(input) => void studioState.patchStudio(input)}
                                onPickMedia={() => {
                                    setInspectorOpen(false);
                                    if (selectedScene) setPickerFor(selectedScene.id);
                                }}
                                selectedLayerId={selectedLayerId}
                                onSelectLayer={setSelectedLayerId}
                                onChangeLayer={patchLayer}
                                onRemoveLayer={removeLayer}
                                onMoveLayer={moveLayer}
                            />
                        </View>
                    </View>
                </Modal>
            ) : null}

            {/* The text editor. Deliberately a sheet rather than editing in
                place inside the frame: the frame is a scaled preview, so typing
                into it would put the caret and the keyboard at the wrong size
                on a phone, and on native it is a WebView the keyboard cannot
                reliably reach. */}
            <Modal
                visible={!!textEdit}
                animationType="fade"
                transparent
                onRequestClose={() => setTextEdit(null)}
            >
                <Pressable style={styles.sheetBackdrop} onPress={() => setTextEdit(null)}>
                    <Pressable style={styles.textSheet} onPress={() => undefined}>
                        <Text style={styles.textSheetTitle}>Edit text</Text>
                        <TextInput
                            style={styles.textSheetInput}
                            value={textDraft}
                            onChangeText={setTextDraft}
                            multiline
                            autoFocus
                            placeholder="The words on screen"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.textSheetRow}>
                            <Pressable
                                style={styles.textSheetGhost}
                                onPress={() => setTextEdit(null)}
                            >
                                <Text style={styles.textSheetGhostLabel}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.textSheetSave} onPress={commitText}>
                                <Text style={styles.textSheetSaveLabel}>Save</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    useMemo(
        () =>
            StyleSheet.create({
                root: { flex: 1, backgroundColor: colors.background },

                // The pick-up strip for a run nothing is finishing. Sits on
                // the surface with a shadow and an accent stripe rather than a
                // border, same as the other callouts in the app.
                strandedBar: {
                    flexDirection: "row",
                    alignItems: "center",
                    overflow: "hidden",
                    borderRadius: 10,
                    marginHorizontal: 12,
                    marginBottom: 8,
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                },
                strandedStripe: { width: 4, alignSelf: "stretch", backgroundColor: colors.primary },
                strandedBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 2 },
                strandedTitle: {
                    color: colors.text,
                    fontSize: fs(13),
                    lineHeight: lh(18),
                    fontWeight: "600",
                },
                strandedNote: { color: colors.textSecondary, fontSize: fs(12), lineHeight: lh(17) },
                strandedAction: {
                    marginRight: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                strandedActionText: {
                    color: colors.onPrimary,
                    fontSize: fs(13),
                    lineHeight: lh(18),
                    fontWeight: "600",
                },
                center: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.background,
                },
                message: { color: colors.textSecondary, fontSize: fs(13), lineHeight: lh(19) },
                error: {
                    marginHorizontal: 16,
                    marginBottom: 6,
                    color: colors.red,
                    fontSize: fs(12),
                    lineHeight: lh(17),
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.background,
                    // A downward shadow, so the header reads as a sticky bar
                    // over the canvas instead of a bordered strip.
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.07,
                    elevation: 3,
                    zIndex: 2,
                },
                back: {
                    width: fbox(32),
                    height: fbox(32),
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                headerText: { flex: 1 },
                headerTitle: {
                    color: colors.text,
                    fontSize: fs(15),
                    lineHeight: lh(21),
                    fontWeight: "700",
                },
                headerMeta: { color: colors.textSecondary, fontSize: fs(11), lineHeight: lh(15) },
                body: { flex: 1 },
                bodyWide: { flex: 1, flexDirection: "row" },
                stageColumn: { flex: 1 },
                stageCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
                inspectorPanel: {
                    width: 320,
                    backgroundColor: colors.background,
                    // The panel is the elevated surface, so it casts leftward
                    // over the canvas.
                    shadowColor: "#000",
                    shadowOffset: { width: -6, height: 0 },
                    shadowRadius: 16,
                    shadowOpacity: 0.07,
                    elevation: 8,
                },
                sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
                textSheet: {
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    padding: 18,
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 18,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                textSheetTitle: {
                    color: colors.text,
                    fontSize: fs(15),
                    lineHeight: lh(21),
                    fontWeight: "600",
                },
                textSheetInput: {
                    minHeight: fbox(96),
                    color: colors.text,
                    fontSize: fs(14),
                    lineHeight: lh(20),
                    // Background contrast rather than a border, which is how
                    // every other input in this app signals it is editable.
                    backgroundColor: colors.tag,
                    borderRadius: 12,
                    padding: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                textSheetRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
                textSheetGhost: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
                textSheetGhostLabel: {
                    color: colors.textSecondary,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    fontWeight: "600",
                },
                textSheetSave: {
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                textSheetSaveLabel: {
                    color: colors.onPrimary,
                    fontSize: fs(13),
                    lineHeight: lh(19),
                    fontWeight: "700",
                },
                sheet: {
                    maxHeight: "80%",
                    backgroundColor: colors.background,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    paddingTop: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowRadius: 18,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                sheetHandle: {
                    alignSelf: "center",
                    width: 44,
                    height: 4,
                    borderRadius: 2,
                    marginBottom: 6,
                    backgroundColor: withAlpha(colors.text, 0.2),
                },
            }),
        [colors]
    );

export default StudioScreen;
