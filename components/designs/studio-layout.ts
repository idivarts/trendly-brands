/**
 * The arithmetic behind the Design Studio editor: tracks, clip geometry, and
 * the clock.
 *
 * ── Why a module ──────────────────────────────────────────────────────────
 * A timeline is a pile of small conversions — milliseconds to pixels, a
 * playhead to the scene under it, scenes to the rows they sit on — and every
 * one of them fails *quietly*. A clip two pixels wide, a playhead that drifts,
 * a scene drawn on the wrong row: all of them render perfectly and are simply
 * wrong. This app has jest but no React Native renderer (importing a screen
 * pulls in the whole RN tree), so the arithmetic lives here where it can be
 * tested, beside the components that use it — like the studio's own
 * scene-progress module.
 */

import type { DesignPreviewFrame } from "./design-status";

export interface DesignScene {
    id: string;
    src: string;
    startMs: number;
    durationMs: number;
    trackIndex: number;
    trackKind?: string;
}

/**
 * One thing on the timeline, as the backend reports it.
 *
 * Mirrors trendlymodels.DesignClip. A clip is a scene, a photograph, a
 * video, a voiceover, a music track, a sound effect or a caption track —
 * anything the film times. Text INSIDE a scene is deliberately not one: the
 * layer tree is where structure inside a scene belongs, and a three-scene
 * reel with thirty rows is the timeline nobody could read.
 */
export interface DesignClip {
    elementId: string;
    kind: ClipKind;
    trackIndex: number;
    /** True when the FILM said which row this is on, rather than it being
     *  inferred from the kind for a film written before rows existed. */
    authored?: boolean;
    startMs: number;
    durationMs: number;
    label?: string;
    src?: string;
}

export type ClipKind =
    | "scene"
    | "video"
    | "image"
    | "voice"
    | "music"
    | "sound"
    | "captions";

/** One row of the timeline, with the clips that sit on it. */
export interface TimelineTrack {
    index: number;
    /** What the row is called down the left-hand side. */
    label: string;
    kind: string;
    clips: DesignClip[];
}

/**
 * What a row of a given kind is called.
 *
 * Plural, because a row holds several: "Scenes", not "Scene". Named after
 * what is on the row rather than "Track 2", which tells a person nothing
 * about their own film.
 */
const ROW_LABEL: Record<ClipKind, string> = {
    scene: "Scenes",
    video: "Video",
    image: "Pictures",
    voice: "Voice",
    music: "Music",
    sound: "Sound",
    captions: "Captions",
};

/**
 * Group the clips into the rows they are drawn on.
 *
 * ── Why this replaced toTracks ────────────────────────────────────────────
 * `toTracks` grouped SCENES, which is all the backend used to report, so a
 * reel with music, a voiceover and a photograph drew one row and three
 * invisible things. Clips carry every timed element with the row the film
 * puts it on, so this draws the film rather than a part of it.
 *
 * ── A row is named after what is on it, not its number ────────────────────
 * The label comes from the kind that occupies most of the row, so a row the
 * film authored at index 7 still reads as "Music". Where a row genuinely
 * mixes kinds — a picture and a video together, which is the normal case on
 * the media row — the commonest wins and the others are still drawn on it.
 */
export function clipTracks(clips: DesignClip[] | undefined): TimelineTrack[] {
    const byIndex = new Map<number, DesignClip[]>();
    for (const c of clips ?? []) {
        if (!c?.elementId) continue;
        const i = Number.isFinite(c.trackIndex) ? Math.max(0, Math.trunc(c.trackIndex)) : 0;
        const list = byIndex.get(i);
        if (list) list.push(c);
        else byIndex.set(i, [c]);
    }

    return [...byIndex.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([index, list]) => {
            const kind = dominantKind(list);
            return {
                index,
                kind,
                label: ROW_LABEL[kind as ClipKind] ?? titleCase(kind),
                clips: [...list].sort((a, b) => a.startMs - b.startMs),
            };
        });
}

