import { CalendarItem } from "@/components/content-calendar/types";

export type ContentStatus = "draft" | "review_pending" | "approved";

export interface ContentItem extends CalendarItem {
    status: ContentStatus;
    caption?: string;
    hashtags?: string;
    timeOfPosting?: string; // "HH:MM"
    script?: string;
    imagePrompt?: string;
    isArchived: boolean;
    createdAt: string;
}

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
    draft: "Draft",
    review_pending: "Review Pending",
    approved: "Approved",
};

export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
    draft: "#8B8B8B",
    review_pending: "#E07A00",
    approved: "#1A7A3A",
};

export const POPULAR_POSTING_TIMES = [
    { label: "7:00 AM", value: "07:00" },
    { label: "12:00 PM", value: "12:00" },
    { label: "5:00 PM", value: "17:00" },
    { label: "7:30 PM", value: "19:30" },
    { label: "9:00 PM", value: "21:00" },
];
