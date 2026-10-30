/**
 * use-asset-library — the brand's media, read from the one endpoint that knows
 * what it all is.
 *
 * `GET /api/v2/brands/{brandId}/assets` is deliberately the only source here,
 * rather than a Firestore listener on the collection. The endpoint returns the
 * stored rows UNIONED with a derived view of every content attachment, so a
 * brand that has never uploaded through the library still sees everything it
 * has ever attached. Subscribing to `brands/{id}/assets` directly would show
 * the stored half and present it as the whole library.
 *
 * The cost of that choice is that the list does not live-update, which is why
 * `reload` is part of the public shape and why every writer here calls it.
 *
 * ── recordAsset is NOT a hook ───────────────────────────────────────────────
 * Uploads happen in three places (the media stage, the composer's reference
 * tray, the timeline's add-clip), none of which wants to mount a list it is not
 * showing. So filing an upload is a plain function and the hook uses it too.
 * It is also the call that starts ingest on a video — the backend queues the
 * probe/frame-sample job when a new video row is created — so skipping it does
 * not just miss a library row, it loses the transcript and the shot list.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    AssetKind,
    AssetSource,
    IAsset,
} from "@/shared-libs/firestore/trendly-pro/models/asset";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** "all" is the panel's default tab; the rest map to the endpoint's filter. */
export type AssetTab = "all" | AssetSource;

export interface RecordAssetInput {
    kind: AssetKind;
    url: string;
    thumbUrl?: string;
    posterUrl?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    durationMs?: number;
    alt?: string;
    title?: string;
    /** Where it was first used, so the library can say "from <post>". */
    originContentId?: string;
}

/**
 * File an uploaded asset in the library. Returns its id, or null.
 *
 * Deliberately swallows its failure. The user's upload has already landed and
 * is already on their content; losing the library row costs them the ability to
 * reuse it elsewhere, which is not worth failing the upload they asked for.
 * The one visible consequence is that a video whose record failed never gets
 * ingested, so it has no transcript — the footage still trims and plays.
 *
 * Provenance (`hotlink`, `noAiInput`, `attribution`) is not sent and would be
 * ignored: an upload has none by definition, and the backend refuses those
 * fields from a client so nobody can mark someone else's licensed photo freely
 * usable.
 */
export async function recordAsset(
    brandId: string | undefined,
    input: RecordAssetInput
): Promise<string | null> {
    if (!brandId || !input.url) return null;
    try {
        const res = await HttpWrapper.fetch(`/api/v2/brands/${brandId}/assets`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => null);
        return (data?.id as string) ?? null;
    } catch {
        return null;
    }
}

interface Options {
    /** Narrow the grid to what the caller can actually use. */
    kinds?: AssetKind[];
    /** Hold the fetch until the panel is open — this is a modal's data. */
    enabled?: boolean;
}

export interface UseAssetLibraryReturn {
    assets: IAsset[];
    loading: boolean;
    error: string | null;
    tab: AssetTab;
    setTab: (tab: AssetTab) => void;
    reload: () => void;
    /** Drop a stored row. Derived rows have nothing to drop. */
    remove: (asset: IAsset) => Promise<void>;
}

export function useAssetLibrary(options: Options = {}): UseAssetLibraryReturn {
    const { kinds, enabled = true } = options;
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [rows, setRows] = useState<IAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<AssetTab>("all");
    const [nonce, setNonce] = useState(0);

    // A tab switch starts a second request while the first is still in flight,
    // and the slower one must not paint over the newer one.
    const latest = useRef(0);

    useEffect(() => {
        if (!enabled || !brandId) return;
        const seq = ++latest.current;
        setLoading(true);
        setError(null);
        const qs = tab === "all" ? "" : `?source=${tab}`;
        HttpWrapper.fetch(`/api/v2/brands/${brandId}/assets${qs}`)
            .then((res) => res.json())
            .then((data) => {
                if (seq !== latest.current) return;
                setRows(Array.isArray(data?.assets) ? (data.assets as IAsset[]) : []);
            })
            .catch(() => {
                if (seq !== latest.current) return;
                setRows([]);
                setError("We couldn't load your media. Check your connection and try again.");
            })
            .finally(() => {
                if (seq === latest.current) setLoading(false);
            });
    }, [brandId, tab, enabled, nonce]);

    const reload = useCallback(() => setNonce((n) => n + 1), []);

    const assets = useMemo(() => {
        if (!kinds?.length) return rows;
        return rows.filter((a) => kinds.includes(a.kind));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, kinds?.join(",")]);

    const remove = useCallback(
        async (asset: IAsset) => {
            // A derived row is a content attachment seen through the library.
            // There is no document to delete, and the endpoint would 400 on an
            // id it never issued — so it is dropped locally and nothing else.
            if (!brandId || asset.derived) {
                setRows((cur) => cur.filter((a) => a.id !== asset.id));
                return;
            }
            setRows((cur) => cur.filter((a) => a.id !== asset.id));
            try {
                await HttpWrapper.fetch(`/api/v2/brands/${brandId}/assets/${asset.id}`, {
                    method: "DELETE",
                });
            } catch {
                // Put it back rather than leave the grid lying about what exists.
                setError("We couldn't remove that. Please try again.");
                reload();
            }
        },
        [brandId, reload]
    );

    return { assets, loading, error, tab, setTab, reload, remove };
}
