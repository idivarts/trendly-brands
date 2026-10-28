import type { StrategyOrigin } from "@/shared-constants/analytics-events";
import { track } from "@/shared-libs/utils/analytics";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";

/**
 * Timing for the strategy loop's two outcome events.
 *
 * `strategy_formed` almost never fires on the mount that started the strategy:
 * the onboarding branch creates it and then navigates to the detail screen,
 * and the AI writes the content server-side so it arrives through a Firestore
 * snapshot some seconds later. So the start time cannot live in a ref — it has
 * to survive a navigation and a remount, which is what this is for.
 *
 * Without it `duration_ms` would be the time since the screen mounted, which
 * is a measure of our own navigation rather than of how long the user waited.
 */
const KEY_PREFIX = "strategy_started_";

/** Longer than any plausible generation; past this the timing is meaningless. */
const TTL_MS = 60 * 60 * 1000;

interface StartedRecord {
    origin: StrategyOrigin;
    startedAt: number;
}

export const markStrategyStarted = async (
    strategyId: string,
    origin: StrategyOrigin = "strategies_list"
): Promise<void> => {
    try {
        const record: StartedRecord = { origin, startedAt: Date.now() };
        await PersistentStorage.set(`${KEY_PREFIX}${strategyId}`, JSON.stringify(record));
    } catch {
        // Losing the timing costs duration_ms and the origin, not the event.
    }
};

/**
 * Strategies already reported as formed, for this app session.
 *
 * Module-scoped on purpose. `useStrategies()` is mounted by several components
 * at once — the strategy screen and CollaboratorsSection both call it, and the
 * calendar and content screens do too — and each instance runs its own
 * Firestore listener. A guard held in a hook instance therefore dedupes only
 * against itself, so one empty-to-written transition fired once PER MOUNTED
 * HOOK.
 *
 * Observed on dev: two `strategy_formed` rows 7ms apart for one strategy. The
 * second had lost the race for the stored start record, so it also reported
 * the wrong origin (`ai_chat` instead of `strategies_list`) and no duration —
 * which would have quietly skewed both the funnel count and its timings.
 */
const reportedFormed = new Set<string>();

/**
 * Report that a strategy now has content.
 *
 * `word_count` rather than the content itself: the strategy is the brand's own
 * writing, and the only thing analytics needs from it is whether what came
 * back was substantial or a stub.
 */
export const reportStrategyFormed = async (
    strategyId: string,
    markdownContent: string
): Promise<void> => {
    // Claimed synchronously, before the first await. Two listeners reacting to
    // the same snapshot run in the same tick, so an async guard would let both
    // through.
    if (reportedFormed.has(strategyId)) return;
    reportedFormed.add(strategyId);

    let origin: StrategyOrigin = "ai_chat";
    let durationMs: number | undefined;

    try {
        const raw = await PersistentStorage.get(`${KEY_PREFIX}${strategyId}`);
        if (raw) {
            await PersistentStorage.clear(`${KEY_PREFIX}${strategyId}`);
            const record = JSON.parse(raw) as StartedRecord;
            if (record?.startedAt && Date.now() - record.startedAt <= TTL_MS) {
                origin = record.origin;
                durationMs = Date.now() - record.startedAt;
            }
        }
    } catch {
        // Fall through with the default origin.
    }

    track("strategy_formed", {
        origin,
        duration_ms: durationMs,
        word_count: markdownContent.trim().split(/\s+/).filter(Boolean).length,
    });
};
