/**
 * Focus — a structured "what the user is pointing the AI at".
 *
 * Every AI-chat surface (Design Studio element, Strategy passage, Calendar post,
 * a Comment) can attach one or more `Focus` objects to a message. Each Focus has:
 *   - `focusText`  — the human label shown in the UI (chip + on the sent message)
 *   - `focusArea`  — the structured target, persisted on the message and rendered
 *                    into the AI prompt so the model knows the EXACT node / slide /
 *                    content / comment being referenced.
 *
 * `focusArea` is a discriminated union keyed by `type`. `comment` focuses can
 * `inherit` another area, so "the AI is focused on a comment which itself points
 * at a design element / strategy passage" is expressible.
 *
 * Keep this in sync with the backend mirror `trendlymodels.AIFocus` /
 * `AIFocusArea` (backend-sls/internal/models/trendlymodels/ai_conversation.go).
 */

export type FocusAreaType =
    | "design-element"
    | "strategy-snippet"
    | "calendar-content"
    | "content"
    | "comment";

/** A specific element inside a content's HTML design (Design Studio). */
export interface DesignElementFocusArea {
    type: "design-element";
    contentId: string;
    /** The design revision the element lives on (for exact addressing). */
    revisionId?: string;
    /** Stable id of the element in the design frame (data-el). */
    elementId: string;
    /** Zero-based slide/frame index for multi-slide / video designs. */
    slideIndex?: number;
    slideCount?: number;
    /** "image" | "video" | "carousel" — the design doc type. */
    docType?: string;
    /** The element's visible text, if any (empty for images/containers). */
    text?: string;
}

/** A selected passage in a strategy document (offset-anchored). */
export interface StrategySnippetFocusArea {
    type: "strategy-snippet";
    strategyId: string;
    snippet: string;
    anchorStart?: number;
    anchorEnd?: number;
}

/** A scheduled post referenced from the calendar. */
export interface CalendarContentFocusArea {
    type: "calendar-content";
    contentId: string;
    title?: string;
    contentType?: string;
    /** ISO date (YYYY-MM-DD) the post is scheduled for. */
    date?: string;
}

/** A content item, referenced generically (not tied to a specific element). */
export interface ContentFocusArea {
    type: "content";
    contentId: string;
    title?: string;
}

/** A comment — optionally inheriting the target the comment itself points at. */
export interface CommentFocusArea {
    type: "comment";
    commentId: string;
    text?: string;
    /** What the comment is anchored to (a design element, a strategy passage…). */
    inherits?: FocusArea;
}

export type FocusArea =
    | DesignElementFocusArea
    | StrategySnippetFocusArea
    | CalendarContentFocusArea
    | ContentFocusArea
    | CommentFocusArea;

export interface Focus {
    id: string;
    /** Human label shown in the UI. */
    focusText: string;
    /** Structured target sent to the AI + persisted on the message. */
    focusArea: FocusArea;
}

const clip = (s: string | undefined, n = 160): string =>
    (s ?? "").trim().length > n ? (s ?? "").trim().slice(0, n) + "…" : (s ?? "").trim();

/**
 * A precise, human-readable description of a focus area for the AI prompt. Used
 * both as the display fallback and as the derived string sent to the backend so
 * the model can target the exact node/slide/content even before it consumes the
 * structured object.
 */
export function describeFocusArea(area: FocusArea): string {
    switch (area.type) {
        case "design-element": {
            const where =
                area.slideIndex != null
                    ? ` on slide ${area.slideIndex + 1}${area.slideCount ? `/${area.slideCount}` : ""}`
                    : "";
            const reads = area.text?.trim() ? `, which reads: "${clip(area.text)}"` : "";
            return `a design element (id: ${area.elementId})${where} of content ${area.contentId}${reads}`;
        }
        case "strategy-snippet":
            return `a passage in strategy ${area.strategyId}: "${clip(area.snippet)}"`;
        case "calendar-content": {
            const bits = [
                area.title ? `"${clip(area.title, 80)}"` : "",
                area.contentType || "",
                area.date || "",
            ]
                .filter(Boolean)
                .join(", ");
            return `the scheduled post ${area.contentId}${bits ? ` (${bits})` : ""}`;
        }
        case "content":
            return `content ${area.contentId}${area.title ? ` ("${clip(area.title, 80)}")` : ""}`;
        case "comment": {
            const t = area.text?.trim() ? `: "${clip(area.text)}"` : "";
            const inh = area.inherits ? `, which refers to ${describeFocusArea(area.inherits)}` : "";
            return `comment ${area.commentId}${t}${inh}`;
        }
        default:
            return "the referenced item";
    }
}

/** Serialize a list of focuses into the prompt-fallback string (one per line). */
export function focusesToPromptString(focuses: Focus[]): string {
    return focuses.map((f) => `- ${describeFocusArea(f.focusArea)}`).join("\n");
}
