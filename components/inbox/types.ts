/**
 * Inbox feature — data contract.
 *
 * These types are the seam between the UI and its data source. They are
 * fulfilled by the live backend hook (`data/use-inbox.api`). The UI imports
 * ONLY from here and from `data/use-inbox`.
 *
 * See components/inbox/README.md for the backend contract.
 */

/**
 * Channels that can appear in the Inbox.
 *  - DM (Messages tab):   instagram, facebook, twitter, reddit (LinkedIn has NO
 *    messaging API, so it never produces DM threads).
 *  - Comments (Media tab): instagram, facebook, linkedin_page (Company Page —
 *    NOT personal linkedin), twitter, reddit.
 * The UI is channel-agnostic; which channels actually appear is driven by the
 * conversations/media the backend returns per connected account.
 */
export type InboxChannel = "instagram" | "facebook" | "linkedin_page" | "twitter" | "reddit";

/** A conversation is either a private DM thread or a public comment thread. */
export type ConversationKind = "dm" | "comment";

/** Quick filters shown above the conversation list. */
export type InboxFilter = "all" | "unread" | "dm" | "comment";

/** Top-level inbox section: the conversation feed vs. the media browser. */
export type InboxMode = "messages" | "media";

/** Who authored a given message/reply. */
export type MessageAuthor = "contact" | "business";

/** Coarse kind of a message's media attachment. */
export type AttachmentType =
    | "image"
    | "video"
    | "audio"
    | "file"
    | "share"
    | "story";

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
    /** Direct URL of a single media attachment (image/video/audio/file). */
    attachmentUrl?: string;
    /** Coarse media kind — drives how the attachment is rendered. */
    attachmentType?: AttachmentType;
    /** Preview/thumbnail image for video attachments. */
    attachmentThumbUrl?: string;
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
     * epoch ms of the last time the brand viewed this conversation. The
     * per-conversation new-message count is the inbound items with sentAt >
     * lastSeenAt. Baselined to lastActivityAt on first sync (history starts
     * read) and bumped on read/reply. Absent/0 ⇒ never seen.
     */
    lastSeenAt?: number;
    /** epoch ms — bumps on any (re)sync; drives the resync spinner clear. */
    updatedAt?: number;

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
 * Number of NEW inbound items in a conversation — the bubble count. Counts
 * contact-authored DM messages / comment replies (and the original comment for
 * comment threads) with sentAt > lastSeenAt. Business-authored items never count.
 * 0 ⇒ nothing new (no bubble).
 */
export function conversationUnreadCount(c: InboxConversation): number {
    const seen = c.lastSeenAt ?? 0;
    if (c.kind === "dm") {
        return (c.messages ?? []).filter(
            (m) => m.author === "contact" && m.sentAt > seen
        ).length;
    }
    let n = 0;
    if (c.comment) {
        if (c.comment.authoredAt > seen) n += 1;
        n += c.comment.replies.filter(
            (r) => r.author === "contact" && r.sentAt > seen
        ).length;
    }
    return n;
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
    /** Look for new conversations/messages (pull-to-refresh / refresh button). Additive. */
    refreshInbox: () => Promise<void>;
    /**
     * Dev/repair only: clear cached DM conversations and re-pull them fresh from
     * Meta (rebuilds participant names/avatars, drops stale/duplicate docs).
     */
    resyncInbox: () => Promise<void>;
    /** Re-fetch one conversation contact's name/avatar (e.g. expired avatar). */
    resyncProfile: (conversationId: string) => Promise<void>;
    /** Re-pull a whole DM thread's messages. */
    resyncThread: (conversationId: string) => Promise<void>;
    /** Re-fetch one message (e.g. an expired attachment URL). */
    resyncMessage: (conversationId: string, messageId: string) => Promise<void>;
}

// ── Media tab ──────────────────────────────────────────────────────────────
//
// The Media tab browses published posts/reels and their comments on demand
// (read straight from the Graph API), so historical comments never flood the
// conversation feed. Conversations stay the "needs attention" layer; Media is
// the browse-by-post layer.

/** A published post/reel surfaced in the Media tab. */
export interface InboxMedia {
    id: string;
    channel: InboxChannel;
    /** Serving connected-account id — required for comment actions. */
    socialId: string;
    thumbnailUrl?: string;
    caption?: string;
    permalink?: string;
    /** epoch ms */
    timestamp: number;
    commentsCount: number;
    likeCount?: number;
    /** epoch ms — bumps when the item is (re)synced; drives the resync spinner. */
    updatedAt?: number;
}

/** A top-level comment on a piece of media. */
export interface InboxMediaComment {
    id: string;
    channel: InboxChannel;
    author: InboxParticipant;
    text: string;
    /** epoch ms (0 when the platform did not supply one). */
    timestamp: number;
    /** Local-only flag toggled optimistically by hide/unhide. */
    hidden?: boolean;
}

/**
 * Media-tab data contract. Posts/reels are listed up front; a post's comments
 * are fetched lazily on selection. Comment actions are keyed by comment id and
 * carry the owning media so the backend can resolve the serving account.
 */
export interface UseInboxMediaResult {
    loading: boolean;
    media: InboxMedia[];
    /** Fetch the top-level comments for one media item. */
    loadComments: (media: InboxMedia) => Promise<InboxMediaComment[]>;
    /** Post a public reply to a comment. */
    replyToComment: (media: InboxMedia, commentId: string, text: string) => Promise<void>;
    /** Hide or unhide a comment. */
    setCommentHidden: (media: InboxMedia, commentId: string, hidden: boolean) => Promise<void>;
    /** Permanently delete a comment. */
    deleteComment: (media: InboxMedia, commentId: string) => Promise<void>;
    /** Re-fetch the media list. */
    refresh: () => void;
    /** Re-fetch one media item (image + comment/like counts). */
    resyncMedia: (media: InboxMedia) => Promise<void>;
}
