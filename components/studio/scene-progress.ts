/**
 * Is anything actually making this scene?
 *
 * ── Why this needed a name ──────────────────────────────────────────────────
 * The rail printed "Making…" from `scene.pending` alone. `pending` means "this
 * scene has no content yet", which is NOT the same as "a worker is on it" —
 * and the gap between those two is where the worst bug in the studio lived.
 * Six scenes an approved plan never submitted looked exactly like six scenes a
 * worker was busy with, so the failure presented as slowness and nobody
 * looked for an hour.
 *
 * A scene is being made only when a job was actually queued (`queuedAt`) and
 * the worker that owns it could still be alive. Everything else that is
 * `pending` is waiting for a person, and should say so.
 *
 * Lives here rather than in either screen because the rail and the screen MUST
 * agree: the rail's pill and the screen's "N scenes were never made" banner
 * are two renderings of one question, and two copies of this predicate would
 * eventually disagree about which scenes they are counting.
 */
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";

/**
 * The studio queue worker's own ceiling (900s), plus a minute of slack for the
 * trip there and back.
 *
 * Past it with no outcome written, the scene is not slow — it is stranded, and
 * saying "Making…" over it is a lie that costs the user the hour they spend
 * believing it.
 */
export const WORKER_CEILING_MS = 15 * 60 * 1000;

/** A worker was given this scene, and could still be alive. */
export function beingMade(scene: IStudioScene): boolean {
    return (
        scene.gen?.status === "queued" &&
        !!scene.gen.queuedAt &&
        Date.now() - scene.gen.queuedAt < WORKER_CEILING_MS
    );
}

/**
 * Pending, with nothing behind it. The scene needs a person, not patience.
 *
 * ⚠️ This is the normal state of a video scene straight out of an approved
 * plan: approval writes the generation intent and marks the scene pending, and
 * a separate submission turns that into a job. Until the submission exists,
 * every such scene is stranded the moment it is approved.
 */
export function strandedPending(scene: IStudioScene): boolean {
    return !!scene.pending && !beingMade(scene);
}
