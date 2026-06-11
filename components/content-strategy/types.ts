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
    // Native single-writer lock (Phase 3). Fresh = someone is editing on a
    // device; web yields to it. Stale (heartbeat past EDIT_LOCK_TTL_MS) = free.
    editLock?: {
        managerId: string;
        name: string;
        heartbeatAt: number;
    } | null;
    // CRDT bootstrap flag (web co-editing). A server-side rewrite (AI action) or
    // a native editor finishing clears this; the editor watches it to know the
    // body was replaced out-of-band and must re-read from scratch.
    crdtInitialized?: boolean;
    // Monotonic generation — bumped on every wholesale rewrite (AI / native
    // release). The web editor binds yupdates to the generation it observed at
    // mount, so any leftover old-gen updates are ignored instead of clobbering
    // the freshly-seeded HTML.
    crdtGeneration?: number;
}
