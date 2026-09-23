import { hasValue, OBSERVABILITY } from "@/shared-constants/marketing";
import type { AnalyticsSink } from "@/shared-libs/utils/analytics";
import posthog from "posthog-js";

/**
 * PostHog sink — web build (posthog-js).
 *
 * PostHog carries the questions GA4 answers badly: funnels, cohorts, retention,
 * "what % of signups activate". GA4 stays alongside it purely for the Google
 * Ads conversion/audience link.
 *
 * The native counterpart lives in posthog.native.ts; Metro picks per platform.
 */
export const createPostHogSink = (): AnalyticsSink | null => {
    if (!hasValue(OBSERVABILITY.POSTHOG_KEY)) return null;

    try {
        posthog.init(OBSERVABILITY.POSTHOG_KEY, {
            api_host: OBSERVABILITY.POSTHOG_HOST,
            // Screen views are emitted explicitly by the analytics provider off
            // expo-router, which knows the real route. PostHog's own pageview
            // detection double-counts client-side navigations.
            capture_pageview: false,
            // Only bill person profiles for users who actually signed up —
            // anonymous visitors still produce events, just not profiles.
            person_profiles: "identified_only",
            // Cookie on .trendly.now rather than brands.trendly.now, so one
            // distinct_id spans the marketing site, this app and the connect
            // bridge. This is posthog-js's default; set explicitly because the
            // cross-surface journey depends on it and a silent flip would break
            // attribution without any error.
            cross_subdomain_cookie: true,
        });
    } catch (error) {
        console.warn("[posthog] init failed, continuing without it", error);
        return null;
    }

    return {
        name: "posthog",
        track: (event, props) => posthog.capture(event, props),
        identify: (userId, traits) => posthog.identify(userId, traits),
        reset: () => posthog.reset(),
    };
};
