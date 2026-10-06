/**
 * Media lanes — how a content's current media was produced.
 *
 * A content's media comes from exactly one of three creation surfaces, and the
 * Media Stage shows only the lane that owns it (picking one hides the others):
 *
 *   "design"   → an HTML design authored in the Design Studio (`designRef`)
 *   "generate" → photoreal image(s) from AI image generation
 *   "upload"   → asset(s) the user picked themselves
 *
 * `null` means no lane is committed yet — the Media Stage shows the lane chooser.
 *
 * The content doc's `source` field is the authoritative record, but it is only
 * consulted to disambiguate the two lanes that both produce plain image
 * attachments. Everything else is derived from the data, which keeps three
 * things true at once:
 *
 *   - Legacy contents (written before `source` was stamped) resolve correctly
 *     with no migration.
 *   - A stale `source` can never claim a lane for a content that has no media —
 *     evidence (a design pointer or an attachment) is always required.
 *   - An upload that is still unsaved doesn't need `source` written early just
 *     to render the right lane.
 */
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { ContentType } from "@/components/content-calendar/types";
import { MEDIA_SPEC } from "./media-spec";

export type MediaLane = "design" | "generate" | "upload";

/** The `source` values a content doc can carry. Mirrors the Firestore model. */
export type MediaSource = "ai" | "ai-image" | "upload" | "canva";

export interface ResolveLaneArgs {
    designRef?: IContentDesignRef;
    attachments: Attachment[];
    source?: MediaSource;
}

/**
 * The lane that owns this content's media, or null when there is none yet.
 *
 * A design pointer wins over attachments, because a rendered design has both
 * (the render IS the attachment) and it must stay editable in the Studio.
 */
export function resolveMediaLane({ designRef, attachments, source }: ResolveLaneArgs): MediaLane | null {
    if (designRef?.revisionId) return "design";
    if (attachments.length > 0) return source === "ai-image" ? "generate" : "upload";
    return null;
}

/**
 * Which lanes a content type can offer.
 *
 * The Design Studio authors both image and video designs, so "design" is always
 * available. AI image generation is image-only — there is no photoreal video
 * generation — so "generate" is gated on the media kind rather than on a
 * per-type flag.
 */
export function lanesFor(type: ContentType): MediaLane[] {
    const spec = MEDIA_SPEC[type];
    if (spec.kind === "none") return [];
    return spec.kind === "image" ? ["design", "generate", "upload"] : ["design", "upload"];
}

/** Lane-appropriate label for the action that clears the media back to empty. */
export function clearLabelFor(lane: MediaLane, type: ContentType): string {
    const spec = MEDIA_SPEC[type];
    if (lane === "design") return "Clear canvas";
    if (lane === "generate") return spec.multi ? "Discard generated slides" : "Discard generated image";
    if (spec.multi) return "Remove all slides";
    return spec.kind === "video" ? "Remove video" : "Remove image";
}
