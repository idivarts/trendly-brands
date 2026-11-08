import { runPool } from "../pool";

/** A promise you resolve by hand, so concurrency is observable rather than timed. */
function deferred<T = void>() {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("runPool", () => {
    it("never exceeds the limit, and keeps the lanes full", async () => {
        // The whole point of the cap. Asserted on the PEAK rather than on
        // timing, so the test cannot pass by being slow.
        const gates = Array.from({ length: 7 }, () => deferred());
        let inFlight = 0;
        let peak = 0;

        const done = runPool([0, 1, 2, 3, 4, 5, 6], {
            limit: 3,
            run: async (i) => {
                inFlight++;
                peak = Math.max(peak, inFlight);
                await gates[i].promise;
                inFlight--;
            },
        });

        // Three started; the fourth must be waiting.
        await Promise.resolve();
        expect(inFlight).toBe(3);

        // Release one at a time; a lane must immediately pick up the next.
        for (let i = 0; i < 7; i++) {
            gates[i].resolve();
            await Promise.resolve();
            await Promise.resolve();
        }
        await done;

        expect(peak).toBe(3);
        expect(inFlight).toBe(0);
    });

    it("runs each item exactly once, and all of them", async () => {
        const seen: number[] = [];
        await runPool([1, 2, 3, 4, 5, 6], { limit: 3, run: async (n) => void seen.push(n) });
        expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("lets one failure cost one item", async () => {
        // A rejecting worker inside Promise.all would abandon its siblings
        // mid-flight. One scene failing must cost one scene.
        const ok: number[] = [];
        const failed: number[] = [];
        await expect(
            runPool([1, 2, 3, 4], {
                limit: 2,
                run: async (n) => {
                    if (n === 2) throw new Error("boom");
                    ok.push(n);
                },
                onError: (_e, n) => void failed.push(n),
            })
        ).resolves.toBeUndefined();
        expect(ok.sort()).toEqual([1, 3, 4]);
        expect(failed).toEqual([2]);
    });

    it("stops dispatching when asked, without aborting what is in flight", async () => {
        // Cancellation semantics: the in-flight work is already paid for.
        const started: number[] = [];
        const finished: number[] = [];
        let stop = false;
        await runPool([1, 2, 3, 4, 5, 6], {
            limit: 2,
            shouldStop: () => stop,
            run: async (n) => {
                started.push(n);
                if (started.length === 2) stop = true;
                finished.push(n);
            },
        });
        // Exactly the two that had already begun.
        expect(started).toEqual([1, 2]);
        expect(finished).toEqual([1, 2]);
    });

    it("does nothing, and does not hang, on an empty list", async () => {
        // Math.min(limit, 0) workers — a naive `limit` workers would each spin
        // once and return, which is harmless, but a naive while-loop would not.
        const run = jest.fn();
        await runPool([], { limit: 3, run });
        expect(run).not.toHaveBeenCalled();
    });

    it("treats a nonsense limit as one rather than as none", async () => {
        const seen: number[] = [];
        await runPool([1, 2], { limit: 0, run: async (n) => void seen.push(n) });
        expect(seen).toEqual([1, 2]);
    });

    it("reports starts and settles once per item, settling even on failure", async () => {
        const starts: number[] = [];
        const settles: number[] = [];
        await runPool([1, 2, 3], {
            limit: 2,
            run: async (n) => {
                if (n === 2) throw new Error("boom");
            },
            onStart: (n) => void starts.push(n),
            onSettle: (n) => void settles.push(n),
            onError: () => undefined,
        });
        expect(starts.sort()).toEqual([1, 2, 3]);
        expect(settles.sort()).toEqual([1, 2, 3]);
    });
});
