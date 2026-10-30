/**
 * media-model-options — the pure reads over a registry row.
 *
 * Split from `use-media-models` because these are the parts worth testing and
 * that hook cannot be imported in a test: it opens a Firestore listener at
 * module load. The rules below are the ones a 422 teaches you, so they are
 * exactly the rules that should be pinned.
 */
import { IMediaModel } from "@/shared-libs/firestore/trendly-pro/models/media-model";

/**
 * The lengths a model will actually make, as the composer's chips.
 *
 * Read from the model rather than from a fixed list, because asking for 30s
 * from a model that caps at 8 is refused — and a control offering a value that
 * is always rejected is worse than one that offers three that work.
 */
export function durationOptionsFor(model: IMediaModel | undefined): string[] {
    if (!model) return [];

    // An exact set wins over the bounds. Veo takes 4, 6 or 8 seconds and
    // refuses 5 with a 422 — a range of 4-8 cannot say that, and deriving the
    // chips from it offered a length the provider rejected every time.
    if (model.durationsS?.length) {
        return [...model.durationsS]
            .filter((s) => s > 0)
            .sort((a, b) => a - b)
            .map((s) => `${s}s`);
    }

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
