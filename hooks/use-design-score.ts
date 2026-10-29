import { useBrandContext } from "@/contexts/brand-context.provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { ScoreGate } from "@/hooks/use-virality-score";
import { IViralityScore } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { track } from "@/shared-libs/utils/analytics";
import { aiWS } from "@/utils/ai-ws";
import { useCallback, useEffect, useRef, useState } from "react";
import { displayBand, isUsableScore } from "@/components/contents/detail/virality";

/**
 * Scores the content's current design.
 *
 * Over the websocket rather than HTTP, and not by choice: scoring a design
 * means rendering it first, and render-plus-vision runs past the 29-second API
 * Gateway timeout. The renderer is also only reachable from the websocket
 * lambda. See design_score_ws.go.
 */
export function useDesignScore(stored?: IViralityScore) {
    const { selectedBrand } = useBrandContext();
    const { tokens } = useEntitlements();

    const initial = isUsableScore(stored) ? stored : undefined;
    const [score, setScore] = useState<IViralityScore | undefined>(initial);
    const [band, setBand] = useState(() =>
        initial ? displayBand(initial.overall, undefined) : ""
    );
    const [loading, setLoading] = useState(false);
    const [gate, setGate] = useState<ScoreGate>(null);
    const [error, setError] = useState<string | null>(null);

    const bandRef = useRef(band);
    const activeRef = useRef(false);
    const startedAtRef = useRef(0);

    const apply = useCallback((next: IViralityScore) => {
        // Steadied against the band last DISPLAYED, for the same reason the
        // script panel is: the number moves by a few points between identical
        // runs and a verdict that appears to change its mind is worse.
        const shown = displayBand(next.overall, bandRef.current || undefined);
        bandRef.current = shown;
        setBand(shown);
        setScore(next);
    }, []);

    // A score taken in this session is never overwritten by the stored one;
    // this only fills the gap before the content doc has loaded.
    const hasLocal = useRef(false);
    useEffect(() => {
        if (hasLocal.current || !initial) return;
        apply(initial);
    }, [initial, apply]);

    useEffect(() => {
        const remove = aiWS.addListener((msg: any) => {
            if (!activeRef.current) return;
            if (msg.type === "design_score" && msg.score) {
                activeRef.current = false;
                setLoading(false);
                hasLocal.current = true;
                apply(msg.score as IViralityScore);
                track("ai_generation_completed", {
                    kind: "design_score",
                    duration_ms: Date.now() - startedAtRef.current,
                    success: true,
                    band: msg.score.band,
                    overall: msg.score.overall,
                });
                return;
            }
            if (msg.type === "upgrade_required") {
                activeRef.current = false;
                setLoading(false);
                const reason: ScoreGate =
                    msg.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked";
                setGate(reason);
                track("entitlement_blocked", { reason, feature: "design_score" });
                return;
            }
            if (msg.type === "error") {
                activeRef.current = false;
                setLoading(false);
                setError(msg.message || "Could not score this design. Try again.");
                track("ai_generation_completed", { kind: "design_score", success: false });
            }
        });
        return remove;
    }, [apply]);

    const run = useCallback(
        async (contentId: string) => {
            const brandId = selectedBrand?.id;
            if (!brandId || !contentId || loading) return;

            // Pre-empt, don't punish: the backend gates this too, but letting
            // the request go out only to be refused spends the user's time to
            // tell them something we already knew.
            if (tokens.state === "exhausted") {
                setGate("tokens_exhausted");
                track("entitlement_blocked", { reason: "tokens_exhausted", feature: "design_score" });
                return;
            }

            setLoading(true);
            setError(null);
            setGate(null);
            activeRef.current = true;
            startedAtRef.current = Date.now();
            track("ai_generation_requested", { kind: "design_score" });
            await aiWS.send({
                type: "content_gen",
                task: "design_score",
                brandId,
                payload: { brandId, contextId: contentId },
            });
        },
        [selectedBrand?.id, loading, tokens.state]
    );

    return { score, band, loading, gate, error, run };
}
