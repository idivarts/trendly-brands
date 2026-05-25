import type { ChatMessage, FocusItem } from "@/components/shared/AIChatPanel";

export type { ChatMessage, FocusItem };

export type ScreenState = 'empty' | 'collecting' | 'strategy-ready';

export type ReviewStatus = "draft" | "in_review" | "approved" | "changes_requested";

export interface ContentStrategy {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    chatMessages: ChatMessage[];
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
