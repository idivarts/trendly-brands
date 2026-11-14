/**
 * Dragging on the timeline: what a gesture means, in milliseconds.
 *
 * ── Why a module ──────────────────────────────────────────────────────────
 * Every one of these conversions fails *quietly*. A drag that lands a clip
 * 40ms from where it was dropped, a trim that moves the start as well as
 * the end, an edge zone so wide that a short clip can only be trimmed and
 * never moved: all of them render perfectly and are simply wrong. This app
 * has jest but no React Native renderer, so the arithmetic lives here where
 * it can be tested, beside the component that uses it — the same shape as
 * studio-layout and scene-progress.
 *
 * ── The rules, stated once ────────────────────────────────────────────────
 * 1. Where the press LANDS decides what the drag is: within the edge zone,
 *    a trim of that edge; anywhere else, a move.
 * 2. A move changes the start and never the length. A trim changes the
 *    length, and the left-hand trim moves the start by the same amount so
 *    the other edge stays where it is.
 * 3. Nothing may leave the film, and nothing may be shorter than the floor.
 *    Clamped rather than refused: a drag is imprecise by nature and a drag
 *    to the end means the end.
 */

/** What a press on a clip turned out to mean. */
export type DragMode = "move" | "trim-start" | "trim-end";

/** The shortest a clip may be dragged to. Matches the backend's minClipMs. */
export const MIN_CLIP_MS = 100;

/**
 * How wide the trim zone is, in pixels.
 *
 * Narrow, because the common gesture is a move and a trim zone that eats
 * the clip makes the common gesture impossible. Never more than a third of
 * the clip either way — see dragModeFor.
 */
export const EDGE_PX = 14;

/**
 * What a press at `x` pixels into a clip `widthPx` wide means.
 *
 * The edge zone is capped at a third of the clip so a two-second clip in a
 * sixty-second film — a sliver 20px wide — can still be MOVED. Without the
 * cap, both edges would overlap in the middle and every press on a short
 * clip would be a trim, which is the one gesture nobody wants on a clip
 * they cannot see.
 */
export function dragModeFor(x: number, widthPx: number): DragMode {
    // ⚠️ A non-finite x is a MOVE, said explicitly.
    //
    // It used to fall through the comparisons below — undefined <= 14 is
    // false, undefined >= width-14 is false — and arrive at "move" by
    // accident, which is exactly what happened on web when this was fed
    // `nativeEvent.locationX`: trimming was impossible and nothing said so.
    // Stated here so the fallback is a decision rather than the shape of
    // two comparisons.
    if (!Number.isFinite(x)) return "move";
    const edge = Math.max(0, Math.min(EDGE_PX, widthPx / 3));
    if (edge <= 0) return "move";
    if (x <= edge) return "trim-start";
    if (x >= widthPx - edge) return "trim-end";
    return "move";
}

/** A clip's window, as the timeline holds it while a drag is in flight. */
export interface Window {
    startMs: number;
    durationMs: number;
}

/**
 * The window a drag of `dxPx` produces, from the window it started at.
 *
 * `laneWidthPx` and `totalMs` convert pixels to time; a lane of no width
 * converts nothing, so the window comes back untouched rather than
 * collapsing to zero.
 */
export function dragWindow(
    from: Window,
    mode: DragMode,
    dxPx: number,
    laneWidthPx: number,
    totalMs: number
): Window {
    if (laneWidthPx <= 0 || totalMs <= 0) return { ...from };
    const dMs = Math.round((dxPx / laneWidthPx) * totalMs);

    if (mode === "move") {
        // The length is kept exactly: a move that also shortened the clip
        // at the end of the film would be a move that silently trimmed it.
        const maxStart = Math.max(0, totalMs - from.durationMs);
        return {
            startMs: clamp(from.startMs + dMs, 0, maxStart),
            durationMs: from.durationMs,
        };
    }

    if (mode === "trim-start") {
        // The far edge stays put, which is what dragging the near one
        // means — so the start and the length move by the same amount in
        // opposite directions.
        const end = from.startMs + from.durationMs;
        const startMs = clamp(from.startMs + dMs, 0, end - MIN_CLIP_MS);
        return { startMs, durationMs: end - startMs };
    }

    // trim-end
    const maxDuration = Math.max(MIN_CLIP_MS, totalMs - from.startMs);
    return {
        startMs: from.startMs,
        durationMs: clamp(from.durationMs + dMs, MIN_CLIP_MS, maxDuration),
    };
}

