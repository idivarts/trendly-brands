/**
 * Display logic for the virality score.
 *
 * Kept out of the component so the two decisions that are easy to get wrong —
 * which band to show, and how much precision to claim — are pure and testable.
 *
 * Nothing here holds a rubric weight or a dimension score. Those come from the
 * backend (`virality_score.go` owns the rubric); a second copy would drift, and
 * the panel would then disagree with the number it was handed.
 */

/**
 * The score's measured precision, in points, over repeated runs of the same
 * script at a pinned judge model.
 *
 * Measured on dev, not assumed: a script with a clear verdict repeats within
 * about 3 points, while one sitting near a band boundary moved 10 across five
 * runs — the variance concentrated in the Share and Action criteria, where the
 * judge is genuinely undecided. The panel shows this rather than an integer
 * alone, because a user who edits nothing, re-scores, and sees 83 then 92 is
 * right to stop believing the panel, and would take the fixes with it.
 */
export const SCORE_PRECISION = 5;

/** Roughly what one score costs, for the pre-emptive cost line. */
export const SCORE_TOKEN_COST = 12_000;

/**
 * Band thresholds, mirroring `bandFor` in the backend. They are here because
 * the hysteresis below has to know where the boundaries are; the band the
 * backend sends is still the one we start from.
 */
export const BANDS: { min: number; label: string }[] = [
    { min: 0, label: "Rework" },
    { min: 40, label: "Weak" },
    { min: 60, label: "Publishable" },
    { min: 75, label: "Strong" },
    { min: 90, label: "Exceptional" },
];

/**
 * How far past a boundary the score has to move before the band changes.
 *
 * Without this, a script parked at 89–91 crosses Strong → Exceptional → Strong
 * on re-scores the user did not earn with an edit, and a band flip reads as a
 * verdict changing its mind — far worse than the number moving, because the
 * band is the thing we tell them to trust.
 */
const BAND_STICKINESS = 3;

/** The band `overall` falls in, ignoring history. */
export function rawBand(overall: number): string {
    let label = BANDS[0].label;
    for (const b of BANDS) if (overall >= b.min) label = b.label;
    return label;
}

/**
 * The band to show, holding the previous one when the score has only just
 * crossed a boundary.
 *
 * Only adjacent bands are sticky. A score that jumps two bands has moved for a
 * real reason, and holding the old one would be a lie rather than a steadying.
 */
export function displayBand(overall: number, previous?: string): string {
    const raw = rawBand(overall);
    if (!previous || previous === raw) return raw;

    const prevIdx = BANDS.findIndex((b) => b.label === previous);
    const rawIdx = BANDS.findIndex((b) => b.label === raw);
    if (prevIdx < 0 || rawIdx < 0) return raw;
    if (Math.abs(prevIdx - rawIdx) !== 1) return raw;

    if (rawIdx > prevIdx) {
        // Moved up: hold until it clears the new band's floor by the margin.
        return overall < BANDS[rawIdx].min + BAND_STICKINESS ? previous : raw;
    }
    // Moved down: hold until it falls clear of the band it is leaving.
    return overall >= BANDS[prevIdx].min - BAND_STICKINESS ? previous : raw;
}

export type BandTone = "danger" | "warn" | "neutral" | "good";

/** Colour family for a band. Mapped to tokens in the component. */
export function bandTone(band: string): BandTone {
    switch (band) {
        case "Rework":
            return "danger";
        case "Weak":
            return "warn";
        case "Publishable":
            return "neutral";
        default:
            return "good";
    }
}

/**
 * What the band means, in the terms the user is deciding in: publish it, or
 * work on it. Deliberately free of numbers — the band exists because the
 * number is the part that wobbles.
 */
export function bandMeaning(band: string): string {
    switch (band) {
        case "Rework":
            return "This would be published and not seen. The hook is where to start.";
        case "Weak":
            return "People will scroll past it. Worth another pass before it goes out.";
        case "Publishable":
            return "Solid enough to publish. The fixes below are what would lift it.";
        case "Strong":
            return "Does the things that get a piece distributed.";
        case "Exceptional":
            return "Hits every mark that can be checked before publishing.";
        default:
            return "";
    }
}

/**
 * What each dimension is actually asking. The labels and weights come from the
 * backend; this is only the plain-language gloss, so a user can tell why Share
 * is being judged separately from Action.
 */
export function dimensionMeaning(key: string): string {
    switch (key) {
        case "hook":
            return "Whether the first seconds earn the next ones.";
        case "body":
            return "Whether the middle keeps what the hook promised.";
        case "action":
            return "Whether it asks for one thing, clearly.";
        case "share":
            return "Whether anyone would pass it on — the one signal every platform ranks on.";
        case "fit":
            return "Whether it suits the platform and the format it is going to.";
        default:
            return "";
    }
}

/** A tone for a 0–100 dimension score, so a weak segment reads as weak. */
export function dimensionTone(score: number): BandTone {
    if (score < 40) return "danger";
    if (score < 60) return "warn";
    if (score < 80) return "neutral";
    return "good";
}

/**
 * The instruction sent to the AI chat for one fix. Phrased as a request about
 * the script rather than a rubric reference — the chat has the script, not the
 * rubric, and "improve criterion S3" means nothing to it.
 */
export function fixInstruction(message: string): string {
    return `Revise the script to address this: ${message}`;
}

/** The instruction for the deterministic problems, which are concrete. */
export function repairInstruction(messages: string[]): string {
    if (messages.length === 1) return `Fix this in the script: ${messages[0]}`;
    return [
        "Fix these in the script, and change nothing else:",
        ...messages.map((m) => `- ${m}`),
    ].join("\n");
}
