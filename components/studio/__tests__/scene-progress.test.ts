/**
 * The predicate that decides whether to say "Making…".
 *
 * Worth its own tests because the thing it replaces — `scene.pending` alone —
 * read as true for six scenes that nothing was making, and the studio said
 * "Making…" over them for an hour. The cost of getting this wrong is not a
 * wrong label; it is a user waiting for work that was never started.
 */
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { beingMade, strandedPending, WORKER_CEILING_MS } from "../scene-progress";

const scene = (over: Partial<IStudioScene> = {}): IStudioScene =>
    ({ id: "s1", durationMs: 4000, primaryKind: "empty", layers: [], ...over }) as IStudioScene;

describe("beingMade", () => {
    it("is true for a job queued just now", () => {
        expect(beingMade(scene({ pending: true, gen: { status: "queued", queuedAt: Date.now() } as any }))).toBe(true);
    });

    it("is FALSE when a scene is pending with no job behind it", () => {
        // The exact shape an approved plan leaves: intent written, nothing
        // submitted. This is the case that used to say "Making…".
        expect(beingMade(scene({ pending: true }))).toBe(false);
    });

    it("is FALSE for a queued status with no queuedAt", () => {
        // `ApproveRun` writes `status: "queued"` as an INTENT, before any job
        // exists. Trusting the status alone would reinstate the original bug
        // in a new place.
        expect(beingMade(scene({ pending: true, gen: { status: "queued" } as any }))).toBe(false);
    });

    it("is FALSE once the worker's own ceiling has passed", () => {
        const old = Date.now() - WORKER_CEILING_MS - 1000;
        expect(beingMade(scene({ pending: true, gen: { status: "queued", queuedAt: old } as any }))).toBe(false);
    });

    it("is FALSE for a job that already failed", () => {
        expect(
            beingMade(scene({ pending: true, gen: { status: "failed", queuedAt: Date.now() } as any }))
        ).toBe(false);
    });
});

describe("strandedPending", () => {
    it("catches the scene an approved plan never submitted", () => {
        expect(strandedPending(scene({ pending: true }))).toBe(true);
    });

    it("leaves a scene a worker is on alone", () => {
        expect(
            strandedPending(scene({ pending: true, gen: { status: "queued", queuedAt: Date.now() } as any }))
        ).toBe(false);
    });

    it("says nothing about a scene that is not pending at all", () => {
        expect(strandedPending(scene({ pending: false }))).toBe(false);
    });
});
