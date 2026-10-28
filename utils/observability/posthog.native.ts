import { hasValue, OBSERVABILITY } from "@/shared-constants/marketing";
import type { AnalyticsSink } from "@/shared-libs/utils/analytics";
import PostHog from "posthog-react-native";
import { compact, toPostHogContext } from "./posthog-context";

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
            // Whether to record at all, sampling rate, linked flags and event
            // triggers do all stay in the dashboard. Masking does NOT: the RN
            // SDK never reads session_recording_masking_config (that field is
            // posthog-js's), and takes masking only from a local
            // sessionReplayConfig. There is deliberately none here, which is
            // also the privacy-safe choice — maskAllTextInputs, maskAllImages
            // and maskAllSandboxedViews each default to true, so text, images
            // and system pickers are all masked on device. Passing a config to
            // tune anything else keeps those defaults; passing one that sets
            // them false is the only way to expose user content, so don't.
            //
            // The flag alone is not enough: the recorder itself is native code
            // in @posthog/react-native-plugin, an OPTIONAL peer dependency.
            // posthog-react-native require()s it behind a try/catch and guards
            // every replay call on the result, so with the package missing this
            // flag no-ops in total silence — events keep flowing while replay
            // produces nothing. Keep it in package.json, and remember a version
            // bump of it needs a native rebuild, not just an OTA update.
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
        // posthog-react-native has no setPersonProperties (that is posthog-js's
        // API), so this goes through the `$set` event, which is PostHog's own
        // documented way to write person properties without re-identifying.
        // Re-identifying would be the wrong tool: identify() with properties
        // can only $set, and would lose the $set_once distinction that
        // plan_key_first and became_paid_at depend on.
        setPersonProperties: (props, once) => {
            const $set = compact(props);
            const $set_once = once ? compact(once) : {};
            if (!Object.keys($set).length && !Object.keys($set_once).length) return;
            client.capture("$set", { $set, $set_once });
        },
        reset: () => {
            client.reset();
        },
    };
};
