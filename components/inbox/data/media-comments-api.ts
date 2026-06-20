/**
 * Shared per-media comment data layer (single source of truth).
 *
 * Pure async helpers over the brand-scoped inbox media API — no React. Used by
 * both the Inbox Media tab (`useInboxMedia`) and the Content details page's
 * post-performance section, so the comment fetch/reply/hide/delete logic lives
 * in exactly one place:
 *   GET    /brands/:brandId/inbox/media/:mediaId/comments?socialId=&channel=
 *   POST   /brands/:brandId/inbox/comments/:commentId/reply
 *   POST   /brands/:brandId/inbox/comments/:commentId/hide
 *   DELETE /brands/:brandId/inbox/comments/:commentId?socialId=&channel=
 *
 * Comments are read on demand from the Graph API (never bulk-stored).
 */
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { InboxMedia, InboxMediaComment } from "../types";

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Top-level comments for a single piece of media. */
export async function fetchMediaComments(
    brandId: string,
    m: InboxMedia
): Promise<InboxMediaComment[]> {
    const qs = `socialId=${encodeURIComponent(m.socialId)}&channel=${m.channel}`;
    try {
        const res = await HttpWrapper.fetch(
            `/api/v2/brands/${brandId}/inbox/media/${encodeURIComponent(m.id)}/comments?${qs}`
        );
        const data = await res.json();
        return data.comments ?? [];
    } catch (e) {
        console.warn("inbox media: failed to load comments", e);
        return [];
    }
}

/** Post a public reply to a comment. */
export async function replyToMediaComment(
    brandId: string,
    m: InboxMedia,
    commentId: string,
    text: string
): Promise<void> {
    await HttpWrapper.fetch(
        `/api/v2/brands/${brandId}/inbox/comments/${encodeURIComponent(commentId)}/reply`,
        {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ socialId: m.socialId, channel: m.channel, text }),
        }
    );
}

/** Hide or unhide a comment on the platform. */
export async function setMediaCommentHidden(
    brandId: string,
    m: InboxMedia,
    commentId: string,
    hidden: boolean
): Promise<void> {
    await HttpWrapper.fetch(
        `/api/v2/brands/${brandId}/inbox/comments/${encodeURIComponent(commentId)}/hide`,
        {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ socialId: m.socialId, channel: m.channel, hidden }),
        }
    );
}

/** Permanently delete a comment. */
export async function deleteMediaComment(
    brandId: string,
    m: InboxMedia,
    commentId: string
): Promise<void> {
    const qs = `socialId=${encodeURIComponent(m.socialId)}&channel=${m.channel}`;
    await HttpWrapper.fetch(
        `/api/v2/brands/${brandId}/inbox/comments/${encodeURIComponent(commentId)}?${qs}`,
        { method: "DELETE" }
    );
}
