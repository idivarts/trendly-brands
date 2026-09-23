import { hasValue, OBSERVABILITY } from "@/shared-constants/marketing";
import type { AnalyticsSink } from "@/shared-libs/utils/analytics";
import PostHog from "posthog-react-native";

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
        reset: () => {
            client.reset();
        },
    };
};
