import Colors from "@/shared-uis/constants/Colors";

export type ContentType =
    | "reel"
    | "post"
    | "story"
    | "carousel"
    | "live"
    | "text";

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

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    reel: "Reel",
    post: "Post",
    story: "Story",
    carousel: "Carousel",
    live: "Live",
    text: "Text Post",
};

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
        default:
            return colors.primary;
    }
}
