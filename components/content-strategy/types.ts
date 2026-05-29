import type { ChatMessage, FocusItem } from "@/components/shared/AIChatPanel";

export type { ChatMessage, FocusItem };

export type ScreenState = 'empty' | 'loading' | 'collecting' | 'strategy-ready';

export type ReviewStatus = "draft" | "in_review" | "approved" | "changes_requested";

export interface ContentStrategy {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    chatMessages: ChatMessage[];
    // Campaign window length (days) fixed at strategy creation. Used to
    // pre-fill the calendar from a chosen start date through to the end.
    durationDays?: number;
    // Collaboration
    collaboratorIds: string[];
    lastEditedBy?: string;
    lastEditedAt?: number;
    // Review flow
    reviewStatus: ReviewStatus;
    reviewRequestedBy?: string;
    reviewRequestedAt?: number;
    reviewedBy?: string;
    reviewedAt?: number;
}
