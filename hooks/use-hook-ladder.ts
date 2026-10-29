import { useBrandContext } from "@/contexts/brand-context.provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { ScoreGate } from "@/hooks/use-virality-score";
import { track } from "@/shared-libs/utils/analytics";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useCallback, useState } from "react";

/** One candidate opening, scored against the Hook dimension of the rubric. */
export interface HookCandidate {
    text: string;
    /** The pattern it plays, in the model's words — "Specific Number", … */
    archetype?: string;
    /** On-screen text, when it should differ from the spoken line. */
    onScreen?: string;
    score: number;
    notes?: string[];
    problems?: { id: string; severity: "warn" | "cap" | "fatal"; message: string }[];
}

interface LadderArgs {
    contextId: string;
    script: string;
    title?: string;
    topic?: string;
    format?: string;
    platforms?: string[];
    model?: string;
}

/**
 * Five opening hooks for the script, ranked.
 *
 * Nothing is persisted: these are candidates to choose between, and the one
 * the user picks becomes part of the script through the editor like any other
 * edit. Re-asking is cheap and always gives a different five, so there is
 * nothing here worth keeping between visits.
 */
export function useHookLadder() {
    const { selectedBrand } = useBrandContext();
    const { tokens } = useEntitlements();

    const [hooks, setHooks] = useState<HookCandidate[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [gate, setGate] = useState<ScoreGate>(null);
    const [error, setError] = useState<string | null>(null);
    /** Set when the hooks came back but the ranking leg failed. */
    const [unranked, setUnranked] = useState(false);

    const run = useCallback(
        async (args: LadderArgs) => {
            const brandId = selectedBrand?.id;
            if (!brandId || loading) return;

            if (tokens.state === "exhausted") {
                setGate("tokens_exhausted");
                track("entitlement_blocked", { reason: "tokens_exhausted", feature: "hook_ladder" });
                return;
            }

            setLoading(true);
            setError(null);
            setGate(null);
            setUnranked(false);
            const startedAt = Date.now();
            track("ai_generation_requested", { kind: "hooks", model: args.model });
            try {
                const res = await HttpWrapper.fetch(`/api/ai/content/hooks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brandId, ...args }),
                });
                const data = await res.json();
                const list = (data?.ladder?.hooks ?? []) as HookCandidate[];
                if (list.length === 0) throw new Error("No hooks returned");
                setHooks(list);
                // A ranking failure still returns the hooks. They are the useful
                // part, so the card shows them and says the order is arbitrary
                // rather than implying a ranking that was never computed.
                setUnranked(Boolean(data?.warning));
                track("ai_generation_completed", {
                    kind: "hooks",
                    model: args.model,
                    duration_ms: Date.now() - startedAt,
                    success: true,
                });
            } catch (e: any) {
                track("ai_generation_completed", {
                    kind: "hooks",
                    model: args.model,
                    duration_ms: Date.now() - startedAt,
                    success: false,
                });
                if (e?.status === 402) {
                    const reason: ScoreGate =
                        e?.data?.reason === "tokens_exhausted" ? "tokens_exhausted" : "plan_locked";
                    setGate(reason);
                    track("entitlement_blocked", { reason, feature: "hook_ladder" });
                } else {
                    setError(
                        (await HttpWrapper.extractErrorMessage(e)) ??
                        "Could not write hooks for this script. Try again."
                    );
                }
            } finally {
                setLoading(false);
            }
        },
        [selectedBrand?.id, loading, tokens.state]
    );

    return { hooks, unranked, loading, gate, error, run };
}
