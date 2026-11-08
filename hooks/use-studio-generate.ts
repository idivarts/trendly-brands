/**
 * Generate a studio's scenes, and watch them fill.
 *
 * ── Why the client does the walking ─────────────────────────────────────────
 * One call plans the scenes and writes them all empty; the client then asks for
 * the designs. That looks like extra work for the client and it buys three
 * things nothing else does:
 *
 *  - The RAIL FILLS VISIBLY. Six scenes appear in about a second, then become
 *    designs as they land. A single "generate everything" call is minutes
 *    behind a spinner with no idea whether it is working.
 *  - YOU CAN STOP. `cancel` stops dispatching, so a user who does not like
 *    scene two does not pay for scenes five and six.
 *  - A FAILURE COSTS ONE SCENE. The run continues and the broken scene is
 *    visibly broken, rather than the whole attempt being lost.
 *
 * Each request also stays comfortably inside the backend's own timeout, which a
 * whole-run call would not.
 *
 * ── Why THREE at a time ─────────────────────────────────────────────────────
 * It was one at a time, and six scenes took six sequential model calls — about
 * a minute of waiting for a thing whose shape was on screen in a second. The
 * work is entirely independent: each scene is its own document, its own model
 * call, its own charge.
 *
 * The cap is not politeness. Unbounded, six scenes are six concurrent model
 * calls, a wallet that can be overdrawn six times before the first 402 comes
 * back, and a rail that goes from empty to full in one jump with nothing to
 * watch. Three keeps something always landing, keeps the overspend on a
 * refusal to at most two extra scenes, and is low enough that `cancel` still
 * means something.
 *
 * ⚠️ THE RESPONSES MUST BE MERGED, NOT ADOPTED. Every generate call answers
 * with the whole studio as of when it finished. Three in flight means three
 * overlapping snapshots, and adopting the last to arrive erases the siblings
 * that finished after it was taken — work that is safe in Firestore but has
 * visibly vanished from the screen. `applyScenesFrom` takes only the scene a
 * call was about, which makes arrival order irrelevant.
 */
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { runPool } from "@/utils/pool";
import { StudioState } from "@/utils/studio-api";
import { useCallback, useRef, useState } from "react";

export type GenerateApproach = "motion" | "composite";

/**
 * How many scene generations may be in flight at once.
 *
 * Three. See the file header for why this is a cap rather than politeness: it
 * bounds how far a wallet can be overdrawn past a refusal, keeps something
 * always landing so the rail stays watchable, and keeps `cancel` meaningful.
 */
const MAX_PARALLEL = 3;

export interface GenerateProgress {
    /** How many scenes the plan produced. */
    total: number;
    /** How many have landed, successfully or not. */
    done: number;
    /** The scenes being worked on right now — up to MAX_PARALLEL of them. */
    activeSceneIds: string[];
    /** The ones that came back broken, so the rail can offer each a retry. */
    failedSceneIds: string[];
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
    /**
     * Fill scenes that already exist, without planning first.
     *
     * What the director's approve hands off to, and what a resume uses. See
     * `walk` for why this way in has to exist.
     */
    fill: (sceneIds: string[], approach?: GenerateApproach) => Promise<void>;
    /** Regenerate one scene on its own. */
    regenerate: (sceneId: string, input?: { brief?: string; approach?: GenerateApproach }) => Promise<void>;
    cancel: () => void;
}

