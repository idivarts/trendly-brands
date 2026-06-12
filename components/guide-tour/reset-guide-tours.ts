import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Persisted "show this tour only once" keys. Clearing them re-arms every tour.
//  - `guide-tour-*`          → coachmark library showOnce flags + the
//                              useFeatureTour per-feature flags
//  - `discover-guide-tour-*` → Discover tour's app-level shown flag
//  - `survey-completed-*`    → Discover survey gate (replaying it replays the
//                              post-survey Discover tour)
const TOUR_PREFIXES = ["guide-tour-", "discover-guide-tour-"];
const DISCOVER_SURVEY_PREFIXES = ["survey-completed-"];

async function getAllKeys(): Promise<string[]> {
    if (Platform.OS === "web") {
        if (typeof localStorage === "undefined") return [];
        return Object.keys(localStorage);
    }
    return [...(await AsyncStorage.getAllKeys())];
}

async function removeKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (Platform.OS === "web") {
        keys.forEach((k) => localStorage.removeItem(k));
    } else {
        await AsyncStorage.multiRemove(keys);
    }
}

/**
 * QA helper — clears the persisted "seen" flags for the coach-mark tours so they
 * re-trigger on the next qualifying screen visit. After calling, reload the app
 * (web) or navigate back to the screen.
 *
 * @param opts.includeDiscover also reset the Discover tour + its survey gate
 *        (default true). Set false to only reset the content-planning tours
 *        (Strategy / Calendar / Content).
 * @returns the keys that were removed.
 */
export async function resetGuideTours(opts?: {
    includeDiscover?: boolean;
}): Promise<string[]> {
    const includeDiscover = opts?.includeDiscover ?? true;
    const prefixes = includeDiscover
        ? [...TOUR_PREFIXES, ...DISCOVER_SURVEY_PREFIXES]
        : TOUR_PREFIXES;
    const all = await getAllKeys();
    const toRemove = all.filter((k) => prefixes.some((p) => k.startsWith(p)));
    await removeKeys(toRemove);
    return toRemove;
}

// Convenience: expose on web so QA can run `__resetGuideTours()` straight from
// the browser console (then reload) without touching any UI. Dev builds only.
if (__DEV__ && Platform.OS === "web" && typeof globalThis !== "undefined") {
    (globalThis as any).__resetGuideTours = resetGuideTours;
}
