import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";

// Local (device-scoped) trigger state for the proactive subscribe-nudge engine.
// Deliberately NOT synced to the backend for v1 (see ticket Phase 1) — app-open
// count and session time are lifecycle signals tied to this install, not the
// org. Keyed per manager so a shared device (rare, but web is multi-user)
// doesn't blend two people's nudge history.
export interface NudgeState {
    appOpenCount: number;
    firstOpenAt: number | null;
    cumulativeSessionMs: number;
    lastNudgeShownAt: number | null;
    // appOpenCount value at the time a nudge last fired, so "one trigger per
    // session" can be enforced without a separate session id: if it still
    // matches the current appOpenCount, we're in the same session.
    lastNudgeSessionOpenCount: number | null;
    nudgeDismissCount: number;
    nudgeConvertedAt: number | null;
    ahaMomentNudgeShown: boolean;
    hasCreatedFirstContent: boolean;
    hasScheduledFirstPost: boolean;
}

const DEFAULT_STATE: NudgeState = {
    appOpenCount: 0,
    firstOpenAt: null,
    cumulativeSessionMs: 0,
    lastNudgeShownAt: null,
    lastNudgeSessionOpenCount: null,
    nudgeDismissCount: 0,
    nudgeConvertedAt: null,
    ahaMomentNudgeShown: false,
    hasCreatedFirstContent: false,
    hasScheduledFirstPost: false,
};

const storageKey = (managerId: string) => `subscribe-nudge-state-${managerId}`;

export async function getNudgeState(managerId: string): Promise<NudgeState> {
    const raw = await PersistentStorage.get(storageKey(managerId));
    if (!raw) return { ...DEFAULT_STATE };
    try {
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

export async function setNudgeState(managerId: string, state: NudgeState): Promise<void> {
    await PersistentStorage.set(storageKey(managerId), JSON.stringify(state));
}

export async function patchNudgeState(
    managerId: string,
    patch: Partial<NudgeState>
): Promise<NudgeState> {
    const current = await getNudgeState(managerId);
    const next = { ...current, ...patch };
    await setNudgeState(managerId, next);
    return next;
}
