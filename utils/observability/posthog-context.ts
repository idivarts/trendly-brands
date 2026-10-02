import type { AnalyticsSuperProperties } from "@/shared-constants/analytics-events";

/**
 * Translate the vendor-neutral session context into PostHog's own conventions,
 * for both the web and native sinks.
 *
 * Only `screen` is renamed. PostHog's "URL / Screen" column, its session
 * replay and its `$exception` events all read `$screen_name`, and the two SDKs
 * are asymmetric about supplying it:
 *
 *   - posthog-js derives the web equivalent (`$current_url`, `$pathname`) from
 *     the document on every capture, so the column has always worked there.
 *   - posthog-react-native derives nothing. There is no document, and its
 *     `captureScreens` autocapture option cannot see expo-router's navigation
 *     state anyway (the SDK's own typings say so, and it only runs under
 *     <PostHogProvider>, which this app does not use). So on native nothing
 *     carries a screen unless we register it.
 *
 * Everything else passes through unchanged — org_id, plan_key and the rest are
 * our own dimensions and PostHog has no opinion on their names.
 */
export const toPostHogContext = (
    props: AnalyticsSuperProperties
): Record<string, any> => {
    const { screen, ...rest } = props;
    // `screen` is deliberately not forwarded under its own name: `track`
    // already spreads it onto every event it sends, so registering it twice
    // would put two names for one value on every event.
    return screen ? { ...rest, $screen_name: screen } : { ...rest };
};
