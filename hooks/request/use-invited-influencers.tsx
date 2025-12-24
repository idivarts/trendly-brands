import { InfluencerInviteUnit } from "@/components/discover/DiscoverInfluencer";
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
    const [influencers, setInfluencers] = useState<InfluencerInviteUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [nextAvailable, setNextAvailable] = useState(false);
    const [filter, setFilter] = useState<string | undefined>(undefined);

    const fetchPage = useCallback(
        async (pageNumber: number, reset = false) => {
            if (!selectedBrand) return;
            const brandId = selectedBrand.id;
            setLoading(true);
            try {
                const url = `/discovery/brands/${brandId}/collaborations/${collaborationId}/influencers`;

                const normalizedOffset = pageNumber < 1 ? 1 : pageNumber;
                const bodyPayload: {
                    Offset: number;
                    Limit: number;
                    Filter?: string;
                    offset: number;
                    limit: number;
                    filter?: string;
                } = {
                    Offset: normalizedOffset,
                    Limit: limit,
                    offset: normalizedOffset,
                    limit,
                };
                if (filter !== undefined) {
                    bodyPayload.Filter = filter;
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
        [selectedBrand, collaborationId, filter, limit]
    );

    useEffect(() => {
        // initial load
        setPage(1);
        fetchPage(1, true);
    }, [selectedBrand, collaborationId, filter]);

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
