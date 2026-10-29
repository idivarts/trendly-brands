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
 *
 * ⚠️ This still resolves "generate", which `lanesFor` no longer offers. That
 * asymmetry is deliberate and TEMPORARY. Photoreal generation writes plain
 * image attachments stamped `source: "ai-image"`, and the panel that lets you
 * iterate on them is the generate lane. Deleting this branch before generation
 * writes a DESIGN DOCUMENT would drop every such image into the upload lane,
 * where it can be published but never iterated on — a regression to a shipped
 * feature, for content created minutes earlier.
 *
 * The branch goes when the backend makes photoreal generation produce a design
 * document (Phase 1b). At that point generated images arrive with a `designRef`
 * and resolve as "design" on the line above, legacy ones fall through to
 * "upload" as decided, and `MediaLane` narrows to two values for good.
 */
export function resolveMediaLane({ designRef, attachments, source }: ResolveLaneArgs): MediaLane | null {
    if (designRef?.revisionId) return "design";
    if (attachments.length > 0) return source === "ai-image" ? "generate" : "upload";
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
    if (lane === "generate") return spec.multi ? "Discard generated slides" : "Discard generated image";
    if (spec.multi) return "Remove all slides";
    return spec.kind === "video" ? "Remove video" : "Remove image";
}
