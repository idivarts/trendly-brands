import { useEffect, useRef, useState } from "react";

/**
 * Drives a resync control's busy state. Because resyncs are async (the backend
 * enqueues and returns 202 immediately), we can't clear the spinner when the
 * request resolves — the data lands later via the Firestore listener. So we spin
 * until the watched value (the item's `updatedAt`/`generatedAt`) advances past
 * what it was at trigger time, with a timeout fallback so it never sticks.
 *
 * @param watch  the subscribed item's updatedAt (or any value that bumps when the
 *               resync lands). Pass undefined if unavailable (timeout-only).
 * @param action fires the resync (POST). Errors clear the spinner immediately.
 */
export function useResyncState(
    watch: number | undefined,
    action: () => Promise<void>,
    timeoutMs = 12000
) {
    const [busy, setBusy] = useState(false);
    const baselineRef = useRef<number | undefined>(undefined);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clear = () => {
        setBusy(false);
        baselineRef.current = undefined;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    // Clear once the watched value advances past the trigger-time baseline.
    useEffect(() => {
        if (busy && baselineRef.current !== undefined && watch !== undefined && watch !== baselineRef.current) {
            clear();
        }
    }, [watch, busy]);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const trigger = () => {
        if (busy) return;
        baselineRef.current = watch;
        setBusy(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(clear, timeoutMs);
        action().catch(() => clear());
    };

    return { busy, trigger };
}
