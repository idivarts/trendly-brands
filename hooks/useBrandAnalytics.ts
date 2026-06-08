import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { AnalyticsRange, IAnalyticsOverview } from "@/types/Analytics";
import { useCallback, useEffect, useState } from "react";

/**
 * Fetches unified analytics for the selected brand across all connected
 * accounts. Re-fetches whenever the brand or range changes. The backend serves
 * a short-TTL cache, so repeated calls are cheap.
 */
export const useBrandAnalytics = (range: AnalyticsRange) => {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [data, setData] = useState<IAnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!brandId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/analytics/overview?range=${range}`
            );
            const json = (await res.json()) as IAnalyticsOverview;
            setData(json);
        } catch (e) {
            setError((await HttpWrapper.extractErrorMessage(e)) ?? "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [brandId, range]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, loading, error, reload: load, brandId };
};