/**
 * Whether a drag actually changed anything worth a revision.
 *
 * A tap registers as a drag of a pixel or two, and every drag writes a
 * revision — so without this, selecting a clip would spend a slot in a
 * ten-deep history on a change nobody made. One frame at 30fps is 33ms;
 * 40 is comfortably past a tap and far inside any deliberate nudge.
 */
export const DRAG_FLOOR_MS = 40;

export function dragChanged(from: Window, to: Window): boolean {
    return (
        Math.abs(to.startMs - from.startMs) >= DRAG_FLOOR_MS ||
        Math.abs(to.durationMs - from.durationMs) >= DRAG_FLOOR_MS
    );
}

/**
 * The moment a tap at `x` on a lane refers to, for adding something there.
 *
 * Snapped to the nearest tenth of a second. A person pointing at a row
 * means "about here", and an unsnapped tap produces data-start="6.237",
 * which is a number nobody chose appearing in their film's source.
 */
export function momentAt(x: number, laneWidthPx: number, totalMs: number): number {
    if (laneWidthPx <= 0 || totalMs <= 0) return 0;
    const raw = (clamp(x, 0, laneWidthPx) / laneWidthPx) * totalMs;
    return clamp(Math.round(raw / 100) * 100, 0, Math.max(0, totalMs - MIN_CLIP_MS));
}

/**
 * What kind of media a row takes, so a drop on it declares the right thing.
 *
 * Driven by the row's dominant kind rather than by its index, because a
 * film may author its music on row 7. A row of scenes takes a picture:
 * scenes are written by the AI, not dropped, and the thing a person means
 * by dropping a file on the scene row is "put this picture in my film".
 */
export function dropTypeFor(rowKind: string): "image" | "bgm" | "sfx" | "voice" {
    switch (rowKind) {
        case "music":
            return "bgm";
        case "sound":
            return "sfx";
        case "voice":
            return "voice";
        default:
            return "image";
    }
}

/** Whether an asset can go on a row at all: a sound on a picture row cannot. */
export function assetFitsRow(assetKind: string, rowKind: string): boolean {
    const wantsAudio = rowKind === "music" || rowKind === "sound" || rowKind === "voice";
    const isAudio = assetKind === "audio";
    return wantsAudio === isAudio;
}

function clamp(n: number, lo: number, hi: number): number {
    if (!Number.isFinite(n)) return lo;
    if (hi < lo) return lo;
    return Math.min(Math.max(n, lo), hi);
}

/**
 * Where along a lane a press landed, as a fraction of its width.
 *
 * ── ⚠️ Why this takes pageX and a measured box ────────────────────────────
 * The obvious spelling is `e.nativeEvent.locationX`, and on a device it
 * works. On react-native-web it is **undefined** — and undefined divided by
 * a width is NaN, which clamps to NaN, which lands in a style as
 * `left: "NaN%"`, which the browser silently drops. So the playhead sat at
 * 0% and clicking the ruler looked like a timeline that ignored you. Every
 * signal said the handler never ran.
 *
 * `pageX` is reported on both, so the press is located against the lane's
 * own measured position instead. Returns null when there is nothing to
 * measure against, so a caller can do nothing rather than seek to NaN.
 */
export function pressFraction(
    pageX: number | undefined,
    laneLeftPx: number,
    laneWidthPx: number
): number | null {
    if (!Number.isFinite(pageX as number)) return null;
    if (!(laneWidthPx > 0)) return null;
    const raw = ((pageX as number) - laneLeftPx) / laneWidthPx;
    if (!Number.isFinite(raw)) return null;
    return Math.min(Math.max(raw, 0), 1);
}
