/**
 * Generate a studio's scenes, and watch them fill.
 *
 * ── Why the client does the walking ─────────────────────────────────────────
 * One call plans the scenes and writes them all empty; the client then asks for
 * one scene's design at a time. That looks like extra work for the client and it
 * buys three things nothing else does:
 *
 *  - The RAIL FILLS VISIBLY. Six scenes appear in about a second, then become
 *    designs one by one. A single "generate everything" call is minutes behind
 *    a spinner with no idea whether it is working.
 *  - YOU CAN STOP. `cancel` stops before the next scene, so a user who does not
 *    like scene two does not pay for scenes three to six.
 *  - A FAILURE COSTS ONE SCENE. The run continues and the broken scene is
 *    visibly broken, rather than the whole attempt being lost.
 *
 * Each request also stays comfortably inside the backend's own timeout, which a
 * whole-run call would not.
 */
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { StudioState } from "@/utils/studio-api";
import { useCallback, useRef, useState } from "react";

export type GenerateApproach = "motion" | "composite";

export interface GenerateProgress {
    /** How many scenes the plan produced. */
    total: number;
    /** How many have a design so far. */
    done: number;
    /** The scene being worked on, for the rail to highlight. */
    currentSceneId: string | null;
}

export interface UseStudioGenerateResult {
    running: boolean;
    progress: GenerateProgress | null;
    error: string | null;
    /** True when the refusal was about money rather than about the request. */
    blocked: "tokens_exhausted" | "plan_locked" | null;

    generate: (input: {
        brief: string;
        sceneCount?: number;
        approach?: GenerateApproach;
    }) => Promise<void>;
    /** Regenerate one scene on its own. */
    regenerate: (sceneId: string, input?: { brief?: string; approach?: GenerateApproach }) => Promise<void>;
    cancel: () => void;
}

export function useStudioGenerate(
    brandId: string | undefined,
    contentId: string | undefined,
    studioId: string | undefined,
    onState: (state: StudioState) => void
): UseStudioGenerateResult {
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState<GenerateProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [blocked, setBlocked] = useState<"tokens_exhausted" | "plan_locked" | null>(null);

    /** Set by cancel(), checked between scenes. */
    const cancelled = useRef(false);

    const base = useCallback(
        () => `/api/studio/brands/${brandId}/contents/${contentId}/studios/${studioId}`,
        [brandId, contentId, studioId]
    );

    /** Read a refusal's reason, so the UI can offer a top-up or a tier. */
    const readBlock = (e: unknown): "tokens_exhausted" | "plan_locked" | null => {
        const err = e as { status?: number; data?: { reason?: string } };
        if (err?.status !== 402) return null;
        return err.data?.reason === "plan_locked" ? "plan_locked" : "tokens_exhausted";
    };

    const generate = useCallback(
        async ({
            brief,
            sceneCount,
            approach = "motion",
        }: {
            brief: string;
            sceneCount?: number;
            approach?: GenerateApproach;
        }) => {
            if (!brandId || !contentId || !studioId) return;
            cancelled.current = false;
            setRunning(true);
            setError(null);
            setBlocked(null);
            setProgress(null);

            try {
                const planRes = await HttpWrapper.fetch(`${base()}/plan-scenes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brief, sceneCount }),
                });
                const planned = (await planRes.json()) as StudioState;
                onState(planned);

                // Fill only the scenes this run planned — the ones marked
                // pending. A studio the user had already built scenes in must
                // not have those regenerated out from under them.
                const queue = planned.scenes.filter((s) => s.pending).map((s) => s.id);
                setProgress({ total: queue.length, done: 0, currentSceneId: null });

                for (let i = 0; i < queue.length; i++) {
                    if (cancelled.current) break;
                    const sceneId = queue[i];
                    setProgress({ total: queue.length, done: i, currentSceneId: sceneId });
                    try {
                        const res = await HttpWrapper.fetch(
                            `${base()}/scenes/${sceneId}/generate`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ approach }),
                            }
                        );
                        onState((await res.json()) as StudioState);
                    } catch (e) {
                        const b = readBlock(e);
                        if (b) {
                            // Out of money mid-run. Stop rather than hammer
                            // the remaining scenes against a 402 each.
                            setBlocked(b);
                            break;
                        }
                        // One scene failed. The run continues; that scene
                        // stays visibly unfinished, which is more useful than
                        // abandoning the four that would have worked.
                        setError("One scene didn't come back. You can regenerate it on its own.");
                    }
                    setProgress({ total: queue.length, done: i + 1, currentSceneId: null });
                }
            } catch (e) {
                const b = readBlock(e);
                if (b) setBlocked(b);
                else setError("We couldn't plan those scenes. Please try again.");
            } finally {
                setRunning(false);
                setProgress(null);
            }
        },
        [base, brandId, contentId, studioId, onState]
    );

    const regenerate = useCallback(
        async (sceneId: string, input?: { brief?: string; approach?: GenerateApproach }) => {
            if (!brandId || !contentId || !studioId) return;
            setRunning(true);
            setError(null);
            setBlocked(null);
            try {
                const res = await HttpWrapper.fetch(`${base()}/scenes/${sceneId}/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        brief: input?.brief,
                        approach: input?.approach ?? "motion",
                    }),
                });
                onState((await res.json()) as StudioState);
            } catch (e) {
                const b = readBlock(e);
                if (b) setBlocked(b);
                else setError("That scene didn't come back. Please try again.");
            } finally {
                setRunning(false);
            }
        },
        [base, brandId, contentId, studioId, onState]
    );

    const cancel = useCallback(() => {
        // Checked between scenes rather than aborting the in-flight request:
        // that scene has already been paid for, so letting it land is strictly
        // better than throwing it away.
        cancelled.current = true;
    }, []);

    return { running, progress, error, blocked, generate, regenerate, cancel };
}