export function useStudioGenerate(
    brandId: string | undefined,
    contentId: string | undefined,
    studioId: string | undefined,
    onState: (state: StudioState) => void,
    /**
     * Fold in ONE scene from a response and leave the rest of local state
     * alone. Required for the parallel fill — see the file header. Without it
     * (and the sequential walk it replaced), three overlapping whole-studio
     * snapshots mean the last to land erases its siblings' designs.
     */
    applyScene: (state: StudioState, sceneId: string) => void
): UseStudioGenerateResult {
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState<GenerateProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [blocked, setBlocked] = useState<"tokens_exhausted" | "plan_locked" | null>(null);

    /** Set by cancel(); checked before each dispatch, never mid-request. */
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

    /**
     * Walk a list of scenes, three at a time, asking for each one's design.
     *
     * The whole of the filling, with no opinion about where the scenes came
     * from — which is the point. It is reached two ways:
     *
     *  - `generate`, which plans the scenes first (the simple flow), and
     *  - `fill`, which is handed scenes somebody else already created (the
     *    director's approve, and resuming a run that was stranded).
     *
     * ⚠️ IT USED TO BE REACHABLE ONE WAY ONLY. `ApproveRun` materialises a
     * plan into pending scenes and hands off — its own header says the
     * per-scene endpoints fill them, driven by the client — and the client
     * had no way in that did not re-plan first. So an approved plan wrote
     * seven scenes marked "Making…" and nothing ever made them. Keep this
     * reachable without planning.
     */
    const walk = useCallback(
        async (queue: string[], approach: GenerateApproach) => {
            const total = queue.length;
            // Live counters rather than state, because the pool reads and
            // writes them between renders and `setProgress` is async —
            // driving dispatch off React state would have workers deciding
            // what to do next from a snapshot one tick stale.
            let done = 0;
            let stop = false;
            const active = new Set<string>();
            const failed: string[] = [];
            const publish = () =>
                setProgress({
                    total,
                    done,
                    activeSceneIds: [...active],
                    failedSceneIds: [...failed],
                });
            publish();

            // The pool is `utils/pool`, where its behaviour is asserted on
            // directly: the cap, one failure costing one item, and stopping
            // dispatch without aborting what is in flight. It used to be an
            // inline loop here, which made all of that untestable without
            // mounting a component.
            await runPool(queue, {
                limit: MAX_PARALLEL,
                shouldStop: () => stop || cancelled.current,
                onStart: (sceneId) => {
                    active.add(sceneId);
                    publish();
                },
                onSettle: (sceneId) => {
                    active.delete(sceneId);
                    done += 1;
                    publish();
                },
                run: async (sceneId) => {
                    const res = await HttpWrapper.fetch(
                        `${base()}/scenes/${sceneId}/generate`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ approach }),
                        }
                    );
                    // ⚠️ Only THIS scene is taken from the response. See the
                    // file header: the response is a whole-studio snapshot,
                    // and adopting it would roll back whatever a sibling
                    // finished after it was taken.
                    applyScene((await res.json()) as StudioState, sceneId);
                },
                onError: (e, sceneId) => {
                    const b = readBlock(e);
                    if (b) {
                        // Out of money mid-run. Stop DISPATCHING; the
                        // requests already in flight are paid for, so
                        // letting them land is strictly better than
                        // throwing their results away.
                        setBlocked(b);
                        stop = true;
                        return;
                    }
                    // One scene failed. The run continues; that scene stays
                    // visibly unfinished, which is more useful than
                    // abandoning the ones that worked.
                    failed.push(sceneId);
                    setError(
                        failed.length === 1
                            ? "One scene didn't come back. You can regenerate it on its own."
                            : `${failed.length} scenes didn't come back. You can regenerate them individually.`
                    );
                },
            });
        },
        [base, applyScene]
    );

    /**
     * Fill scenes that already exist — the director's approve, and resuming.
     *
     * Takes the ids explicitly rather than reading state, because the caller
     * knows which scenes it means: approve means the ones that run just
     * created, and a resume means the ones left pending. Reading "whatever is
     * pending right now" from inside here would also sweep up a scene the user
     * is separately regenerating.
     */
    const fill = useCallback(
        async (sceneIds: string[], approach: GenerateApproach = "motion") => {
            if (!brandId || !contentId || !studioId || sceneIds.length === 0) return;
            cancelled.current = false;
            setRunning(true);
            setError(null);
            setBlocked(null);
            setProgress(null);
            try {
                await walk(sceneIds, approach);
            } finally {
                setRunning(false);
                setProgress(null);
            }
        },
        [brandId, contentId, studioId, walk]
    );

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
                await walk(
                    planned.scenes.filter((sc) => sc.pending).map((sc) => sc.id),
                    approach
                );
            } catch (e) {
                const b = readBlock(e);
                if (b) setBlocked(b);
                else setError("We couldn't plan those scenes. Please try again.");
            } finally {
                setRunning(false);
                setProgress(null);
            }
        },
        [base, brandId, contentId, studioId, onState, walk]
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

    return { running, progress, error, blocked, generate, fill, regenerate, cancel };
}
