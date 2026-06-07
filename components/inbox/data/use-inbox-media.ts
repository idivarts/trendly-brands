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
import {
    deleteMediaComment,
    fetchMediaComments,
    replyToMediaComment,
    setMediaCommentHidden,
} from "./media-comments-api";

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
            return fetchMediaComments(brandId, m);
        },
        [brandId]
    );

    const replyToComment = useCallback(
        async (m: InboxMedia, commentId: string, text: string) => {
            if (!brandId) return;
            await replyToMediaComment(brandId, m, commentId, text);
        },
        [brandId]
    );

    const setCommentHidden = useCallback(
        async (m: InboxMedia, commentId: string, hidden: boolean) => {
            if (!brandId) return;
            await setMediaCommentHidden(brandId, m, commentId, hidden);
        },
        [brandId]
    );

    const deleteComment = useCallback(
        async (m: InboxMedia, commentId: string) => {
            if (!brandId) return;
            await deleteMediaComment(brandId, m, commentId);
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
