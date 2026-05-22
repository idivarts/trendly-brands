export type ContentType = "reel" | "post" | "story" | "carousel" | "live";

export interface CalendarItem {
    id: string;
    title: string;
    idea: string;
    date: string; // ISO date YYYY-MM-DD
    type: ContentType;
}

export type CalendarView = "week" | "month";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    reel: "Reel",
    post: "Post",
    story: "Story",
    carousel: "Carousel",
    live: "Live",
};
