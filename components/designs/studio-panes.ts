/**
 * How wide the studio's side panels are, and what a drag on a divider does.
 *
 * ── Why a module ──────────────────────────────────────────────────────────
 * A resize is arithmetic with three constraints that pull against each
 * other — each panel has a floor, the stage has a floor, and the window is
 * whatever it is — and getting it wrong does not throw. It squeezes the
 * film to nothing, or lets a panel grow past the edge of the screen, or
 * silently refuses to move on a narrow laptop. This app has jest but no
 * React Native renderer, so the arithmetic lives here beside the screen
 * that uses it, like studio-layout and timeline-drag.
 */

/** The conversation is read as well as typed in, so it needs room. */
export const LEFT_MIN = 280;
/** The inspector's controls stop fitting below this. */
export const RIGHT_MIN = 240;
/**
 * The film is the point of the screen.
 *
 * Without this floor a person dragging the chat wider would squeeze the
 * stage to a sliver — and because the stage letterboxes rather than
 * clipping, nothing would look broken, it would just get smaller until it
 * was useless.
 */
export const STAGE_MIN = 360;

export const LEFT_DEFAULT = 320;
export const RIGHT_DEFAULT = 290;

/**
 * Clamp a proposed width for one panel against the window and its neighbour.
 *
 * `other` is the panel on the far side, which is already taking its width
 * out of the same row — so the maximum is what is left after it and the
 * stage, not a fraction of the window. A fraction would be simpler and
 * wrong: at 1280px two panels each capped at 40% leave the stage 256px.
 */
export function clampPaneWidth(
    proposed: number,
    min: number,
    other: number,
    windowWidth: number
): number {
    if (!Number.isFinite(proposed)) return min;
    const max = Math.max(min, windowWidth - other - STAGE_MIN);
    return Math.min(Math.max(Math.round(proposed), min), max);
}

/**
 * Both widths, fitted to a window that may be narrower than they are.
 *
 * Called on every window resize, not only on a drag. Someone who sized
 * their panels on an external monitor and then unplugged it would
 * otherwise come back to a stage of no width — the panels would keep the
 * widths they were given and there would be nothing left between them.
 *
 * The panels give up room proportionally, so the one that was deliberately
 * made wide stays the wider of the two.
 */
export function fitPanes(
    left: number,
    right: number,
    windowWidth: number
): { left: number; right: number } {
    const floor = LEFT_MIN + RIGHT_MIN + STAGE_MIN;
    if (windowWidth <= floor) return { left: LEFT_MIN, right: RIGHT_MIN };

    const spare = windowWidth - STAGE_MIN;
    if (left + right <= spare) {
        return { left: Math.max(LEFT_MIN, left), right: Math.max(RIGHT_MIN, right) };
    }
    // Over budget: take the overflow out of the slack each panel has above
    // its own floor, in proportion to how much slack each has.
    const leftSlack = Math.max(0, left - LEFT_MIN);
    const rightSlack = Math.max(0, right - RIGHT_MIN);
    const totalSlack = leftSlack + rightSlack;
    const over = left + right - spare;
    if (totalSlack <= 0) return { left: LEFT_MIN, right: RIGHT_MIN };
    return {
        left: Math.round(left - (over * leftSlack) / totalSlack),
        right: Math.round(right - (over * rightSlack) / totalSlack),
    };
}

/**
 * The layout a film that does not exist yet opens with.
 *
 * ── Why an empty film gets a different shape ─────────────────────────────
 * There is nothing to look at and nothing to lay out. The only thing a
 * person can do is say what they want, so the thing they say it in gets
 * the room: about half the width, with the timeline folded away because
 * it has no rows to draw. The stage keeps its floor — an empty player is
 * still the promise of where the film will appear.
 *
 * It is a PRESENTATION, not a stored preference. Nothing here is written
 * to storage, and the moment the first scene lands the studio returns to
 * the layout the person actually chose.
 */
export function openingPanes(windowWidth: number, right: number): { left: number; right: number } {
    const wanted = Math.max(RIGHT_MIN, right);
    const half = Math.round(windowWidth / 2);
    // ⚠️ Through fitPanes, not just clamped against the inspector's
    // current width. On a narrow screen that width is itself above its
    // floor, so clamping the prompt against it leaves the stage below
    // its own — at 700px it came out at 130px, a third of what the film
    // needs. fitPanes is where "both panels give ground to the stage"
    // already lives; this asks it the same question.
    return fitPanes(half, wanted, windowWidth);
}

/**
 * Where the studio's layout is remembered.
 *
 * Per viewer and per device, which is right: a panel width is about the
 * screen someone is sitting at, not about the film. The READING and
 * WRITING live in studio-panes-store.ts, not here — importing
 * PersistentStorage pulls in AsyncStorage, whose native module is null
 * under jest, and that would make this whole module untestable. The
 * arithmetic is the part worth testing, so the arithmetic is what stays.
 */
export const STUDIO_LAYOUT_KEY = "studio.layout.v1";

export interface StudioLayout {
    left: number;
    right: number;
    /** Whether the timeline is showing. */
    timeline: boolean;
}

export const DEFAULT_LAYOUT: StudioLayout = {
    left: LEFT_DEFAULT,
    right: RIGHT_DEFAULT,
    timeline: true,
};

/**
 * Read a stored layout, defaulting anything missing or nonsense.
 *
 * A stored value is the one input here that arrives from outside the
 * code, and "the studio opens with no stage" is the kind of thing a stale
 * or hand-edited entry causes.
 */
export function parseLayout(raw: string): StudioLayout {
    try {
        const v = JSON.parse(raw) as Partial<StudioLayout>;
        return {
            left: Number.isFinite(v?.left) ? Math.max(LEFT_MIN, v!.left!) : LEFT_DEFAULT,
            right: Number.isFinite(v?.right) ? Math.max(RIGHT_MIN, v!.right!) : RIGHT_DEFAULT,
            timeline: typeof v?.timeline === "boolean" ? v.timeline : true,
        };
    } catch {
        return DEFAULT_LAYOUT;
    }
}
