import { useBrandContext } from "@/contexts/brand-context.provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { IViralityScore } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { track } from "@/shared-libs/utils/analytics";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useCallback, useEffect, useRef, useState } from "react";
import { displayBand } from "@/components/contents/detail/virality";

/** Why scoring is unavailable. `null` means it is available. */
export type ScoreGate = "tokens_exhausted" | "plan_locked" | null;

interface ScoreArgs {
    contextId: string;
    /** Live editor state. Falls back to the saved doc server-side when empty. */
    script: string;
    format?: string;
    platforms?: string[];
    model?: string;
}

/**
 * Scores the script against the virality rubric.
 *
 * HTTP, not the websocket: five judge calls run concurrently server-side and
 * come back as one object, so there is nothing to stream.
 *
 * `initial` is the score already on the content doc. Scoring costs five model
 * calls, so the panel opens on the stored one and only re-scores when asked —
 * a panel that scored on mount would bill the user for looking.
 */
export function useViralityScore(initial?: IViralityScore) {
    const { selectedBrand } = useBrandContext();
    const { tokens } = useEntitlements();

    const [score, setScore] = useState<IViralityScore | undefined>(initial);
    const [loading, setLoading] = useState(false);
    const [gate, setGate] = useState<ScoreGate>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * The band on screen, steadied against the one before it.
     *
     * This lives here rather than being derived in the panel because the
     * "previous" it compares against has to be the band that was DISPLAYED,
     * not the one the last score carried. The backend persists each score, so
     * the stored band arrives back through Firestore moments later — deriving
     * from that would hand the hysteresis the new raw band as its own history
     * and flip a held band one render after holding it.
     */
    const [band, setBand] = useState(() =>
        initial ? displayBand(initial.overall, undefined) : ""
    );
    const bandRef = useRef(band);
    const applyScore = useCallback((next: IViralityScore) => {
        const shown = displayBand(next.overall, bandRef.current || undefined);
        bandRef.current = shown;
        setBand(shown);
        setScore(next);
    }, []);

    /**
     * The content doc arrives after the first render, so a piece that has been
     * scored before would otherwise show the empty state for good: `useState`
     * keeps the `undefined` it was initialised with. Only fills a gap — a score
     * taken in this session is never overwritten by the stored one.
     */
    const hasLocalScore = useRef(false);
    useEffect(() => {
        if (hasLocalScore.current || !initial) return;
        applyScore(initial);
    }, [initial, applyScore]);

    /**
     * The script text the current score was taken on, so the panel can say the
     * score is stale rather than quietly describing a script that has since
     * been rewritten. Only meaningful within the session: a score loaded from
     * the doc has no record of what it was scored on, which is why the panel
     * also shows when it was taken.
     */
    const scoredOn = useRef<string | null>(null);

    const run = useCallback(
        async (args: ScoreArgs) => {
            const brandId = selectedBrand?.id;
            if (!brandId || loading) return;

            // Pre-empt, don't punish: the backend also gates this, but letting
            // the request go out only to 402 spends the user's time to tell
            // them something we already knew.
            if (tokens.state === "exhausted") {
                setGate("tokens_exhausted");
                track("entitlement_blocked", {
                    reason: "tokens_exhausted",
                    feature: "virality_score",
                });
                return;
            }

            setLoading(true);
            setError(null);
            setGate(null);
            const startedAt = Date.now();
            track("ai_generation_requested", { kind: "virality_score", model: args.model });
            try {
                const res = await HttpWrapper.fetch(`/api/ai/content/score`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brandId, ...args }),
                });
                const data = await res.json();
                const next = data?.score as IViralityScore | undefined;
                if (!next) throw new Error("No score returned");
                hasLocalScore.current = true;
                applyScore(next);
                scoredOn.current = args.script;
                track("ai_generation_completed", {
                    kind: "virality_score",
                    model: args.model,
                    duration_ms: Date.now() - startedAt,
                    success: true,
                    // The band, not the integer: it is the stable part, and the
                    // only one worth comparing across pieces.
                    band: next.band,
                    overall: next.overall,
                });
            } catch (e: any) {
                track("ai_generation_completed", {
                    kind: "virality_score",
                    model: args.model,
                    duration_ms: Date.now() - startedAt,
                    success: false,
                });
                if (e?.status === 402) {
                    // The backend distinguishes an empty wallet from a plan that
                    // unlocks no model for this task; the panel says different
                    // things about them, so the reason has to survive.
                    //
                    // Read it off `HttpError.data`, not `response.json()` — the
                    // wrapper has already drained the body, so re-reading the
                    // stream throws and every gate would read as a plan lock.
                    const reason: ScoreGate =
                        e?.data?.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked";
                    setGate(reason);
                    track("entitlement_blocked", { reason, feature: "virality_score" });
                } else {
                    setError(
                        (await HttpWrapper.extractErrorMessage(e)) ??
                        "Could not score this script. Try again."
                    );
                }
            } finally {
                setLoading(false);
            }
        },
        [selectedBrand?.id, loading, tokens.state, applyScore]
    );

    /** True when the script has changed since the score on screen was taken. */
    const isStaleFor = useCallback(
        (script: string) => scoredOn.current !== null && scoredOn.current !== script,
        []
    );

    return { score, band, loading, gate, error, run, isStaleFor };
}
