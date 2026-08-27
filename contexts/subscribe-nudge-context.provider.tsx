import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

import SubscribeNudgeSheet from "@/components/billing/SubscribeNudgeSheet";
import {
    NATIVE_DEFAULTS,
    NUDGE_ANALYTICS_EVENT,
    NUDGE_TRIGGER_PRIORITY,
    NudgeAnalyticsAction,
    NudgeTriggerKey,
    SUBSCRIBE_NUDGE_FLAGS,
    WEB_DEFAULTS,
} from "@/constants/SubscribeNudge";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import {
    getNudgeState,
    NudgeState,
    patchNudgeState,
} from "@/utils/nudge/nudge-storage";

// Proactive subscribe-nudge engine (Notion: "Prompting to Subscribe to In-app
// Purchase"). Existing upgrade prompts are purely REACTIVE — they fire only
// once the token wallet is empty. This provider fires BEFORE exhaustion, off
// behavioral signals: app-open count, cumulative session time, the first
// "aha-moment" activity, a pre-exhaustion consumption threshold, and explicit
// high-intent taps (Phase 2b action triggers).
//
// Contract with the rest of the app:
//   • `maybeNudge(trigger)` — call at a high-intent tap. Returns true if the
//     nudge was shown, so callers can decide whether to also proceed.
//   • `markAhaMoment(kind)` — call after first content created / first post
//     scheduled.
// Everything is a no-op for paid orgs, and every threshold is remotely tunable
// on web via GrowthBook.

interface SubscribeNudgeContextValue {
    maybeNudge: (trigger: NudgeTriggerKey) => boolean;
    markAhaMoment: (kind: "content_created" | "post_scheduled") => void;
}

const SubscribeNudgeContext = createContext<SubscribeNudgeContextValue>({
    maybeNudge: () => false,
    markAhaMoment: () => { },
});

export const useSubscribeNudge = () => useContext(SubscribeNudgeContext);

interface NudgeThresholds {
    enabled: boolean;
    openCountTrigger: number;
    sessionMinutes: number;
    consumptionPct: number;
    cooldownHours: number;
}

// GrowthBook has no native client today (the native provider is a stub), so
// native reads the hardcoded constants. Web reads real flags via the provider,
// falling back to the same values.
function useNudgeThresholds(): NudgeThresholds {
    const gb = useMyGrowthBook() as any;
    return useMemo(() => {
        if (Platform.OS !== "web") return { ...NATIVE_DEFAULTS };
        const f = gb?.features ?? {};
        const read = <T,>(key: string, fallback: T): T => {
            const v = f[key];
            return v === undefined || v === null ? fallback : (v as T);
        };
        return {
            enabled: read(SUBSCRIBE_NUDGE_FLAGS.enabled, WEB_DEFAULTS.enabled),
            openCountTrigger: read(SUBSCRIBE_NUDGE_FLAGS.openCountTrigger, WEB_DEFAULTS.openCountTrigger),
            sessionMinutes: read(SUBSCRIBE_NUDGE_FLAGS.sessionMinutes, WEB_DEFAULTS.sessionMinutes),
            consumptionPct: read(SUBSCRIBE_NUDGE_FLAGS.consumptionPct, WEB_DEFAULTS.consumptionPct),
            cooldownHours: read(SUBSCRIBE_NUDGE_FLAGS.cooldownHours, WEB_DEFAULTS.cooldownHours),
        };
    }, [gb?.features]);
}

