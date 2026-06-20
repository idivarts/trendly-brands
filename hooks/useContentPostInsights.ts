/**
 * Fetches basic analytics for a single published post (one media id on one
 * connected account). Reuses the brand analytics endpoint family — the Content
 * details page calls this once a content is Posted.
 */
import { useCallback, useEffect, useState } from "react";

import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { IPostAnalytics } from "@/types/PostInsights";

export function useContentPostInsights(
    mediaId: string | undefined,
    socialId: string | undefined,
    channel: "instagram" | "facebook"
) {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [data, setData] = useState<IPostAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!brandId || !mediaId || !socialId) return;
        setLoading(true);
        setError(null);
        try {
            const qs = `socialId=${encodeURIComponent(socialId)}&channel=${channel}`;
            const res = await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/analytics/media/${encodeURIComponent(mediaId)}?${qs}`
            );
            setData((await res.json()) as IPostAnalytics);
        } catch (e) {
            setError((await HttpWrapper.extractErrorMessage(e)) ?? "Failed to load post analytics");
        } finally {
            setLoading(false);
        }
    }, [brandId, mediaId, socialId, channel]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload: load };
}
