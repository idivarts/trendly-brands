import { hasValue, OBSERVABILITY } from "@/shared-constants/marketing";
import type { AnalyticsSink } from "@/shared-libs/utils/analytics";
import PostHog from "posthog-react-native";
import { toPostHogContext } from "./posthog-context";

/**
 * PostHog sink — native build (posthog-react-native).
 *
 * This is the ONLY product-analytics sink that works on device: the Firebase
 * sink is web-only by construction (firebase/analytics has no native
 * implementation, which is why shared-libs ships an analytics.native.ts stub).
 * Without this, native would keep emitting nothing at all.
 */
export const createPostHogSink = (): AnalyticsSink | null => {
    if (!hasValue(OBSERVABILITY.POSTHOG_KEY)) return null;

    let client: PostHog;
    try {
        client = new PostHog(OBSERVABILITY.POSTHOG_KEY, {
            host: OBSERVABILITY.POSTHOG_HOST,
            // Install / open / update events come free and are the backbone of
            // any retention curve.
            captureAppLifecycleEvents: true,

            // Master switch for mobile session replay, NOT a replay setting.
            // Unlike posthog-js — where replay is on unless you pass
            // disable_session_recording — the React Native SDK defaults this to
            // false, and it is read once at setup. Leaving it off means the
            // "Record user sessions" toggle in the PostHog project settings has
            // no effect on device, however it is configured.
            //
            // Everything that actually shapes replay — whether to record at
            // all, sampling rate, linked flags, event triggers, masking rules —
            // stays in the dashboard. Deliberately no sessionReplayConfig here,
            // so nothing is pinned client-side.
            enableSessionReplay: true,

            // Parity with the web sink: only bill person profiles for users
            // who actually signed up. Left unset, the native default differs
            // from posthog-js's configured behaviour, so the same anonymous
            // visitor would be counted differently depending on platform.
            personProfiles: "identified_only",
        });
    } catch (error) {
        console.warn("[posthog] native init failed, continuing without it", error);
        return null;
    }

    return {
        name: "posthog",
        track: (event, props) => {
            client.capture(event, props);
        },
        identify: (userId, traits) => {
            client.identify(userId, traits);
        },
        // Super-properties, so the context reaches the events this sink never
        // sees: $exception, the captureAppLifecycleEvents above, and session
        // replay. register() persists them, and client.reset() below clears
        // them, which is what keeps one user's screen and plan off the next
        // user's events on a shared device.
        setContext: (props) => {
            client.register(toPostHogContext(props));
        },
        reset: () => {
            client.reset();
        },
    };
};
