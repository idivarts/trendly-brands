import { ContentType } from "@/components/content-calendar/types";

/**
 * Per-content-type media rules. Drives the Media Stage UI: what can be uploaded
 * or generated, single vs. multi (carousel), the target aspect ratio(s), and
 * whether a script editor is shown.
 *
 * `aspectRatios[0]` is the canonical ratio used for AI generation requests and
 * for the upload validation introduced in Phase 2.
 */
export interface MediaSpec {
    /** "none" → no media area (Live is script-only). */
    kind: "image" | "video" | "none";
    /** Carousel allows multiple ordered assets; everything else is single. */
    multi: boolean;
    /** Human-readable ratio hint shown on the stage (e.g. "9:16", "1:1 or 4:5"). */
    aspectLabel: string;
    /** Accepted ratios; first entry is the canonical one for generation. */
    aspectRatios: string[];
    /**
     * Allowed width/height ratio range for uploads. Out-of-range assets are
     * blocked (Phase 2). A small tolerance is baked in so near-perfect crops
     * aren't falsely rejected. Undefined ⇒ no aspect constraint.
     */
    aspectRange?: { min: number; max: number };
    /** Whether AI image generation is offered for this type. */
    canGenerate: boolean;
    /** Whether a (script) editor is shown for this type. */
    hasScript: boolean;
}

// Portrait 9:16 ≈ 0.5625; allow 0.50–0.65.
const PORTRAIT_9_16 = { min: 0.5, max: 0.65 };
// 4:5 (0.8) → 1:1 (1.0); allow 0.78–1.02.
const SQUARE_TO_45 = { min: 0.78, max: 1.02 };

export const MEDIA_SPEC: Record<ContentType, MediaSpec> = {
    reel: {
        kind: "video",
        multi: false,
        aspectLabel: "9:16",
        aspectRatios: ["9:16"],
        aspectRange: PORTRAIT_9_16,
        canGenerate: false, // reel videos are produced externally and uploaded
        hasScript: true,
    },
    post: {
        kind: "image",
        multi: false,
        aspectLabel: "1:1 or 4:5",
        aspectRatios: ["1:1", "4:5"],
        aspectRange: SQUARE_TO_45,
        canGenerate: true,
        hasScript: false,
    },
    carousel: {
        kind: "image",
        multi: true,
        aspectLabel: "1:1 or 4:5",
        aspectRatios: ["1:1", "4:5"],
        aspectRange: SQUARE_TO_45,
        canGenerate: true,
        hasScript: false,
    },
    story: {
        kind: "image",
        multi: false,
        aspectLabel: "9:16",
        aspectRatios: ["9:16"],
        aspectRange: PORTRAIT_9_16,
        canGenerate: true,
        hasScript: false,
    },
    live: {
        kind: "none",
        multi: false,
        aspectLabel: "",
        aspectRatios: [],
        canGenerate: false,
        hasScript: true,
    },
};

/** Closest common label for a measured ratio, for friendly error messages. */
function ratioLabel(width: number, height: number): string {
    const r = width / height;
    const known: [string, number][] = [
        ["9:16", 0.5625],
        ["4:5", 0.8],
        ["1:1", 1.0],
        ["4:3", 1.333],
        ["16:9", 1.777],
    ];
    let best = known[0];
    for (const k of known) {
        if (Math.abs(k[1] - r) < Math.abs(best[1] - r)) best = k;
    }
    return `${best[0]} (${width}×${height})`;
}

/**
 * Returns an error message if the asset's aspect ratio is outside the allowed
 * range for the content type, or null if it's acceptable (or unmeasurable).
 */
export function aspectError(
    type: ContentType,
    width?: number,
    height?: number
): string | null {
    const spec = MEDIA_SPEC[type];
    if (!spec.aspectRange || !width || !height) return null;
    const r = width / height;
    if (r < spec.aspectRange.min || r > spec.aspectRange.max) {
        return `That ${spec.kind} is ${ratioLabel(width, height)}. ${type[0].toUpperCase() + type.slice(1)} needs ${spec.aspectLabel}. Please use a ${spec.aspectLabel} asset.`;
    }
    return null;
}
