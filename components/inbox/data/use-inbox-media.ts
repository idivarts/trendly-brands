/**
 * Live backend implementation of the Media-tab data contract.
 *
 * The media list is realtime: the background worker pulls published posts/reels
 * from Meta and upserts them to Firestore (brands/{brandId}/inboxMedia), which
 * this hook streams via onSnapshot — so items appear live as they load instead
 * of blocking on a slow multi-account Graph fetch. Triggering a refresh just
 * kicks the worker:
 *   GET    /brands/:brandId/inbox/media                 (queue refresh → Firestore)
 *
 * Per-media comments + comment actions stay on-demand (a single Graph call each):
 *   GET    /brands/:brandId/inbox/media/:mediaId/comments?socialId=&channel=
 *   POST   /brands/:brandId/inbox/comments/:commentId/reply
 *   POST   /brands/:brandId/inbox/comments/:commentId/hide
 *   DELETE /brands/:brandId/inbox/comments/:commentId?socialId=&channel=
 */
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
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

    // Fire-and-forget trigger for the background media refresh worker. Results
    // stream back in through the Firestore listener below.
    const refresh = useCallback(async () => {
        if (!brandId) return;
        try {
            await HttpWrapper.fetch(`/api/v2/brands/${brandId}/inbox/media`);
        } catch (e) {
            console.warn("inbox media: refresh trigger failed", e);
        }
    }, [brandId]);

    useEffect(() => {
        if (!brandId) {
            setMedia([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        let settled = false;

        const unsub = onSnapshot(
            collection(FirestoreDB, "brands", brandId, "inboxMedia"),
            (snap) => {
                const items = snap.docs.map((d) => d.data() as InboxMedia);
                items.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
                setMedia(items);
                if (!settled) {
                    settled = true;
                    setLoading(false);
                    // Cold cache → kick a refresh; rows stream in via this listener.
                    if (snap.empty) refresh();
                }
            },
            (e) => {
                console.warn("inbox media: snapshot failed", e);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [brandId, refresh]);

    const loadComments = useCallback(
        async (m: InboxMedia): Promise<InboxMediaComment[]> => {
            if (!brandId) return [];
            return fetchMediaComments(brandId, m);
        },
        [brandId]
    );

    // Re-fetch one media item (image + comment/like counts). The refreshed doc
    // arrives via the Firestore listener above.
    const resyncMedia = useCallback(
        async (m: InboxMedia) => {
            if (!brandId) return;
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/inbox/media/${m.id}/resync?socialId=${encodeURIComponent(
                        m.socialId
                    )}&channel=${encodeURIComponent(m.channel)}`,
                    { method: "POST" }
                );
            } catch (e) {
                console.warn("inbox media: resync failed", e);
            }
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
        refresh,
        resyncMedia,
    };
}