export const SubscribeNudgeProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { manager } = useAuthContext();
    const { selectedOrganization } = useOrganizationContext();
    const { tokens, billing } = useEntitlements();
    const thresholds = useNudgeThresholds();

    const managerId = manager?.id;
    const [state, setState] = useState<NudgeState | null>(null);
    const [activeTrigger, setActiveTrigger] = useState<NudgeTriggerKey | null>(null);

    // Mirror of `state` for use inside callbacks/listeners that must not
    // re-subscribe on every state change (AppState listener, maybeNudge).
    // Synced in an effect rather than during render — the React Compiler is
    // enabled here, and render-phase ref mutation is not safe under it.
    const stateRef = useRef<NudgeState | null>(null);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const planKey = (selectedOrganization?.planKey || billing?.planKey || "free").toLowerCase();
    const isFreePlan = planKey === "free";
    const isPaid = !isFreePlan;

    const logNudge = useCallback(
        (action: NudgeAnalyticsAction, trigger: NudgeTriggerKey) => {
            analyticsLogEvent(NUDGE_ANALYTICS_EVENT, {
                action,
                trigger,
                plan_key: planKey,
                platform: Platform.OS,
                token_state: tokens.state,
            });
        },
        [planKey, tokens.state]
    );

    // ── Phase 1: load persisted state + count this app open ──────────────────
    useEffect(() => {
        if (!managerId) return;
        let cancelled = false;
        (async () => {
            const current = await getNudgeState(managerId);
            const next = await patchNudgeState(managerId, {
                appOpenCount: current.appOpenCount + 1,
                firstOpenAt: current.firstOpenAt ?? Date.now(),
            });
            if (!cancelled) setState(next);
        })();
        return () => {
            cancelled = true;
        };
    }, [managerId]);

    // ── Phase 1: accumulate foreground session time ──────────────────────────
    // Native gets real foreground/background transitions from AppState; on web
    // AppState is not meaningful, so the mount duration is the session.
    useEffect(() => {
        if (!managerId) return;
        let foregroundedAt = Date.now();

        const flush = () => {
            const delta = Date.now() - foregroundedAt;
            foregroundedAt = Date.now();
            if (delta <= 0) return;
            const current = stateRef.current;
            if (!current) return;
            patchNudgeState(managerId, {
                cumulativeSessionMs: current.cumulativeSessionMs + delta,
            }).then(setState);
        };

        if (Platform.OS === "web") {
            const interval = setInterval(flush, 30_000);
            return () => {
                clearInterval(interval);
                flush();
            };
        }

        const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
            if (next === "active") {
                foregroundedAt = Date.now();
            } else {
                flush();
            }
        });
        const interval = setInterval(flush, 30_000);
        return () => {
            sub.remove();
            clearInterval(interval);
        };
    }, [managerId]);

    // Whether a nudge may fire right now: free plan, engine enabled, state
    // loaded, not already converted, outside the cooldown, and not already
    // shown in this session (one trigger per session, per the ticket).
    const canNudge = useCallback((): boolean => {
        const s = stateRef.current;
        if (!s || !managerId) return false;
        if (!thresholds.enabled) return false;
        if (isPaid) return false;
        if (s.nudgeConvertedAt) return false;
        if (activeTrigger) return false;
        if (s.lastNudgeSessionOpenCount === s.appOpenCount) return false;
        if (s.lastNudgeShownAt) {
            const elapsedHours = (Date.now() - s.lastNudgeShownAt) / 3_600_000;
            if (elapsedHours < thresholds.cooldownHours) return false;
        }
        return true;
    }, [managerId, thresholds, isPaid, activeTrigger]);

    const show = useCallback(
        (trigger: NudgeTriggerKey) => {
            const s = stateRef.current;
            if (!managerId || !s) return;
            setActiveTrigger(trigger);
            logNudge("shown", trigger);
            patchNudgeState(managerId, {
                lastNudgeShownAt: Date.now(),
                lastNudgeSessionOpenCount: s.appOpenCount,
                ahaMomentNudgeShown: trigger === "aha_moment" ? true : s.ahaMomentNudgeShown,
            }).then(setState);
        },
        [managerId, logNudge]
    );

    // ── Phase 2b: action-triggered nudges ────────────────────────────────────
    const maybeNudge = useCallback(
        (trigger: NudgeTriggerKey): boolean => {
            if (!canNudge()) return false;
            show(trigger);
            return true;
        },
        [canNudge, show]
    );

    const markAhaMoment = useCallback(
        (kind: "content_created" | "post_scheduled") => {
            const s = stateRef.current;
            if (!managerId || !s) return;
            const alreadyMarked =
                kind === "content_created" ? s.hasCreatedFirstContent : s.hasScheduledFirstPost;
            // Fire on the FIRST aha-moment of either kind only.
            const willShow = !alreadyMarked && !s.ahaMomentNudgeShown && canNudge();

            // Single write: `show()` also patches, and two concurrent
            // read-modify-write patches would race and drop one of the flags.
            const patch: Partial<NudgeState> = {
                ...(kind === "content_created"
                    ? { hasCreatedFirstContent: true }
                    : { hasScheduledFirstPost: true }),
                ...(willShow
                    ? {
                        lastNudgeShownAt: Date.now(),
                        lastNudgeSessionOpenCount: s.appOpenCount,
                        ahaMomentNudgeShown: true,
                    }
                    : {}),
            };
            patchNudgeState(managerId, patch).then(setState);
            if (willShow) {
                setActiveTrigger("aha_moment");
                logNudge("shown", "aha_moment");
            }
        },
        [managerId, canNudge, logNudge]
    );

    // ── Phase 2: automatic triggers ──────────────────────────────────────────
    // Re-evaluated whenever trigger state or token balance changes. Priority
    // order comes from NUDGE_TRIGGER_PRIORITY so only the strongest signal
    // fires when several qualify at once.
    useEffect(() => {
        if (!state || !canNudge()) return;

        const pctUsed = state ? (1 - tokens.pctLeft) * 100 : 0;
        const qualifying: NudgeTriggerKey[] = [];

        if (tokens.state !== "none" && pctUsed >= thresholds.consumptionPct) {
            qualifying.push("consumption_threshold");
        }
        if (state.appOpenCount >= thresholds.openCountTrigger) {
            qualifying.push("open_count");
        }
        if (state.cumulativeSessionMs >= thresholds.sessionMinutes * 60_000) {
            qualifying.push("session_time");
        }
        if (qualifying.length === 0) return;

        const winner = NUDGE_TRIGGER_PRIORITY.find((t) => qualifying.includes(t));
        if (winner) show(winner);
    }, [state, tokens.pctLeft, tokens.state, thresholds, canNudge, show]);

    const handleDismiss = useCallback(() => {
        const trigger = activeTrigger;
        setActiveTrigger(null);
        if (!managerId || !trigger) return;
        logNudge("dismissed", trigger);
        const s = stateRef.current;
        patchNudgeState(managerId, {
            nudgeDismissCount: (s?.nudgeDismissCount ?? 0) + 1,
        }).then(setState);
    }, [managerId, activeTrigger, logNudge]);

    const handleConverted = useCallback(() => {
        const trigger = activeTrigger;
        setActiveTrigger(null);
        if (!managerId || !trigger) return;
        logNudge("converted", trigger);
        patchNudgeState(managerId, { nudgeConvertedAt: Date.now() }).then(setState);
    }, [managerId, activeTrigger, logNudge]);

    const value = useMemo<SubscribeNudgeContextValue>(
        () => ({ maybeNudge, markAhaMoment }),
        [maybeNudge, markAhaMoment]
    );

    return (
        <SubscribeNudgeContext.Provider value={value}>
            {children}
            {activeTrigger ? (
                <SubscribeNudgeSheet
                    trigger={activeTrigger}
                    onDismiss={handleDismiss}
                    onConverted={handleConverted}
                />
            ) : null}
        </SubscribeNudgeContext.Provider>
    );
};
