/**
 * What the inspector sends, and when.
 *
 * ── Why the rules are here and not in the panel ───────────────────────────
 * Same reason as design-status, studio-layout and revisions: this app has
 * jest but no React Native renderer, so a test cannot import a component.
 * And these particular rules are worth testing — "one write per settled
 * change" is the difference between a colour drag producing one revision
 * and producing forty.
 */

/** The style the player reports for a selected element. */
export interface SelectionStyle {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
}

/** What the inspector can change about one element. */
export interface ElementDraft {
    text: string;
    color: string;
    backgroundColor: string;
    /** Points, as a number, because a slider cannot drag "88px". */
    fontSizePx: number | null;
    fontWeight: string;
    textAlign: string;
    startMs: number | null;
    durationMs: number | null;
}

/** The request body the backend's /element endpoint takes. */
export interface ElementEdit {
    elementId: string;
    text?: string;
    style?: Record<string, string>;
    startMs?: number;
    durationMs?: number;
}

/**
 * The draft an element starts at — what it looks like right now.
 *
 * Everything the player could not tell us comes back as empty rather than
 * as a guess, so a control with nothing behind it can show nothing instead
 * of inventing a default and writing it into the film on first touch.
 */
export function draftFrom(
    text: string | undefined,
    style: SelectionStyle | undefined,
    startMs: number | null | undefined,
    durationMs: number | null | undefined
): ElementDraft {
    return {
        text: text ?? "",
        color: style?.color ?? "",
        backgroundColor: style?.backgroundColor ?? "",
        fontSizePx: pxToNumber(style?.fontSize),
        fontWeight: style?.fontWeight ?? "",
        textAlign: style?.textAlign ?? "",
        startMs: startMs ?? null,
        durationMs: durationMs ?? null,
    };
}

/** "88px" → 88. Anything else → null. */
export function pxToNumber(v: string | undefined): number | null {
    if (!v) return null;
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * What to send for the difference between two drafts, or null when there
 * is nothing to send.
 *
 * Only what CHANGED. Sending the whole draft every time would write the
 * computed colour of every element the user merely looked at into the film
 * as an inline override — the panel shows computed values precisely
 * because most elements have no inline style, and writing those back would
 * freeze every one of them against the brand kit.
 */
export function editBetween(
    elementId: string,
    before: ElementDraft,
    after: ElementDraft
): ElementEdit | null {
    const edit: ElementEdit = { elementId };
    let any = false;

    if (after.text !== before.text) {
        edit.text = after.text;
        any = true;
    }

    const style: Record<string, string> = {};
    if (after.color !== before.color) style.color = after.color;
    if (after.backgroundColor !== before.backgroundColor) style.background = after.backgroundColor;
    if (after.fontWeight !== before.fontWeight) style["font-weight"] = after.fontWeight;
    if (after.textAlign !== before.textAlign) style["text-align"] = after.textAlign;
    if (after.fontSizePx !== before.fontSizePx) {
        // null means "do not set it", which for a property means clearing
        // the override rather than writing "nullpx".
        style["font-size"] = after.fontSizePx === null ? "" : `${after.fontSizePx}px`;
    }
    if (Object.keys(style).length > 0) {
        edit.style = style;
        any = true;
    }

    if (after.startMs !== before.startMs && after.startMs !== null) {
        edit.startMs = after.startMs;
        any = true;
    }
    if (after.durationMs !== before.durationMs && after.durationMs !== null) {
        edit.durationMs = after.durationMs;
        any = true;
    }

    return any ? edit : null;
}

/**
 * How long to wait after the last keystroke or drag before writing.
 *
 * Every write is a revision and a round trip, and the retention cap is ten
 * — so a colour picker dragged across the spectrum must not spend the
 * user's whole history on a gesture they have not finished making. Long
 * enough to swallow a drag, short enough that typing a headline and
 * looking up feels immediate.
 */
export const EDIT_DEBOUNCE_MS = 700;

/**
 * Whether a draft is worth sending at all.
 *
 * A text edit down to nothing is a real edit — someone clearing a
 * placeholder — but an element whose every field is empty is one the
 * player could not describe, and writing that would set a row of blanks on
 * it.
 */
export function worthSending(edit: ElementEdit | null): boolean {
    if (!edit) return false;
    return edit.text !== undefined || !!edit.style || edit.startMs !== undefined || edit.durationMs !== undefined;
}
