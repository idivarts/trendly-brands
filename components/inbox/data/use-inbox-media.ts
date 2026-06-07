/**
 * Live backend implementation of the Media-tab data contract.
 *
 * Talks to the brand-scoped inbox media API (functions/trendly_v2 → /api/v2):
 *   GET    /brands/:brandId/inbox/media
 *   GET    /brands/:brandId/inbox/media/:mediaId/comments?socialId=&channel=
 *   POST   /brands/:brandId/inbox/comments/:commentId/reply
 *   POST   /brands/:brandId/inbox/comments/:commentId/hide
 *   DELETE /brands/:brandId/inbox/comments/:commentId?socialId=&channel=
 *
 * Unlike conversations, media + comments are read on demand (not cached in
 * Firestore), so there is no instant-paint layer here.
 */
import { useCallback, useEffect, useState } from "react";

import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { InboxMedia, InboxMediaComment, UseInboxMediaResult } from "../types";

const JSON_HEADERS = { "Content-Type": "application/json" };

export function useInboxMedia(): UseInboxMediaResult {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [loading, setLoading] = useState(true);
    const [media, setMedia] = useState<InboxMedia[]>([]);

    const fetchMedia = useCallback(async () => {
        if (!brandId) {
            setMedia([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await HttpWrapper.fetch(`/api/v2/brands/${brandId}/inbox/media`);
            const data = await res.json();
            setMedia(data.media ?? []);
        } catch (e) {
            console.warn("inbox media: failed to load media", e);
        } finally {
            setLoading(false);
        }
    }, [brandId]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const loadComments = useCallback(
        async (m: InboxMedia): Promise<InboxMediaComment[]> => {
            if (!brandId) return [];
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
        },
        [brandId]
    );

    const replyToComment = useCallback(
        async (m: InboxMedia, commentId: string, text: string) => {
            if (!brandId) return;
            await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/inbox/comments/${encodeURIComponent(commentId)}/reply`,
                {
                    method: "POST",
                    headers: JSON_HEADERS,
                    body: JSON.stringify({ socialId: m.socialId, channel: m.channel, text }),
                }
            );
        },
        [brandId]
    );

    const setCommentHidden = useCallback(
        async (m: InboxMedia, commentId: string, hidden: boolean) => {
            if (!brandId) return;
            await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/inbox/comments/${encodeURIComponent(commentId)}/hide`,
                {
                    method: "POST",
                    headers: JSON_HEADERS,
                    body: JSON.stringify({ socialId: m.socialId, channel: m.channel, hidden }),
                }
            );
        },
        [brandId]
    );

    const deleteComment = useCallback(
        async (m: InboxMedia, commentId: string) => {
            if (!brandId) return;
            const qs = `socialId=${encodeURIComponent(m.socialId)}&channel=${m.channel}`;
            await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/inbox/comments/${encodeURIComponent(commentId)}?${qs}`,
                { method: "DELETE" }
            );
        },
        [brandId]
    );

    return {
        loading,
        media,
        loadComments,
        replyToComment,
        setCommentHidden,
        deleteComment,
        refresh: fetchMedia,
    };
}
