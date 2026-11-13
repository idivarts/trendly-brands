/**
 * What the user clicked, and the one rule about keeping it.
 *
 * ── Why this is a module and not a useState in the screen ─────────────────
 * Three panels read the selection — the scene panel highlights its scene,
 * the inspector shows its properties, and (from Phase 14) the AI panel
 * scopes an edit to it. Three readers of one fact is exactly where two of
 * them quietly disagree, so the shape lives here with the rules that go
 * with it, next to the other studio logic that is tested rather than
 * trusted.
 */

/** One selected element, as the player's bridge reports it. */
export interface Selection {
    /** The element's own id. Our films give every addressable element one. */
    elementId: string;
    /** The scene that owns it, from data-scene. "" when it sits outside one. */
    sceneId: string;
    /** Lower-cased tag name — h1, p, img. */
    tag: string;
    /** Its text, trimmed and capped by the bridge. */
    text: string;
}

/** The message shape the player posts when something is clicked. */
export interface PlayerSelectMessage {
    source?: string;
    type?: string;
    elementId?: string;
    sceneId?: string;
    tag?: string;
    text?: string;
}

/**
 * A selection from a player message, or null.
 *
 * Null for a click that resolved to nothing — the background, a gap between
 * scenes — because "nothing is selected" is a real state the panels must
 * show, not an error. An element with no id cannot be addressed later, so
 * it is treated as nothing rather than offered and then found unusable.
 */
export function selectionFrom(msg: PlayerSelectMessage | null | undefined): Selection | null {
    if (!msg || msg.source !== "trendly-player" || msg.type !== "select") return null;
    const elementId = (msg.elementId ?? "").trim();
    if (elementId === "") return null;
    return {
        elementId,
        sceneId: (msg.sceneId ?? "").trim(),
        tag: (msg.tag ?? "").trim().toLowerCase(),
        text: (msg.text ?? "").trim(),
    };
}

/**
 * What the inspector calls the selected thing.
 *
 * The element's own words where it has any, because that is what the user
 * clicked and what they will recognise. Falling back to the tag and then
 * the id, which are at least true — an inspector headed "Untitled" tells
 * nobody anything.
 */
export function selectionLabel(sel: Selection | null): string {
    if (!sel) return "Nothing selected";
    if (sel.text !== "") return sel.text.length > 48 ? sel.text.slice(0, 45) + "…" : sel.text;
    return sel.tag !== "" ? `<${sel.tag}>` : sel.elementId;
}

/** True when this scene owns the selection, for the scene panel's highlight. */
export function sceneHoldsSelection(sceneId: string, sel: Selection | null): boolean {
    return !!sel && sel.sceneId !== "" && sel.sceneId === sceneId;
}
