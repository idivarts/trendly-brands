/**
 * The timeline: a ruler, a playhead, and one row per track.
 *
 * Modelled on the Hyperframes editor's own timeline, because that is the
 * surface this studio renders through and matching it means a user who has
 * seen one recognises the other.
 *
 * ── What it draws, and why that changed ───────────────────────────────────
 * Rows come from the design's CLIPS, not its scenes. The scenes were all the
 * backend used to report, so a reel with music, a voiceover and a photograph
 * drew one row and three invisible things — which is how a timeline comes to
 * be described, accurately, as useless. A clip carries the row the film puts
 * it on, so there is a row for the scenes, a row for the pictures, a row for
 * the voice and a row for the music, each named after what is on it.
 *
 * ── What a gesture does ───────────────────────────────────────────────────
 * Tap a clip to seek to it and select it. Drag its middle to move it, drag
 * either edge to trim that edge. Tap an empty part of a row to put
 * something there — a file the film already holds, or a description the
 * next preview fetches.
 *
 * SCENES are dragged in the scene panel, not here: scenes play one after
 * another, so moving one relays the film around it, and a timeline that
 * let you drag a scene a little to the right would be offering an edit the
 * film cannot make. The scene row is therefore tap-to-select only, and the
 * arithmetic for everything else lives in timeline-drag.ts where it is
 * tested.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { withAlpha } from "@/utils/color";
import React, { useCallback, useMemo, useRef } from "react";
import {
    LayoutChangeEvent,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    clipGeometry,
    formatClock,
    rulerTicks,
    timelineTracks,
    type ClipKind,
    type DesignClip,
    type DesignScene,
} from "./studio-layout";
import {
    dragChanged,
    dragModeFor,
    dragWindow,
    momentAt,
    type DragMode,
    type Window as ClipWindow,
} from "./timeline-drag";

export interface StudioTimelineProps {
    /** Every timed thing in the film, each on its row. */
    clips: DesignClip[] | undefined;
    /** The scenes, for a film authored before clips were reported. */
    scenes: DesignScene[] | undefined;
    totalMs: number;
    positionMs: number;
    /** Scene currently selected in the layer tree, highlighted here too. */
    selectedSceneId?: string | null;
    /** A non-scene clip picked on the timeline itself. */
    selectedClipId?: string | null;
    onSeek: (ms: number) => void;
    onSelectScene: (sceneId: string) => void;
    /**
     * A clip was clicked. The screen decides what that means — a scene
     * selects a scene, a voiceover seeks and highlights — because the
     * timeline does not own the selection.
     */
    onSelectClip?: (clip: DesignClip) => void;

    /** A clip was dragged or trimmed to a new window. */
    onRetimeClip?: (clip: DesignClip, window: ClipWindow) => void;
    /** The selected clip's ✕ was pressed. */
    onDeleteClip?: (clip: DesignClip) => void;
    /** An empty part of a row was tapped, at this moment on this row. */
    onAddAt?: (track: { index: number; label: string; kind: string }, atMs: number) => void;
    /** True while an edit is in flight; gestures are refused rather than
     *  queued, because two drags racing produce two revisions of which one
     *  is built on a document the other already replaced. */
    busy?: boolean;
}

const TRACK_LABEL_WIDTH = 108;
const TRACK_HEIGHT = 52;

/**
 * How much of the lane's own colour a kind of clip takes.
 *
 * Rows are told apart by colour as well as by name, because a glance at a
 * timeline is how you find the music — reading four labels is not a glance.
 * Alpha over the theme's own tokens rather than new colours, so this works
 * in both themes without adding anything to the palette.
 */
const CLIP_TINT: Record<ClipKind, { token: ClipTintToken; alpha: number }> = {
    scene: { token: "primary", alpha: 0.35 },
    video: { token: "primary", alpha: 0.22 },
    image: { token: "primary", alpha: 0.22 },
    voice: { token: "green", alpha: 0.35 },
    music: { token: "yellow", alpha: 0.35 },
    sound: { token: "yellow", alpha: 0.22 },
    captions: { token: "pink", alpha: 0.2 },
};

/**
 * ⚠️ Only tokens that are `rgb()` strings belong here.
 *
 * `withAlpha` returns anything it cannot parse unchanged, and `colors.red`
 * is the literal string "red" — so a red clip would come out fully opaque
 * while every other row is a tint. `pink` carries the captions instead.
 */
