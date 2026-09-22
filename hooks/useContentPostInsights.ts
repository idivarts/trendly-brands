/**
 * Fetches basic analytics for a single published post (one media id on one
 * connected account). Reuses the brand analytics endpoint family — the Content
 * details page calls this once a content is Posted.
 */
import { useCallback, useEffect, useState } from "react";

import { useBrandContext } from "@/contexts/brand-context.provider";
import { InboxChannel } from "@/components/inbox/types";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { IPostAnalytics } from "@/types/PostInsights";

export function useContentPostInsights(
    mediaId: string | undefined,
    socialId: string | undefined,
    // Any inbox channel — post-level insights are richest for Meta; non-Meta
    // channels return whatever the backend can derive (often just the permalink).
    channel: InboxChannel
) {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [data, setData] = useState<IPostAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!brandId) return;
        // Without the serving account we can't resolve a token → no analytics.
        // Surface it instead of silently showing the generic "couldn't load".
        if (!mediaId || !socialId) {
            setData(null);
            setError("Analytics unavailable — this post isn't linked to a connected account.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const qs = `socialId=${encodeURIComponent(socialId)}&channel=${channel}`;
            const res = await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/analytics/media/${encodeURIComponent(mediaId)}?${qs}`
            );
            setData((await res.json()) as IPostAnalytics);
        } catch (e) {
            // Always surface a real reason — extractErrorMessage can itself throw
            // on some error shapes, which previously left both data + error null
            // and showed the unhelpful generic "couldn't load" fallback.
            let msg: string | null | undefined;
            try {
                msg = await HttpWrapper.extractErrorMessage(e);
            } catch {
                /* ignore */
            }
            setError(msg || "Failed to load post analytics");
        } finally {
            setLoading(false);
        }
    }, [brandId, mediaId, socialId, channel]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload: load };
}
