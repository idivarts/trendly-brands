import type { SocialEntryPoint } from "@/shared-constants/analytics-events";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";

/**
 * The in-flight social connect attempt, parked across the OAuth round trip.
 *
 * The connect flow leaves the app entirely — `window.open(..., "_blank")` on
 * web, the system browser on native — and comes back as a deep link. No
 * in-memory ref survives that: on web the callback lands in a NEW TAB, so the
 * handler runs in a fresh JS context with none of the state that started the
 * attempt. Storage does survive it (same origin on web, same process on
 * native), which is the only reason the success and failure events can name
 * the platform's entry point and time the round trip.
 *
 * `brandId` rides along for the same reason: on web the callback tab mounts
 * fresh, so the org/brand context has usually not resolved yet when the event
 * fires.
 */
export interface SocialConnectAttempt {
    platform: string;
    entryPoint: SocialEntryPoint;
    platformsConnected: number;
    brandId?: string;
    startedAt: number;
}

const KEY = "social_connect_attempt";

/** Attempts older than this are stale — a tab left open, a flow abandoned. */
const ATTEMPT_TTL_MS = 30 * 60 * 1000;

export const rememberSocialConnectAttempt = async (
    attempt: SocialConnectAttempt
): Promise<void> => {
    try {
        await PersistentStorage.set(KEY, JSON.stringify(attempt));
    } catch {
        // Blocked storage costs us the entry point and the duration, not the
        // event itself — the callback still reports the connection.
    }
};

/**
 * Read and clear the attempt. Cleared on read so a later reload of the
 * callback URL cannot report a second connection from one OAuth round trip.
 */
export const takeSocialConnectAttempt = async (): Promise<SocialConnectAttempt | null> => {
    try {
        const raw = await PersistentStorage.get(KEY);
        if (!raw) return null;
        await PersistentStorage.clear(KEY);
        const parsed = JSON.parse(raw) as SocialConnectAttempt;
        if (!parsed?.startedAt || Date.now() - parsed.startedAt > ATTEMPT_TTL_MS) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};