type ClipTintToken = "primary" | "green" | "yellow" | "pink";

const StudioTimeline: React.FC<StudioTimelineProps> = ({
    clips,
    scenes,
    totalMs,
    positionMs,
    selectedSceneId,
    selectedClipId,
    onSeek,
    onSelectScene,
    onSelectClip,
    onRetimeClip,
    onDeleteClip,
    onAddAt,
    busy,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const tracks = useMemo(() => timelineTracks(clips, scenes), [clips, scenes]);
    const ticks = useMemo(() => rulerTicks(totalMs), [totalMs]);

    // Measured rather than assumed: the lane is whatever is left after the
    // labels, and a seek computed against a guessed width lands in the wrong
    // place on every viewport but one.
    const [laneWidth, setLaneWidth] = React.useState(0);
    const onLaneLayout = useCallback((e: LayoutChangeEvent) => {
        setLaneWidth(e.nativeEvent.layout.width);
    }, []);

    const seekFromX = useCallback(
        (x: number) => {
            if (laneWidth <= 0 || totalMs <= 0) return;
            const fraction = Math.min(Math.max(x / laneWidth, 0), 1);
            onSeek(Math.round(fraction * totalMs));
        },
        [laneWidth, totalMs, onSeek]
    );

    // ── The drag in flight ───────────────────────────────────────────────
    // Held in state so the clip is drawn where the finger is rather than
    // where the document still says it is: a drag that only showed its
    // result after the round trip feels like a dropped gesture, and the
    // user lets go again.
    const [drag, setDrag] = React.useState<{
        clipId: string;
        mode: DragMode;
        window: ClipWindow;
    } | null>(null);
    // Read inside the responder callbacks, which are created once per clip
    // and would otherwise close over the first render's values.
    const live = useRef({ laneWidth: 0, totalMs: 0, busy: false });
    live.current = { laneWidth, totalMs, busy: !!busy };

    const responderFor = useCallback(
        (clip: DesignClip, widthPx: number) => {
            const from: ClipWindow = { startMs: clip.startMs, durationMs: clip.durationMs };
            let mode: DragMode = "move";
            return PanResponder.create({
                // A tap must stay a tap: the responder is claimed only once
                // the finger has actually travelled, so onPress still fires
                // for a press that never moved.
                onStartShouldSetPanResponder: () => false,
                onMoveShouldSetPanResponder: (_e, g) =>
                    !live.current.busy && Math.abs(g.dx) > 3 && Math.abs(g.dx) > Math.abs(g.dy),
                onPanResponderGrant: (e) => {
                    mode = dragModeFor(e.nativeEvent.locationX, widthPx);
                    setDrag({ clipId: clip.elementId, mode, window: from });
                },
                onPanResponderMove: (_e, g) => {
                    setDrag({
                        clipId: clip.elementId,
                        mode,
                        window: dragWindow(from, mode, g.dx, live.current.laneWidth, live.current.totalMs),
                    });
                },
                onPanResponderRelease: (_e, g) => {
                    const to = dragWindow(from, mode, g.dx, live.current.laneWidth, live.current.totalMs);
                    setDrag(null);
                    // A tap registers as a drag of a pixel or two, and every
                    // drag writes a revision into a ten-deep history.
                    if (dragChanged(from, to)) onRetimeClip?.(clip, to);
                },
                onPanResponderTerminate: () => setDrag(null),
            });
        },
        [onRetimeClip]
    );

    const pct = (n: number): `${number}%` => `${Math.min(Math.max(n, 0), 1) * 100}%`;
    const playheadLeft = pct(totalMs > 0 ? positionMs / totalMs : 0);

    if (tracks.length === 0) {
        return (
            <View style={styles.root}>
                <Text style={styles.empty}>
                    No timeline yet — write the design and its scenes, music and
                    voiceovers appear here, each on its own row.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <View style={styles.rulerRow}>
                <View style={styles.rulerSpacer} />
                <Pressable
                    style={styles.ruler}
                    onLayout={onLaneLayout}
                    onPress={(e) => seekFromX(e.nativeEvent.locationX)}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Seek"
                >
                    {ticks.map((t) => (
                        <View
                            key={t}
                            style={[
                                styles.tick,
                                { left: pct(totalMs > 0 ? t / totalMs : 0) },
                            ]}
                        >
                            <View style={styles.tickMark} />
                            <Text style={styles.tickLabel}>{formatClock(t)}</Text>
                        </View>
                    ))}
                </Pressable>
            </View>

            <View style={styles.tracks}>
                {tracks.map((track) => (
                    <View key={track.index} style={styles.trackRow}>
                        <View style={styles.trackLabelCell}>
                            <Text style={styles.trackLabel} numberOfLines={1}>
                                {track.label}
                            </Text>
                            <Text style={styles.trackCount}>{track.clips.length}</Text>
                        </View>
                        <View style={styles.lane}>
                            {/* Behind the clips: a tap on bare lane is "put
                                something here". Drawn first so a clip always
                                wins the same tap. */}
                            {onAddAt && (
                                <Pressable
                                    style={styles.laneBase}
                                    disabled={busy}
                                    onPress={(e) =>
                                        onAddAt(
                                            { index: track.index, label: track.label, kind: track.kind },
                                            momentAt(e.nativeEvent.locationX, laneWidth, totalMs)
                                        )
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={`Add something to ${track.label}`}
                                />
                            )}
                            {track.clips.map((clip) => {
                                const dragging = drag?.clipId === clip.elementId;
                                const shown = dragging ? { ...clip, ...drag!.window } : clip;
                                const { left, width } = clipGeometry(shown, totalMs);
                                const selected =
                                    clip.elementId === selectedClipId ||
                                    (clip.kind === "scene" && clip.elementId === selectedSceneId);
                                const label = clip.label || clip.elementId;
                                const widthPx = Math.max(MIN_CLIP_WIDTH, width * laneWidth);
                                // A scene relays the film around it, so it is
                                // moved in the scene panel and not by dragging
                                // — see the note at the top of this file.
                                const draggable = !!onRetimeClip && clip.kind !== "scene";
                                return (
                                    <ClipBar
                                        key={clip.elementId}
                                        clip={clip}
                                        label={label}
                                        rowLabel={track.label}
                                        left={pct(left)}
                                        width={pct(width)}
                                        tint={tintOf(colors, clip.kind)}
                                        selected={selected}
                                        dragging={dragging}
                                        styles={styles}
                                        responder={draggable ? responderFor(clip, widthPx) : null}
                                        onPress={() => {
                                            if (clip.kind === "scene") onSelectScene(clip.elementId);
                                            onSelectClip?.(clip);
                                        }}
                                        onDelete={
                                            selected && onDeleteClip && clip.kind !== "scene"
                                                ? () => onDeleteClip(clip)
                                                : null
                                        }
                                    />
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Drawn over the rows, offset by the label column so it lines
                    up with the lanes rather than the whole timeline. */}
                <View style={styles.playheadLayer} pointerEvents="none">
                    <View style={styles.playheadSpacer} />
                    <View style={styles.playheadLane}>
                        <View style={[styles.playhead, { left: playheadLeft }]} />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default StudioTimeline;

/**
 * One bar on a row.
 *
 * ── Why this is its own component ─────────────────────────────────────────
 * A PanResponder must be created once per clip and kept, and creating one
 * inside a `.map()` in the parent's body makes a new set of handlers on
 * every render — including every render the drag itself causes, so the
 * gesture is handed to a responder that has just been replaced and the
 * drag dies halfway. Holding it in a child, keyed by the clip's id, is
 * what makes a drag survive its own state updates.
 */
const ClipBar: React.FC<{
    clip: DesignClip;
    label: string;
    rowLabel: string;
    left: `${number}%`;
    width: `${number}%`;
    tint: string;
    selected: boolean;
    dragging: boolean;
    styles: ReturnType<typeof useStyles>;
    responder: ReturnType<typeof PanResponder.create> | null;
    onPress: () => void;
    onDelete: (() => void) | null;
}> = ({
    clip,
    label,
    rowLabel,
    left,
    width,
    tint,
    selected,
    dragging,
    styles,
    responder,
    onPress,
    onDelete,
}) => {
    // Created once and kept for this clip's lifetime, for the reason above.
    const held = useRef(responder);
    if (responder && !held.current) held.current = responder;
    const handlers = held.current?.panHandlers ?? {};

    return (
        <View
            {...handlers}
            style={[
                styles.clip,
                { left, width, backgroundColor: tint, minWidth: MIN_CLIP_WIDTH },
                selected && styles.clipSelected,
                dragging && styles.clipDragging,
            ]}
        >
            <Pressable
                onPress={onPress}
                style={styles.clipHit}
                accessibilityRole="button"
                accessibilityLabel={`${label}, ${rowLabel}, ${(clip.durationMs / 1000).toFixed(1)} seconds`}
            >
                <Text
                    style={[styles.clipLabel, !selected && styles.clipLabelUnselected]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            </Pressable>
            {/* The handles are shown on the selected clip only. Four grab
                zones on every clip of a six-row timeline is a timeline you
                cannot tap, and the zones work whether or not they are
                drawn — this is a hint, not the mechanism. */}
            {selected && responder && (
                <>
                    <View style={[styles.handle, styles.handleLeft]} pointerEvents="none" />
                    <View style={[styles.handle, styles.handleRight]} pointerEvents="none" />
                </>
            )}
            {onDelete && (
                <Pressable
                    onPress={onDelete}
                    style={styles.remove}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${label}`}
                    hitSlop={6}
                >
                    <Text style={styles.removeLabel}>✕</Text>
                </Pressable>
            )}
        </View>
    );
};

/** The clip's colour, from the theme rather than from a new palette. */
function tintOf(colors: ReturnType<typeof Colors>, kind: string): string {
    const tint = CLIP_TINT[kind as ClipKind] ?? CLIP_TINT.scene;
    return withAlpha(colors[tint.token], tint.alpha);
}

/** Narrow enough to see, wide enough to hit. */
const MIN_CLIP_WIDTH = 26;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                root: {
                    backgroundColor: colors.card,
                    paddingVertical: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.08,
                    elevation: 6,
                },
                empty: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.textSecondary,
                    textAlign: "center",
                    paddingVertical: 18,
                },
                rulerRow: { flexDirection: "row", alignItems: "flex-end", paddingRight: 12 },
                rulerSpacer: { width: TRACK_LABEL_WIDTH },
                ruler: { flex: 1, height: 22, justifyContent: "flex-end" },
                tick: { position: "absolute", bottom: 0, alignItems: "flex-start" },
                tickMark: { width: 1, height: 6, backgroundColor: withAlpha(colors.text, 0.25) },
                tickLabel: {
                    fontSize: fs(9),
                    lineHeight: lh(13),
                    color: colors.textSecondary,
                    marginTop: 1,
                },
                tracks: { position: "relative", marginTop: 4 },
                trackRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    height: TRACK_HEIGHT,
                    paddingRight: 12,
                },
                trackLabelCell: {
                    width: TRACK_LABEL_WIDTH,
                    paddingLeft: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                trackLabel: {
                    flex: 1,
                    fontSize: fs(11),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.text,
                },
                trackCount: { fontSize: fs(10), lineHeight: lh(14), color: colors.textSecondary },
                lane: {
                    flex: 1,
                    height: TRACK_HEIGHT - 14,
                    borderRadius: 8,
                    backgroundColor: withAlpha(colors.text, 0.05),
                    overflow: "hidden",
                },
                clip: {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                    overflow: "visible",
                    backgroundColor: withAlpha(colors.primary, 0.35),
                },
                clipSelected: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 8,
                    shadowOpacity: 0.45,
                    elevation: 3,
                },
                clipLabel: {
                    fontSize: fs(10),
                    lineHeight: lh(14),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                // A 20-35% tint of the theme's own colour is close to the
                // card behind it, so onPrimary (white on light) disappears
                // on an unselected clip. Only the SELECTED clip is a solid
                // fill, so only it gets the reversed-out label.
                clipLabelUnselected: { color: colors.text },
                clipHit: { flex: 1, justifyContent: "center" },
                clipDragging: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 10,
                    shadowOpacity: 0.25,
                    elevation: 8,
                    opacity: 0.92,
                },
                laneBase: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
                handle: {
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: withAlpha(colors.onPrimary, 0.8),
                },
                handleLeft: { left: 3 },
                handleRight: { right: 3 },
                remove: {
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.card,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 4,
                    shadowOpacity: 0.2,
                    elevation: 4,
                },
                removeLabel: {
                    fontSize: fs(9),
                    lineHeight: lh(13),
                    fontWeight: "700",
                    color: colors.text,
                },
                playheadLayer: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 12,
                    bottom: 0,
                    flexDirection: "row",
                },
                playheadSpacer: { width: TRACK_LABEL_WIDTH },
                playheadLane: { flex: 1 },
                playhead: {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: 2,
                    marginLeft: -1,
                    backgroundColor: colors.green,
                },
            }),
        [colors]
    );
}
