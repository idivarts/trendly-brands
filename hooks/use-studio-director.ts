/**
 * The AI director: plan, read, approve.
 *
 * ── Why the plan is stored and not just returned ────────────────────────────
 * A person reads a storyboard, thinks about it, and approves it — possibly on
 * another device. So planning returns a RUN ID, and approval refers to it. A
 * plan that lived only in a response would have to be re-planned, which costs
 * money and produces a different plan.
 *
 * ── The three answers this has to tell apart ───────────────────────────────
 *  200 + a storyboard     a plan you can approve
 *  422 + problems         a plan that cannot run, and why
 *  402 + a reason         money: a top-up or a tier
 *
 * The middle one is the interesting case, and it is not an error. The planner
 * tried, the validator refused, and the problems are the useful part — a brief
 * that asked for something the rules forbid is something the user needs to read,
 * not a failure to retry.
 */
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { StudioState } from "@/utils/studio-api";
import { useCallback, useState } from "react";

export type DirectorMode = "economy" | "balanced" | "cinematic";

export interface RunProblem {
    field: string;
    message: string;
    fatal: boolean;
}

export interface DirectorPlan {
    runId: string;
    status: string;
    storyboard: string;
    problems: RunProblem[];
    estCostUsd: number;
}

export interface UseStudioDirectorResult {
    planning: boolean;
    approving: boolean;
    plan: DirectorPlan | null;
    /** Money refusals only. A refused PLAN is in `plan.problems`. */
    blocked: "tokens_exhausted" | "plan_locked" | null;
    error: string | null;
    /** True when the plan came back unrunnable, so no Approve button is shown. */
    refused: boolean;

    makePlan: (input: { brief: string; mode: DirectorMode; targetSeconds?: number }) => Promise<void>;
    approve: () => Promise<boolean>;
    reset: () => void;
}

export function useStudioDirector(
    brandId: string | undefined,
    contentId: string | undefined,
    studioId: string | undefined,
    onState: (state: StudioState) => void
): UseStudioDirectorResult {
    const [planning, setPlanning] = useState(false);
    const [approving, setApproving] = useState(false);
    const [plan, setPlan] = useState<DirectorPlan | null>(null);
    const [blocked, setBlocked] = useState<"tokens_exhausted" | "plan_locked" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const base = useCallback(
        () => `/api/studio/brands/${brandId}/contents/${contentId}/studios/${studioId}`,
        [brandId, contentId, studioId]
    );

    const makePlan = useCallback(
        async ({
            brief,
            mode,
            targetSeconds,
        }: {
            brief: string;
            mode: DirectorMode;
            targetSeconds?: number;
        }) => {
            if (!brandId || !contentId || !studioId) return;
            setPlanning(true);
            setBlocked(null);
            setError(null);
            setPlan(null);
            try {
                const res = await HttpWrapper.fetch(`${base()}/plan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brief, mode, targetSeconds }),
                });
                setPlan((await res.json()) as DirectorPlan);
            } catch (e) {
                const err = e as { status?: number; data?: Record<string, unknown> };
                if (err?.status === 402) {
                    setBlocked(
                        err.data?.reason === "plan_locked" ? "plan_locked" : "tokens_exhausted"
                    );
                } else if (err?.status === 422) {
                    // Not an error: a plan that cannot run. The problems ARE
                    // the answer, so they go into the plan rather than into an
                    // error string the UI would show as a failure.
                    setPlan((err.data ?? null) as DirectorPlan | null);
                } else {
                    setError("The director didn't answer. Please try again.");
                }
            } finally {
                setPlanning(false);
            }
        },
        [base, brandId, contentId, studioId]
    );

    const approve = useCallback(async (): Promise<boolean> => {
        if (!brandId || !contentId || !studioId || !plan?.runId) return false;
        setApproving(true);
        setError(null);
        try {
            const res = await HttpWrapper.fetch(`${base()}/runs/${plan.runId}/approve`, {
                method: "POST",
            });
            const json = await res.json();
            // Approval answers with the whole studio, so the rail fills from
            // this response rather than waiting for the subscription.
            if (json?.studio) onState(json as StudioState);
            return true;
        } catch (e) {
            const err = e as { status?: number; data?: { message?: string } };
            setError(
                err?.data?.message ??
                    "We couldn't approve that plan. Please try planning it again."
            );
            return false;
        } finally {
            setApproving(false);
        }
    }, [base, brandId, contentId, studioId, plan, onState]);

    const refused = !!plan?.problems?.some((p) => p.fatal);

    return {
        planning,
        approving,
        plan,
        blocked,
        error,
        refused,
        makePlan,
        approve,
        reset: () => {
            setPlan(null);
            setError(null);
            setBlocked(null);
        },
    };
}
