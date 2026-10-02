import type { AnalyticsSuperProperties } from "@/shared-constants/analytics-events";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { Platform } from "react-native";

/**
 * Captures where a user came from, so paid spend can be tied to a signup.
 *
 * The problem this solves: the marketing site is www.trendly.now and the app is
 * brands.trendly.now. An ad click lands on the marketing site carrying gclid /
 * fbclid, then the user follows a CTA to a DIFFERENT origin — and those
 * parameters are gone. The signup then looks organic, and no campaign can be
 * credited with it.
 *
 * So the first thing the web app does on boot is read whatever attribution
 * parameters are on its own URL and persist them, because by the time the user
 * finishes signing up the URL has long since changed.
 *
 * ⚠️ DEPENDENCY: this only ever sees values if trendly-website forwards them on
 * its CTAs (lib/site-config.ts LINKS → brands.trendly.now). Until that ships,
 * this captures nothing on ad traffic — direct visits with parameters still work.
 *
 * Attribution is deliberately long-lived: signup often happens days after the
 * click, so this is stored without a TTL rather than in a session.
 */

const STORAGE_KEY = "attribution_v1";

/** Click IDs are the ad-platform join keys; UTMs are the human-readable source. */
const TRACKED_PARAMS = [
    "gclid",
    "fbclid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
] as const;

export type AttributionData = Partial<Record<(typeof TRACKED_PARAMS)[number], string>>;

const readFromUrl = (): AttributionData => {
    // Native has no URL to read — Branch supplies install attribution there.
    if (Platform.OS !== "web" || typeof window === "undefined") return {};

    try {
        const params = new URLSearchParams(window.location.search);
        const found: AttributionData = {};
        for (const key of TRACKED_PARAMS) {
            const value = params.get(key);
            if (value) found[key] = value;
        }
        return found;
    } catch {
        return {};
    }
};

/**
 * Read attribution off the current URL and persist it if present.
 *
 * Existing values are NOT overwritten by an empty visit, so a later direct
 * visit cannot erase the original paid click. A NEW campaign click does
 * overwrite — last non-empty touch wins, which matches how the ad platforms
 * themselves attribute.
 */
export const captureAttribution = async (): Promise<AttributionData> => {
    const fromUrl = readFromUrl();

    if (Object.keys(fromUrl).length > 0) {
        try {
            await PersistentStorage.set(STORAGE_KEY, JSON.stringify(fromUrl));
        } catch {
            // A full/blocked storage quota must not break app boot.
        }
        return fromUrl;
    }

    return getStoredAttribution();
};

export const getStoredAttribution = async (): Promise<AttributionData> => {
    try {
        const raw = await PersistentStorage.get(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AttributionData) : {};
    } catch {
        return {};
    }
};

/** True when this user arrived with any campaign context at all. */
export const hasAttribution = (data: AttributionData): boolean =>
    Object.keys(data).length > 0;

/** Reshape into the subset of super-properties the analytics facade expects. */
export const toSuperProperties = (data: AttributionData): AnalyticsSuperProperties => ({
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
});
