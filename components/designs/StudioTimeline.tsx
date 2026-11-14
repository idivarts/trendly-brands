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
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import {
    clipGeometry,
    formatClock,
    rulerTicks,
    ticksForWidth,
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
    pressFraction,
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
    // ── Measuring the lane ───────────────────────────────────────────────
    // The lane is whatever is left after the labels, so its width is
    // measured rather than guessed — a seek computed against a guessed
    // width lands in the wrong place on every viewport but one.
    //
    // Its LEFT EDGE is measured too, in window coordinates, because a press
    // can only be located against it: see pressFraction for the NaN that
    // cost an afternoon.
    const [laneWidth, setLaneWidth] = React.useState(0);
    const laneRef = useRef<View | null>(null);
    const laneLeft = useRef(0);
    const measureLane = useCallback(() => {
        laneRef.current?.measureInWindow((x, _y, w) => {
            laneLeft.current = x;
            if (w > 0) setLaneWidth(w);
        });
    }, []);
    const onLaneLayout = useCallback(
        (e: LayoutChangeEvent) => {
            setLaneWidth(e.nativeEvent.layout.width);
            measureLane();
        },
        [measureLane]
    );

    // Spaced by how much room there actually is: see ticksForWidth.
    const ticks = useMemo(
        () => rulerTicks(totalMs, ticksForWidth(laneWidth)),
        [totalMs, laneWidth]
    );

    // Located against the lane's measured box, and measured again on the
    // way in: the page can scroll between a layout and a press, and a
    // stale left edge is a seek a few seconds out — the kind of wrong
    // nobody reports because it looks like their own aim.
    const seekFromPage = useCallback(
        (pageX: number | undefined) => {
            if (totalMs <= 0) return;
            measureLane();
            const f = pressFraction(pageX, laneLeft.current, laneWidth);
            if (f === null) return;
            onSeek(Math.round(f * totalMs));
        },
        [laneWidth, totalMs, onSeek, measureLane]
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
                    ref={laneRef}
                    style={styles.ruler}
                    onLayout={onLaneLayout}
                    onPress={(e) => seekFromPage(e.nativeEvent.pageX)}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Seek"
                >
                    {ticks.map((t) => (
                        <View
                            key={t}
                            // ⚠️ Decoration, and it must not take the click.
                            //
                            // A tick is a child of the ruler, so a press that
                            // lands on one reports locationX relative to a
                            // mark ONE PIXEL wide — which is a fraction of
                            // about zero, which is a seek to the start of the
                            // film. Clicking "0:06" on the ruler jumped to
                            // 0:00, and clicking anywhere between two ticks
                            // worked, so it read as the timeline ignoring
                            // half the clicks at random.
                            pointerEvents="none"
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
                            {/* ── Why a button and not only a tap on the lane ──
                                A row whose clips cover it end to end — which
                                the scene row always is — has no bare lane left
                                to tap, so "add something here" would be
                                unreachable on exactly the film a person starts
                                from. This adds at the playhead, which is where
                                they are looking. */}
                            {onAddAt ? (
                                <Pressable
                                    onPress={() =>
                                        onAddAt(
                                            { index: track.index, label: track.label, kind: track.kind },
                                            positionMs
                                        )
                                    }
                                    disabled={busy}
                                    style={[styles.addRow, busy && styles.addRowOff]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Add to ${track.label} at the playhead`}
                                    hitSlop={6}
                                >
                                    <Text style={styles.addRowLabel}>+</Text>
                                </Pressable>
                            ) : (
                                <Text style={styles.trackCount}>{track.clips.length}</Text>
                            )}
                        </View>
                        <View style={styles.lane}>
                            {/* Behind the clips: a tap on bare lane is "put
                                something here". Drawn first so a clip always
                                wins the same tap. */}
                            {onAddAt && (
                                <Pressable
                                    style={styles.laneBase}
                                    disabled={busy}
                                    onPress={(e) => {
                                        // Located the same way as the seek,
                                        // for the same reason.
                                        const f = pressFraction(
                                            e.nativeEvent.pageX,
                                            laneLeft.current,
                                            laneWidth
                                        );
                                        onAddAt(
                                            { index: track.index, label: track.label, kind: track.kind },
                                            f === null ? positionMs : momentAt(f * laneWidth, laneWidth, totalMs)
                                        );
                                    }}
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
                                        draggable={draggable}
                                        laneLeft={laneLeft}
                                        laneWidth={laneWidth}
                                        totalMs={totalMs}
                                        busy={!!busy}
                                        leftFraction={left}
                                        widthPx={widthPx}
                                        onDrag={setDrag}
                                        onRetime={onRetimeClip}
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
 * A gesture must be built once per clip and kept. Built inside a `.map()`
 * in the parent's body it is rebuilt on every render — including every
 * render the drag itself causes — so the gesture is handed to a detector
 * that has just been replaced and the drag dies halfway across the lane.
 * A child keyed by the clip's id is what makes a drag survive its own
 * state updates.
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
    /** Scenes are moved in the scene panel, so they carry no gesture. */
    draggable: boolean;
    /** The lane's measured box, for locating a press. */
    laneLeft: React.MutableRefObject<number>;
    laneWidth: number;
    totalMs: number;
    busy: boolean;
    leftFraction: number;
    widthPx: number;
    onDrag: (d: { clipId: string; mode: DragMode; window: ClipWindow } | null) => void;
    onRetime?: (clip: DesignClip, window: ClipWindow) => void;
    onPress: () => void;
    onDelete: (() => void) | null;
}> = (props) => {
    const {
        clip,
        label,
        rowLabel,
        left,
        width,
        tint,
        selected,
        dragging,
        styles,
        draggable,
        onPress,
        onDelete,
    } = props;

    // ── ⚠️ Why react-native-gesture-handler and not PanResponder ─────────
    // PanResponder is the obvious choice and it does not work here. Three
    // separate things, each of which failed silently:
    //
    //  1. nativeEvent.locationX is undefined on react-native-web, so the
    //     trim zone could never be detected and every press became a move.
    //  2. The label inside a clip is a Pressable, and a Pressable claims
    //     the touch on press — so the bubbling onMoveShouldSetPanResponder
    //     was never even asked. Capturing fixed the ask, and then
    //  3. onPanResponderRelease never fired for a web mouse drag, so a
    //     gesture could begin and never commit.
    //
    // This app already ships react-native-gesture-handler (its root view
    // is mounted in app/_layout.tsx), which handles all three: absoluteX
    // on every event, activeOffsetX to let a tap through to the Pressable
    // while a drag is taken from it, and an onEnd that actually fires.
    const live = useRef(props);
    live.current = props;

    const mode = useRef<DragMode>("move");
    const from = useRef<ClipWindow>({ startMs: clip.startMs, durationMs: clip.durationMs });

    const pan = useMemo(
        () =>
            Gesture.Pan()
                // On the JS thread: these callbacks set React state and
                // call the screen's handlers, which the UI thread cannot.
                .runOnJS(true)
                // A horizontal travel of 4px is a drag; anything less stays
                // a tap and reaches the label, which selects the clip.
                .activeOffsetX([-4, 4])
                .failOffsetY([-12, 12])
                .onBegin((e) => {
                    const p = live.current;
                    from.current = { startMs: p.clip.startMs, durationMs: p.clip.durationMs };
                    // Where the finger LANDED, which is the only thing that
                    // can say whether this is a trim of an edge or a move:
                    // by the time a pan activates it has already travelled.
                    const clipLeftPx = p.laneLeft.current + p.leftFraction * p.laneWidth;
                    mode.current = dragModeFor(e.absoluteX - clipLeftPx, p.widthPx);
                })
                .onStart(() => {
                    const p = live.current;
                    p.onDrag({ clipId: p.clip.elementId, mode: mode.current, window: from.current });
                })
                .onUpdate((e) => {
                    const p = live.current;
                    p.onDrag({
                        clipId: p.clip.elementId,
                        mode: mode.current,
                        window: dragWindow(from.current, mode.current, e.translationX, p.laneWidth, p.totalMs),
                    });
                })
                .onEnd((e) => {
                    const p = live.current;
                    const to = dragWindow(from.current, mode.current, e.translationX, p.laneWidth, p.totalMs);
                    p.onDrag(null);
                    // A tap registers as a drag of a pixel or two, and every
                    // drag writes a revision into a ten-deep history.
                    if (dragChanged(from.current, to)) p.onRetime?.(p.clip, to);
                })
                .onFinalize(() => live.current.onDrag(null)),
        []
    );

    const body = (
        <View
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
            {selected && draggable && (
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

    // A scene carries no gesture at all rather than a detector that
    // refuses: scenes are moved in the scene panel, where the film relays
    // around them.
    return draggable ? <GestureDetector gesture={pan}>{body}</GestureDetector> : body;
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
                addRow: {
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: withAlpha(colors.primary, 0.12),
                },
                addRowOff: { opacity: 0.4 },
                addRowLabel: {
                    fontSize: fs(12),
                    lineHeight: lh(14),
                    fontWeight: "700",
                    color: colors.primary,
                },
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
