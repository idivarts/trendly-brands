/**
 * Run async work over a list with a bounded number in flight.
 *
 * ── Why this is its own function ────────────────────────────────────────────
 * It was a `for` loop with an `await` in it, inside a React hook, and the
 * behaviour that matters — how many run at once, what happens when one asks to
 * stop, what happens when one throws — was untestable there without mounting a
 * component. A pool is three lines of bookkeeping and a dozen ways to get
 * subtly wrong, so it is worth being able to assert on.
 *
 * ⚠️ IT NEVER REJECTS. A worker that throws would otherwise take the whole
 * `Promise.all` down and abandon the siblings mid-flight, which is the opposite
 * of what a batch of independent work wants: one scene failing must cost one
 * scene. `onError` is where a caller decides what a failure means, and the pool
 * carries on regardless.
 */

export interface PoolOptions<T> {
    /** How many may be in flight at once. Clamped to at least 1. */
    limit: number;
    /** The work. Called once per item, never concurrently for the same item. */
    run: (item: T, index: number) => Promise<void>;
    /**
     * Asked before each dispatch — NOT mid-flight. Returning true stops new
     * work from starting and lets what is already running finish, because that
     * work has usually already been paid for.
     */
    shouldStop?: () => boolean;
    /** A worker threw. The pool continues; this decides what it meant. */
    onError?: (err: unknown, item: T, index: number) => void;
    /** Called when an item starts and when it settles, for progress. */
    onStart?: (item: T, index: number) => void;
    onSettle?: (item: T, index: number) => void;
}

export async function runPool<T>(items: T[], opts: PoolOptions<T>): Promise<void> {
    const limit = Math.max(1, Math.floor(opts.limit));
    // A shared cursor rather than slicing the list into `limit` chunks: chunks
    // make every worker wait for the slowest in its own chunk, so one slow
    // scene idles a lane that could be doing the next one.
    let cursor = 0;

    const worker = async (): Promise<void> => {
        for (;;) {
            if (opts.shouldStop?.() === true) return;
            const index = cursor++;
            if (index >= items.length) return;
            const item = items[index];
            opts.onStart?.(item, index);
            try {
                await opts.run(item, index);
            } catch (err) {
                opts.onError?.(err, item, index);
            } finally {
                opts.onSettle?.(item, index);
            }
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, () => worker())
    );
}
