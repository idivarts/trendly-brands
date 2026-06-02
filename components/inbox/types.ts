/**
 * Inbox feature — data contract.
 *
 * These types are the seam between the UI and its data source. They are
 * intentionally backend-agnostic: today they are fulfilled by the mock layer
 * (`components/inbox/mock`), tomorrow by a real backend hook. The UI imports
 * ONLY from here and from `data/use-inbox`, never from `mock/` directly.
 *
 * See components/inbox/README.md for how to swap the mock for the real backend.
 */

/** Channels supported by the Inbox v1 (Meta only). */
export type InboxChannel = "instagram" | "facebook";

/** A conversation is either a private DM thread or a public comment thread. */
export type ConversationKind = "dm" | "comment";

/** Quick filters shown above the conversation list. */
export type InboxFilter = "all" | "unread" | "dm" | "comment";

/** Who authored a given message/reply. */
export type MessageAuthor = "contact" | "business";

export interface InboxParticipant {
    /** Platform-scoped user id (IGSID / PSID). */
    id: string;
    name: string;
    /** @handle without the leading "@" (instagram) or page-scoped name (facebook). */
    handle?: string;
    avatarUrl?: string;
}

export interface InboxMessage {
    id: string;
    author: MessageAuthor;
    text: string;
    /** epoch ms */
    sentAt: number;
    /** Optional single media attachment (image url). */
    attachmentUrl?: string;
    /** Optimistic-send flag — true while a reply is in flight. */
    pending?: boolean;
}

/** The post a comment is attached to (comment conversations only). */
export interface CommentPostRef {
    postId: string;
    thumbnailUrl?: string;
    caption?: string;
}

/** Extra context shown in the right-hand contact panel. */
export interface InboxContactContext {
    followerCount?: number;
    bio?: string;
    location?: string;
    /** True if this contact maps to a Trendly influencer record. */
    isTrendlyInfluencer?: boolean;
    /** Linked influencer id for the "View in CRM" deep-link, if any. */
    linkedInfluencerId?: string;
}

export interface InboxConversation {
    id: string;
    kind: ConversationKind;
    channel: InboxChannel;
    participant: InboxParticipant;

    /** One-line preview used in the list. */
    preview: string;
    /** epoch ms of the most recent activity — list sort key. */
    lastActivityAt: number;
    unread: boolean;

    /**
     * DM-only: epoch ms when the 24h reply window closes. When `Date.now()`
     * is past this, the composer is disabled. `undefined` => no time limit
     * (always true for comments).
     */
    replyWindowExpiresAt?: number;

    /** DM payload — present when kind === "dm". */
    messages?: InboxMessage[];

    /** Comment payload — present when kind === "comment". */
    post?: CommentPostRef;
    comment?: {
        /** The original public comment text from the contact. */
        text: string;
        authoredAt: number;
        /** Whether the comment is currently hidden on the platform. */
        hidden: boolean;
        /** Public replies in the thread (business + others). */
        replies: InboxMessage[];
    };

    contact?: InboxContactContext;
}

export interface ConnectedInboxAccount {
    id: string;
    channel: InboxChannel;
    name: string;
    handle: string;
    avatarUrl?: string;
}

/**
 * The Inbox data contract. The real backend hook must satisfy this exact
 * shape so the UI is unaffected by the swap. All actions are async to allow
 * a network round-trip.
 */
export interface UseInboxResult {
    loading: boolean;
    /** Socials connected to this brand that the inbox can serve. */
    connectedAccounts: ConnectedInboxAccount[];
    conversations: InboxConversation[];

    /** Send a DM reply / post a public comment reply. */
    sendReply: (conversationId: string, text: string) => Promise<void>;
    /** Hide or unhide a public comment. */
    setCommentHidden: (conversationId: string, hidden: boolean) => Promise<void>;
    /** Permanently delete a public comment. */
    deleteComment: (conversationId: string) => Promise<void>;
    /** Mark a conversation as read. */
    markRead: (conversationId: string) => Promise<void>;
}
