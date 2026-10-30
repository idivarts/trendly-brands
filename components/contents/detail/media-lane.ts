/**
 * Media lanes — how a content's current media was produced.
 *
 * A content's media comes from exactly one of two creation surfaces, and the
 * Media Stage shows only the lane that owns it (picking one hides the other):
 *
 *   "design" → made by the AI, on a canvas (`designRef`)
 *   "upload" → a file the user picked themselves
 *
 * `null` means no lane is committed yet — the Media Stage shows the lane chooser.
 *
 * There used to be a third, "generate", for photoreal images. It was not a
 * lane: it was one way of making a design, and modelling it as a peer of
 * "design" is what made "a generated photo with a headline over it" — the most
 * ordinary request there is — impossible to express. HOW the AI makes the media
 * is an approach, a tab on the composer; approaches converge on one document.
 *
 * The lane is derived entirely from the data. Evidence is always required, so a
 * content with no media can never have a lane claimed for it, and an upload
 * that is still unsaved needs nothing written early just to render correctly.
 */
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { IContentCompositionRef } from "@/shared-libs/firestore/trendly-pro/models/composition";
import { ContentType } from "@/components/content-calendar/types";
import { MEDIA_SPEC } from "./media-spec";

export type MediaLane = "design" | "upload";

/** The `source` values a content doc can carry. Mirrors the Firestore model. */
export type MediaSource = "ai" | "ai-image" | "upload" | "canva";

export interface ResolveLaneArgs {
    designRef?: IContentDesignRef;
    /**
     * Pointer to an authored timeline. A content can have one with NO design —
     * a generated clip, or a cut of uploaded footage — and that is a whole
     * video, not an absence of media.
     */
    compositionRef?: IContentCompositionRef;
    attachments: Attachment[];
    source?: MediaSource;
}

/**
 * The lane that owns this content's media, or null when there is none yet.
 *
 * A design pointer wins over attachments, because a rendered design has both
 * (the render IS the attachment) and it must stay editable in the Studio.
 *
 * `source` is no longer consulted. Photoreal generation now writes a DESIGN
 * DOCUMENT holding the image, so a generated image arrives with a `designRef`
 * and resolves as "design" on the first line — editable on the canvas, which is
 * the whole point of generating it there.
 *
 * Content generated under the old path kept its image as a bare attachment with
 * no `designRef`, so it reads as an upload: intact, previewable and
 * publishable, but no longer editable. That is the agreed trade. The
 * alternative was carrying a third lane forever to serve rows that a backfill
 * could not make editable anyway, since there was never a design document to
 * restore.
 */
export function resolveMediaLane({
    designRef,
    compositionRef,
    attachments,
}: ResolveLaneArgs): MediaLane | null {
    if (designRef?.revisionId) return "design";
    // A timeline with clips on it IS the media, even with no design: a
    // generated clip or a cut of footage is a whole video. It resolves to the
    // design lane because the Studio is where a timeline is edited — reading
    // as "nothing here yet" offered the user two cards to start over with,
    // beside a clip they had already paid for.
    if (compositionRef?.revisionId && compositionRef.clipCount > 0) return "design";
    if (attachments.length > 0) return "upload";
    return null;
}

/**
 * Which lanes a content type can OFFER on the chooser.
 *
 * Two, for both image and video. The image/video asymmetry is gone: photoreal
 * generation used to be a lane of its own, available only for images, and is
 * now an APPROACH inside "Design with AI" (see composer/approach-spec.ts).
 * Approaches converge on one document; lanes do not. Keeping generation as a
 * lane is what made "a photo with a headline on it" an impossible combination.
 *
 * Note this is deliberately NOT the same set as `resolveMediaLane` can return —
 * see the comment there.
 */
export function lanesFor(type: ContentType): MediaLane[] {
    const spec = MEDIA_SPEC[type];
    if (spec.kind === "none") return [];
    return ["design", "upload"];
}

/** Lane-appropriate label for the action that clears the media back to empty. */
export function clearLabelFor(lane: MediaLane, type: ContentType): string {
    const spec = MEDIA_SPEC[type];
    if (lane === "design") return "Clear canvas";
    if (spec.multi) return "Remove all slides";
    return spec.kind === "video" ? "Remove video" : "Remove image";
}
