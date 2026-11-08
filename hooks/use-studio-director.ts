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

    /**
     * Wait for a queued plan by reading the run back.
     *
     * Polling rather than a Firestore subscription on purpose: runs are NOT
     * client-readable for writes and the storyboard already reads through the
     * API, so one mechanism is enough. The interval starts tight and backs off
     * — a cheap plan can land in a few seconds and should feel immediate,
     * while a slow one should not cost dozens of requests.
     *
     * The ceiling is a real decision, not a guard: `studio_sqs` has a 900s
     * budget, but a user watching a spinner for fifteen minutes is not being
     * served. At the cap we stop WATCHING, not planning — the run keeps going
     * and a reopened storyboard finds it finished, which is why the message
     * says it is still working rather than that it failed.
     */
    const pollRun = useCallback(
        async (runId: string): Promise<DirectorPlan> => {
            const deadline = Date.now() + 180_000;
            let wait = 1_500;
            while (Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, wait));
                wait = Math.min(wait * 1.4, 8_000);
                try {
                    const res = await HttpWrapper.fetch(`${base()}/runs/${runId}`);
                    // ⚠️ GET …/runs/:id answers `{ run: {...} }`, and the run
                    // carries `id`, not `runId`. Casting the response straight
                    // to DirectorPlan reads `status` as undefined, so the loop
                    // never finishes: a plan that was ready in six seconds
                    // still spun to the cap and then claimed to be "still
                    // working". Unwrapped and mapped here, once.
                    const json = (await res.json()) as {
                        run?: {
                            id?: string;
                            status?: string;
                            storyboard?: string;
                            problems?: RunProblem[];
                            estCostUsd?: number;
                        };
                    };
                    const run = json?.run;
                    if (run?.status && run.status !== "planning") {
                        return {
                            runId: run.id ?? runId,
                            status: run.status,
                            storyboard: run.storyboard ?? "",
                            problems: run.problems ?? [],
                            estCostUsd: run.estCostUsd ?? 0,
                        };
                    }
                } catch {
                    // A failed poll is not a failed plan — the plan is being
                    // made elsewhere. Keep waiting until the deadline.
                }
            }
            // Still planning at the cap. Returned as a real DirectorPlan
            // rather than an error: nothing failed.
            //
            // ⚠️ Status stays "planning", and that is what the Approve button
            // must key off — NOT `refused`, which is computed from fatal
            // problems and is therefore false for a run that has none yet. The
            // button is gated on status === "planned" in DirectorSheet; the API
            // refuses an unfinished run with 409 as well, because a client
            // cannot be trusted to hide a button.
            return {
                runId,
                status: "planning",
                storyboard:
                    "The director is still working on this. Reopen it in a moment to see the plan.",
                problems: [],
                estCostUsd: 0,
            };
        },
        [base]
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
                const started = (await res.json()) as DirectorPlan & {
                    status?: string;
                    message?: string;
                };

                // 202 + "planning": the plan is being made on the queue.
                //
                // ⚠️ It CANNOT come back in the response. API Gateway's
                // integration timeout is 29 seconds and is not configurable,
                // while a plan is one or two frontier-model calls emitting a
                // whole storyboard — it returned 504 at 30s against dev, cold
                // and warm. So the run row is the answer, and we poll it.
                //
                // A run with no id is the "nothing is switched on" reply, which
                // carries a message and no plan to wait for.
                if (started?.status === "planning" && started?.runId) {
                    setPlan(await pollRun(started.runId));
                } else {
                    setPlan(started);
                }
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
        [base, brandId, contentId, studioId, pollRun]
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
