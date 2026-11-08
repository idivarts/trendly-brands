/**
 * The media rows a studio's scenes point at.
 *
 * A scene names its media by id, which is what makes the same photo in four
 * scenes one library row rather than four copies of a URL. The cost is that
 * nothing can be drawn until the ids are resolved, so this keeps a cache of
 * every row the studio touches and tops it up as scenes change.
 *
 * ⚠️ It reads the LIBRARY endpoint rather than the Firestore collection. The
 * collection is readable, but the endpoint also unions in the derived view of
 * old content attachments — so a studio built on a photo from a post made last
 * year still resolves, with no migration.
 */
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseStudioMediaResult {
    media: Record<string, IAsset>;
    /** The pickable library, for the media picker. */
    library: IAsset[];
    loadingLibrary: boolean;
    refreshLibrary: () => Promise<void>;
}

export function useStudioMedia(
    brandId: string | undefined,
    scenes: IStudioScene[]
): UseStudioMediaResult {
    const [media, setMedia] = useState<Record<string, IAsset>>({});
    const [library, setLibrary] = useState<IAsset[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);

    /** Ids already fetched or in flight, so a re-render does not refetch. */
    const known = useRef<Set<string>>(new Set());

    const refreshLibrary = useCallback(async () => {
        if (!brandId) return;
        setLoadingLibrary(true);
        try {
            const res = await HttpWrapper.fetch(`/api/v2/brands/${brandId}/media?limit=120`);
            const json = (await res.json()) as { media?: IAsset[] };
            const rows = json.media ?? [];
            setLibrary(rows);
            // Fold the library into the cache: most of what a studio points at
            // is in it, so this resolves nearly everything in one call.
            setMedia((prev) => {
                const next = { ...prev };
                for (const a of rows) {
                    next[a.id] = a;
                    known.current.add(a.id);
                }
                return next;
            });
        } catch {
            // An unreachable library is not an unreachable studio: scenes
            // still draw from whatever is already cached, and a layer whose
            // media is unresolved draws as a labelled hole.
        } finally {
            setLoadingLibrary(false);
        }
    }, [brandId]);

    useEffect(() => {
        void refreshLibrary();
    }, [refreshLibrary]);

    /** Every id the current scenes reference. */
    const wanted = useMemo(() => {
        const ids = new Set<string>();
        for (const s of scenes) {
            for (const id of s.mediaIds ?? []) ids.add(id);
            for (const l of s.layers ?? []) if (l.mediaId) ids.add(l.mediaId);
            if (s.narration?.mediaId) ids.add(s.narration.mediaId);
        }
        return [...ids];
    }, [scenes]);

    // Anything the library read did not cover — a frame extracted a second
    // ago, a clip that has just landed — triggers ONE library refresh rather
    // than a fetch per id. The missing rows are always the newest ones, so a
    // refresh picks up the whole tail in a single call; a per-id loop would
    // make N requests to learn what one already says.
    const refreshing = useRef(false);
    useEffect(() => {
        if (!brandId || refreshing.current) return;
        const missing = wanted.filter((id) => !known.current.has(id));
        if (!missing.length) return;
        refreshing.current = true;
        void refreshLibrary().finally(() => {
            // Mark them known either way. A row that genuinely does not exist
            // — media archived out from under a scene — must not re-trigger a
            // refresh on every render; the layer draws as a labelled hole,
            // which is the honest rendering of a missing asset.
            missing.forEach((id) => known.current.add(id));
            refreshing.current = false;
        });
    }, [brandId, wanted, refreshLibrary]);

    return { media, library, loadingLibrary, refreshLibrary };
}
