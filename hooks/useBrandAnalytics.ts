import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { AnalyticsRange, IAnalyticsOverview } from "@/types/Analytics";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

// Overview is recomputed asynchronously (the all-accounts Meta fan-out is too
// slow for a 30s request), so the dashboard subscribes to the result in
// Firestore (brands/{brandId}/analyticsOverview/{range}) and triggers a refresh
// when the cached doc is missing or stale.
const STALE_AFTER_SECONDS = 5 * 60;

/**
 * Streams unified analytics for the selected brand + range from Firestore, and
 * kicks the background worker to rebuild it when stale. Updates live as the
 * worker writes.
 */
export const useBrandAnalytics = (range: AnalyticsRange) => {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [data, setData] = useState<IAnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Trigger a background rebuild of this range's overview.
    const reload = useCallback(async () => {
        if (!brandId) return;
        try {
            await HttpWrapper.fetch(
                `/api/v2/brands/${brandId}/analytics/overview?range=${range}`
            );
        } catch (e) {
            setError(
                (await HttpWrapper.extractErrorMessage(e)) ?? "Failed to refresh analytics"
            );
        }
    }, [brandId, range]);

    // Recompute a single page's (account's) insights; the overview doc updates
    // live via the subscription above.
    const resyncAccount = useCallback(
        async (socialId: string) => {
            if (!brandId) return;
            try {
                await HttpWrapper.fetch(
                    `/api/v2/brands/${brandId}/analytics/accounts/${socialId}/resync?range=${range}`,
                    { method: "POST" }
                );
            } catch (e) {
                console.warn("analytics: account resync failed", e);
            }
        },
        [brandId, range]
    );

    useEffect(() => {
        if (!brandId) {
            setData(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        let settled = false;

        const ref = doc(FirestoreDB, "brands", brandId, "analyticsOverview", range);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                const d = snap.exists() ? (snap.data() as { payload?: string; generatedAt?: number }) : null;
                if (d?.payload) {
                    try {
                        setData(JSON.parse(d.payload) as IAnalyticsOverview);
                    } catch (e) {
                        console.warn("analytics: bad overview payload", e);
                    }
                }
                if (!settled) {
                    settled = true;
                    setLoading(false);
                    // Rebuild if there's no cached doc or it's gone stale.
                    const ageSec = d?.generatedAt ? Date.now() / 1000 - d.generatedAt : Infinity;
                    if (ageSec > STALE_AFTER_SECONDS) reload();
                }
            },
            (e) => {
                console.warn("analytics: overview snapshot failed", e);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [brandId, range, reload]);

    return { data, loading, error, reload, resyncAccount, brandId };
};