/** The kind most of a row is, for the row's name. */
function dominantKind(clips: DesignClip[]): string {
    const counts = new Map<string, number>();
    for (const c of clips) {
        const k = c.kind || "scene";
        counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    let best = "scene";
    let most = -1;
    // Ties broken by the order the kinds are drawn in, so the same row never
    // changes its name because two clips were reported the other way round.
    for (const k of Object.keys(ROW_LABEL) as ClipKind[]) {
        const n = counts.get(k) ?? 0;
        if (n > most) {
            most = n;
            best = k;
        }
    }
    return best;
}

/**
 * The timeline for a design that has clips, or the best we can do without.
 *
 * Every design authored before the backend started reporting clips has
 * scenes and nothing else. Falling back to the scenes gives that film its
 * spine — one row, which is what it drew before — instead of an empty
 * timeline that reads as a broken studio. The alternative was to re-author
 * every old design to see its own film.
 */
export function timelineTracks(
    clips: DesignClip[] | undefined,
    scenes: DesignScene[] | undefined
): TimelineTrack[] {
    if (clips?.length) return clipTracks(clips);
    return clipTracks(scenesAsClips(scenes));
}

/** Scenes as clips on row 0, for a film that predates the clip list. */
export function scenesAsClips(scenes: DesignScene[] | undefined): DesignClip[] {
    return (scenes ?? []).map((s) => ({
        elementId: s.id,
        kind: "scene" as ClipKind,
        trackIndex: Number.isFinite(s.trackIndex) ? s.trackIndex : 0,
        startMs: s.startMs,
        durationMs: s.durationMs,
        label: s.id,
    }));
}

/** The clip under the playhead on the scene row, or null in a gap. */
export function clipAt(clips: DesignClip[] | undefined, positionMs: number): DesignClip | null {
    for (const c of clips ?? []) {
        if (c.kind !== "scene") continue;
        const start = c.startMs || 0;
        // Half-open, for the same reason sceneAt is: at a cut the NEXT scene
        // is the one on screen, so two clips never both claim the frame.
        if (positionMs >= start && positionMs < start + (c.durationMs || 0)) return c;
    }
    return null;
}

/**
 * The film's length.
 *
 * `durationMs` off the document is the root composition's own `data-duration`
 * and is authoritative — it is what the renderer cuts to and what the wallet
 * charged for. The scenes are only consulted when it is missing, because a
 * timeline with no width draws nothing at all and that is a worse answer than
 * an estimate.
 */
export function timelineDurationMs(
    durationMs: number | undefined,
    scenes: DesignScene[] | undefined,
    clips?: DesignClip[] | undefined
): number {
    if (durationMs && durationMs > 0) return durationMs;
    let end = 0;
    // The clips as well as the scenes: a music track running two seconds
    // past the last scene is part of the film, and a timeline cut to the
    // scenes would draw it hanging off the end of its own row.
    for (const s of scenes ?? []) {
        end = Math.max(end, (s.startMs || 0) + (s.durationMs || 0));
    }
    for (const c of clips ?? []) {
        end = Math.max(end, (c.startMs || 0) + (c.durationMs || 0));
    }
    return end;
}

function titleCase(s: string): string {
    if (!s) return "Scene";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Where a clip sits on a row, as fractions of the timeline's width.
 *
 * Fractions rather than pixels so the caller can lay out with percentages and
 * the timeline reflows with the pane. Both are clamped into [0, 1]: a scene
 * whose duration runs past the root's — which the authoring contract permits
 * and the renderer simply cuts — would otherwise draw a clip wider than the
 * track and push the whole row out of alignment.
 */
export function clipGeometry(
    scene: { startMs: number; durationMs: number },
    totalMs: number
): { left: number; width: number } {
    if (totalMs <= 0) return { left: 0, width: 0 };
    const left = clamp01((scene.startMs || 0) / totalMs);
    const rawWidth = (scene.durationMs || 0) / totalMs;
    // Never wider than what is left of the track after `left`.
    const width = Math.max(0, Math.min(rawWidth, 1 - left));
    return { left, width };
}

function clamp01(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.min(Math.max(n, 0), 1);
}

/** The scene under the playhead, or null in a gap. */
export function sceneAt(scenes: DesignScene[] | undefined, positionMs: number): DesignScene | null {
    for (const s of scenes ?? []) {
        const start = s.startMs || 0;
        const end = start + (s.durationMs || 0);
        // Half-open: at exactly the boundary the NEXT scene is on screen,
        // which is what the renderer does. Closed intervals would make two
        // scenes both claim the frame at a cut.
        if (positionMs >= start && positionMs < end) return s;
    }
    return null;
}

/**
 * The preview frame to show at a given moment.
 *
 * The LAST frame at or before the playhead, not the nearest. Frames are
 * sampled every couple of seconds, so "nearest" would show the upcoming scene
 * while the playhead is still in the previous one — the picture would change
 * before the cut does.
 */
export function frameAt(
    frames: DesignPreviewFrame[] | undefined,
    positionMs: number
): DesignPreviewFrame | null {
    let best: DesignPreviewFrame | null = null;
    for (const f of frames ?? []) {
        if (f.timeMs <= positionMs && (!best || f.timeMs > best.timeMs)) best = f;
    }
    // Before the first sample, the first frame is still the better answer
    // than an empty stage.
    if (!best && (frames?.length ?? 0) > 0) {
        best = [...frames!].sort((a, b) => a.timeMs - b.timeMs)[0];
    }
    return best;
}

/** "0:04" / "1:23" — the transport clock. */
export function formatClock(ms: number): string {
    const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
    const total = Math.floor(safe / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The ruler's tick marks.
 *
 * Spaced so a short film is not crowded and a long one is not bare, and
 * always ending on a tick at or before the end — a tick past the end would
 * label time the film does not have.
 */
export function rulerTicks(totalMs: number, maxTicks = 10): number[] {
    if (totalMs <= 0) return [];
    const seconds = totalMs / 1000;
    const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300];
    const step = steps.find((s) => seconds / s <= maxTicks) ?? steps[steps.length - 1];
    const ticks: number[] = [];
    for (let t = 0; t <= seconds + 1e-9; t += step) ticks.push(Math.round(t * 1000));
    return ticks;
}

/**
 * The layer tree the right-hand panel shows.
 *
 * One node per scene, with its clip's own children folded underneath. v3 does
 * not parse the compositions themselves — only the root — so a scene's
 * children are what the document actually knows: where it is and how long it
 * lasts. Shown rather than hidden because an empty disclosure triangle is a
 * promise the panel cannot keep.
 *
 * ── A scene does not always HAVE a file ───────────────────────────────────
 * The child row names the scene's own document, and a scene only has one in
 * the sub-composition shape (`data-composition-src`). Authoring emits a
 * SINGLE document, where every scene is a section of index.html and `src` is
 * "" — so the row rendered as a bullet, a blank label and the word "scene",
 * under a triangle that promised something to open.
 *
 * `hasChildren` is what the panel draws the triangle from, so the promise and
 * the thing it opens are decided in one place. The earlier tests all used the
 * sub-composition shape, which is why they passed while every real design on
 * dev showed the empty row.
 */
export interface LayerNode {
    id: string;
    label: string;
    detail: string;
    depth: number;
    /** Depth 0 only: whether this scene has anything to fold out. */
    hasChildren?: boolean;
}

export function toLayerTree(
    scenes: DesignScene[] | undefined,
    expanded: ReadonlySet<string>
): LayerNode[] {
    const out: LayerNode[] = [];
    for (const s of scenes ?? []) {
        // Trimmed before it is tested, so "compositions/" on its own counts as
        // no file rather than as a child with an empty name.
        const file = (s.src ?? "").replace(/^compositions\//, "").trim();
        out.push({
            id: s.id,
            label: s.id,
            detail: `${formatClock(s.startMs)} · ${(s.durationMs / 1000).toFixed(1)}s`,
            depth: 0,
            hasChildren: file !== "",
        });
        if (file !== "" && expanded.has(s.id)) {
            out.push({
                id: `${s.id}::src`,
                label: file,
                detail: s.trackKind ?? "scene",
                depth: 1,
            });
        }
    }
    return out;
}

/**
 * How far the app's playhead may sit from the player's last reported time and
 * still count as the same moment.
 *
 * The player reports `timeupdate` roughly every frame, each one landing in the
 * app as a changed position. Sending those back as seeks would have the app
 * and the film fighting over the clock — the film would stutter, because each
 * seek lands a frame behind where it already is.
 *
 * So a position within one tick of what the player just said is the player's
 * own, and anything further is a real seek: a click in the Layers panel, on
 * the timeline, or the scrub bar. 150 ms is comfortably more than a tick at
 * 30fps (33 ms) and far less than the smallest deliberate jump — a scene
 * boundary, seconds away.
 */
export const PLAYER_ECHO_MS = 150;

/** True when `positionMs` is just the player's own clock coming back. */
export function isPlayerEcho(lastFromPlayerMs: number | null, positionMs: number): boolean {
    if (lastFromPlayerMs === null) return false;
    return Math.abs(lastFromPlayerMs - positionMs) <= PLAYER_ECHO_MS;
}
