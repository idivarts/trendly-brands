import { useAuthContext } from "@/contexts";
import { useBreakpoints } from "@/hooks";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { Tour, useCoachmark } from "@edwardloopez/react-native-coachmark";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef } from "react";

interface UseFeatureTourOptions {
    /** Stable feature key — used to build the per-user, per-breakpoint seen flag. */
    feature: string;
    /**
     * True once the tour's anchors are actually mounted on screen (data loaded,
     * correct phase, list rendered). The tour never fires until this is true —
     * this is what prevents highlighting an element that hasn't rendered yet.
     */
    ready: boolean;
    /** Set false to suppress the tour entirely (e.g. embedded/secondary usage). */
    enabled?: boolean;
    /** Tour to run on desktop (`xl`). */
    web: Tour;
    /** Tour to run on mobile (`!xl`). Omit when a screen has no mobile tour. */
    mobile?: Tour | null;
}

/**
 * Fires a one-time, contextual coach-mark tour for a single screen.
 *
 * A tour starts only when ALL of these hold:
 *  - the screen's tab is focused (`useIsFocused`) — so a sibling tab's tour
 *    can't fire while the user is looking at another tab;
 *  - `ready` is true — the anchors are mounted;
 *  - it hasn't been seen before (persisted per-user, per-breakpoint);
 *  - no other coach-mark tour is currently active.
 *
 * The seen flag is keyed `guide-tour-{feature}-{managerId}-{web|mobile}`, so the
 * web and mobile variants are tracked independently.
 */
export function useFeatureTour({
    feature,
    ready,
    enabled = true,
    web,
    mobile,
}: UseFeatureTourOptions) {
    const { manager } = useAuthContext();
    const { xl } = useBreakpoints();
    const isFocused = useIsFocused();
    const { start, isActive } = useCoachmark();
    const startedRef = useRef(false);

    useEffect(() => {
        if (
            !enabled ||
            !isFocused ||
            !ready ||
            isActive ||
            startedRef.current ||
            !manager?.id
        ) {
            return;
        }

        const tour = xl ? web : mobile;
        if (!tour) return; // e.g. content listing has no mobile tour

        const key = `guide-tour-${feature}-${manager.id}-${xl ? "web" : "mobile"}`;
        let cancelled = false;

        (async () => {
            try {
                const seen = await PersistentStorage.get(key);
                if (seen === "true") {
                    startedRef.current = true;
                    return;
                }
            } catch {
                // Storage failed — fall through and show once per session.
            }
            if (cancelled || startedRef.current || isActive) return;
            startedRef.current = true;
            // Mark seen up front so a refresh/dismiss doesn't replay it.
            PersistentStorage.set(key, "true").catch(() => {});
            start(tour);
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled, isFocused, ready, isActive, manager?.id, xl, feature, web, mobile, start]);
}
