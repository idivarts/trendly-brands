import { InfluencerInviteUnit } from "@/components/discover/discover-types";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useCallback, useEffect, useState } from "react";

interface UseInvitedInfluencersProps {
    collaborationId: string;
    limit?: number;
}

const DEFAULT_LIMIT = 16;

const useInvitedInfluencers = ({
    collaborationId,
    limit = DEFAULT_LIMIT,
}: UseInvitedInfluencersProps) => {
    const { selectedBrand } = useBrandContext();
    const selectedBrandId = selectedBrand?.id;
    const [influencers, setInfluencers] = useState<InfluencerInviteUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [nextAvailable, setNextAvailable] = useState(false);
    const [filter, setFilter] = useState<string | undefined>(undefined);

    const fetchPage = useCallback(
        async (pageNumber: number, reset = false) => {
            if (!selectedBrandId) return;
            const brandId = selectedBrandId;
            setLoading(true);
            try {
                const url = `/discovery/brands/${brandId}/collaborations/${collaborationId}/influencers`;

                const offset = (pageNumber < 1 ? 1 : pageNumber - 1) * limit;
                const bodyPayload: { offset: number; limit: number; filter?: string } = {
                    offset,
                    limit,
                };
                if (filter !== undefined) {
                    bodyPayload.filter = filter;
                }
                console.debug("useInvitedInfluencers: request body", bodyPayload);
                const res = await HttpWrapper.fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(bodyPayload),
                });
                const body = await res.json();
                const newItems = (body?.influencers || []) as InfluencerInviteUnit[];

                // #region agent log
                try {
                    const summary = newItems.map((u: InfluencerInviteUnit, i: number) => ({
                        i,
                        id: u?.id,
                        hasProfilePic: !!u?.profile_pic,
                        followerCount: u?.follower_count,
                        viewsCount: u?.views_count,
                        engagementCount: u?.engagement_count,
                        engagementRate: u?.engagement_rate,
                    }));
                    fetch("http://127.0.0.1:7635/ingest/35d7f708-ae10-4154-b612-6c5217b8dac1", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d1a82d" },
                        body: JSON.stringify({
                            sessionId: "d1a82d",
                            location: "use-invited-influencers.tsx:fetchPage",
                            message: "invited influencers API response",
                            data: { pageNumber, count: newItems.length, perItem: summary },
                            timestamp: Date.now(),
                            hypothesisId: "H1",
                        }),
                    }).catch(() => { });
                } catch (_) { }
                // #endregion

                // Enrich invited influencers missing discovery stats (profile pic + counts).
                // We already have an endpoint used elsewhere for influencer details.
                const needsEnrichment = newItems.filter((u) => {
                    const noPic = !u.profile_pic;
                    const zeros =
                        (u.follower_count ?? 0) === 0 &&
                        (u.views_count ?? 0) === 0 &&
                        (u.engagement_count ?? 0) === 0;
                    return noPic && zeros;
                });

                if (needsEnrichment.length > 0) {
                    const toEnrich = needsEnrichment.slice(0, 10); // cap to avoid heavy fanout
                    // #region agent log
                    fetch("http://127.0.0.1:7635/ingest/35d7f708-ae10-4154-b612-6c5217b8dac1", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d1a82d" },
                        body: JSON.stringify({
                            sessionId: "d1a82d",
                            location: "use-invited-influencers.tsx:enrich",
                            message: "enrichment candidates",
                            data: { count: needsEnrichment.length, enriching: toEnrich.map((u) => u.id) },
                            timestamp: Date.now(),
                            hypothesisId: "H4",
                        }),
                    }).catch(() => { });
                    // #endregion

                    const enriched = await Promise.all(
                        toEnrich.map(async (u) => {
                            try {
                                const detailUrl = `/discovery/brands/${brandId}/influencers/${u.id}`;
                                const detailRes = await HttpWrapper.fetch(detailUrl, {
                                    method: "GET",
                                    headers: {
                                        "content-type": "application/json",
                                    },
                                }).then((r) => r.json());

                                const social = detailRes?.social ?? null;
                                const patched: Partial<InfluencerInviteUnit> = social
                                    ? {
                                        name: social?.name ?? u.name,
                                        username: social?.username ?? u.username,
                                        profile_pic: social?.profile_pic ?? u.profile_pic,
                                        follower_count: social?.follower_count ?? u.follower_count,
                                        views_count: social?.views_count ?? u.views_count,
                                        engagement_count: social?.engagement_count ?? u.engagement_count,
                                        engagement_rate: social?.engagement_rate ?? u.engagement_rate,
                                    }
                                    : {};

                                // #region agent log
                                fetch("http://127.0.0.1:7635/ingest/35d7f708-ae10-4154-b612-6c5217b8dac1", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d1a82d" },
                                    body: JSON.stringify({
                                        sessionId: "d1a82d",
                                        location: "use-invited-influencers.tsx:enrich",
                                        message: "enriched influencer",
                                        data: {
                                            id: u.id,
                                            hadSocial: !!social,
                                            before: {
                                                profile_pic: u.profile_pic,
                                                follower_count: u.follower_count,
                                                views_count: u.views_count,
                                                engagement_count: u.engagement_count,
                                                engagement_rate: u.engagement_rate,
                                            },
                                            after: patched,
                                        },
                                        timestamp: Date.now(),
                                        hypothesisId: "H4",
                                    }),
                                }).catch(() => { });
                                // #endregion

                                return { id: u.id, patched };
                            } catch (e: any) {
                                // #region agent log
                                fetch("http://127.0.0.1:7635/ingest/35d7f708-ae10-4154-b612-6c5217b8dac1", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d1a82d" },
                                    body: JSON.stringify({
                                        sessionId: "d1a82d",
                                        location: "use-invited-influencers.tsx:enrich",
                                        message: "enrichment failed",
                                        data: { id: u.id, error: e?.message ?? String(e) },
                                        timestamp: Date.now(),
                                        hypothesisId: "H4",
                                    }),
                                }).catch(() => { });
                                // #endregion
                                return { id: u.id, patched: {} as Partial<InfluencerInviteUnit> };
                            }
                        })
                    );

                    // apply patches onto newItems (and existing ones if needed)
                    const patchMap = new Map(enriched.map((e) => [e.id, e.patched]));
                    for (let i = 0; i < newItems.length; i++) {
                        const patch = patchMap.get(newItems[i].id);
                        if (patch && Object.keys(patch).length > 0) {
                            newItems[i] = { ...newItems[i], ...patch };
                        }
                    }
                }

                setInfluencers((prev) => {
                    if (reset) return newItems;
                    const seen = new Set(prev.map((p) => p.id));
                    const merged = [...prev];
                    newItems.forEach((n) => {
                        if (!seen.has(n.id)) {
                            seen.add(n.id);
                            merged.push(n);
                        }
                    });
                    return merged;
                });

                setNextAvailable(newItems.length >= limit);
            } catch (e: any) {
                console.warn("Failed to fetch invited influencers", e);
                let message = "Failed to fetch invited members";
                try {
                    if (e instanceof Response) {
                        const contentType = e.headers.get("content-type") || "";
                        if (contentType.includes("application/json")) {
                            const errBody = await e.json();
                            message = errBody?.message || JSON.stringify(errBody) || message;
                            console.debug("useInvitedInfluencers: server response", errBody);
                        } else {
                            const txt = await e.text();
                            message = txt || message;
                            console.debug("useInvitedInfluencers: server response text", txt);
                        }
                    } else if (e?.json) {
                        const errBody = await e.json();
                        message = errBody?.message || message;
                        console.debug("useInvitedInfluencers: server response", errBody);
                    } else if (e?.message) {
                        message = e.message;
                    }
                } catch (_err) { }
                Toaster.error(message);
            } finally {
                setLoading(false);
            }
        },
        [selectedBrandId, collaborationId, filter, limit]
    );

    useEffect(() => {
        // initial load
        setPage(1);
        fetchPage(1, true);
    }, [selectedBrandId, collaborationId, filter, fetchPage]);

    const loadMore = useCallback(() => {
        if (!nextAvailable || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage);
    }, [page, nextAvailable, loading, fetchPage]);

    const refresh = useCallback(() => {
        setPage(1);
        fetchPage(1, true);
    }, [fetchPage]);

    const setStatusFilter = (f?: string) => {
        setFilter(f || undefined);
    };

    return {
        influencers,
        loading,
        refresh,
        loadMore,
        nextAvailable,
        setStatusFilter,
    };
};

export default useInvitedInfluencers;
