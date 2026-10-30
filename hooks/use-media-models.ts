/**
 * use-media-models — what the generative-media registry says is available.
 *
 * `mediaModels/{modelId}` is a top-level collection the app may READ and never
 * write, and the reason it is read at all is that the composer must offer only
 * the controls a chosen model actually supports: an end-frame slot on a model
 * without keyframes is a control that takes the user's money and ignores them.
 *
 * ⚠️ `enabled` is a REVIEW GATE, not a feature flag. The catalog sync inserts
 * newly published models with `enabled: false` and never flips it, so a model
 * nobody has looked at cannot start spending money. An empty list is therefore
 * the NORMAL state for a workspace where nothing has been enabled yet — it
 * means "not available to you", not "something is broken", and the composer
 * says so rather than offering a send button that 400s.
 */
import { IMediaModel } from "@/shared-libs/firestore/trendly-pro/models/media-model";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export interface UseMediaModelsReturn {
    models: IMediaModel[];
    loading: boolean;
}

/**
 * Enabled models of one kind, cheapest first.
 *
 * Cheapest first because the first entry is what the composer preselects, and
 * a generation is charged on acceptance — defaulting to the dearest model would
 * spend someone's tokens on a choice they never made. Models with no estimate
 * sort last: an unknown price is not a low one.
 */
export function useMediaModels(kind: "video" | "image"): UseMediaModelsReturn {
    const [rows, setRows] = useState<IMediaModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(FirestoreDB, "mediaModels"),
            where("kind", "==", kind),
            where("enabled", "==", true)
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                setRows(snap.docs.map((d) => ({ ...(d.data() as IMediaModel), id: d.id })));
                setLoading(false);
            },
            () => {
                setRows([]);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [kind]);

    const models = useMemo(() => {
        const price = (m: IMediaModel) =>
            m.estUsdPerSecond || m.estUsdPerCall || Number.MAX_SAFE_INTEGER;
        return [...rows].sort((a, b) => price(a) - price(b));
    }, [rows]);

    return { models, loading };
}

/**
 * The lengths a model will actually make, as the composer's chips.
 *
 * Read from the model rather than from a fixed list, because asking for 30s
 * from a model that caps at 8 is refused — and a control offering a value that
 * is always rejected is worse than one that offers three that work.
 */
export function durationOptionsFor(model: IMediaModel | undefined): string[] {
    if (!model) return [];
    const min = model.minDurationS && model.minDurationS > 0 ? model.minDurationS : 1;
    const max = model.maxDurationS && model.maxDurationS > 0 ? model.maxDurationS : min;
    const out: string[] = [];
    for (const secs of [4, 5, 6, 8, 10, 15, 20, 30]) {
        if (secs >= min && secs <= max) out.push(`${secs}s`);
    }
    // A model with a single supported length still needs one chip, or the
    // request goes out with no duration at all.
    if (!out.length) out.push(`${min}s`);
    return out;
}

/** "8s" → 8. The composer stores the label; the API takes seconds. */
export function secondsOf(label: string | undefined): number {
    const n = Number.parseInt(String(label ?? "").replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}
