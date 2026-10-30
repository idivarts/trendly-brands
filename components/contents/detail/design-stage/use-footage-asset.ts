/**
 * use-footage-asset — the library row behind a footage clip, live.
 *
 * Read straight from Firestore rather than through the library endpoint, for
 * one reason that matters here and nowhere else: INGEST FINISHES WHILE YOU ARE
 * LOOKING AT IT. A video is measured and frame-sampled by the render worker and
 * then transcribed and described by the backend, which takes a minute or two
 * after the upload — so a listener turns "Reading this video…" into a
 * transcript and a shot list without the user reloading anything.
 *
 * The derived-row caveat that makes the endpoint the right source for the
 * library grid does not apply: a clip's `assetId` is always a stored row,
 * because only a stored row can have the trim points and the transcript that
 * put it on a timeline in the first place.
 */
import { useBrandContext } from "@/contexts/brand-context.provider";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useFootageAsset(assetId?: string): { asset: IAsset | null; loading: boolean } {
    const { selectedBrand } = useBrandContext();
    const brandId = selectedBrand?.id;

    const [asset, setAsset] = useState<IAsset | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!brandId || !assetId) {
            setAsset(null);
            return;
        }
        setLoading(true);
        const unsub = onSnapshot(
            doc(FirestoreDB, "brands", brandId, "assets", assetId),
            (snap) => {
                // The document's own `id` is spread first and then overwritten
                // by the ref's: the stored field is absent on a row written by
                // the backend (it carries `firestore:"-"`), and when present it
                // is a copy that can be stale.
                setAsset(snap.exists() ? ({ ...(snap.data() as IAsset), id: snap.id }) : null);
                setLoading(false);
            },
            () => {
                // A clip placed from a URL with no library row is normal — the
                // footage still trims and renders, it just has nothing to say
                // about itself.
                setAsset(null);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [brandId, assetId]);

    return { asset, loading };
}
