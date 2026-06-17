import {
    CONTENT_FORMAT_LABELS,
    ContentFormat,
} from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import Colors from "@/shared-uis/constants/Colors";

/**
 * UI alias for the canonical {@link ContentFormat} enum (the single source of
 * truth lives in shared-libs/.../constants/content-format.ts). Kept as a named
 * export so the many existing `ContentType` import sites keep working.
 */
export type ContentType = ContentFormat;

export interface CalendarItem {
    id: string;
    title: string;
    idea: string;
    date: string; // ISO date YYYY-MM-DD
    type: ContentType;
    /** Cached comment count — incremented on the content doc when a comment is added */
    commentCount?: number;
}

export type CalendarView = "week" | "month";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = CONTENT_FORMAT_LABELS;

/** Theme-aware accent color for a content type, sourced from the central palette. */
export function contentTypeColor(
    type: ContentType,
    colors: ReturnType<typeof Colors>
): string {
    switch (type) {
        case "reel":
            return colors.typeReel;
        case "post":
            return colors.typePost;
        case "story":
            return colors.typeStory;
        case "carousel":
            return colors.typeCarousel;
        case "live":
            return colors.typeLive;
        case "text":
            return colors.typeText;
        case "video":
            return colors.typeVideo;
        default:
            return colors.primary;
    }
}
