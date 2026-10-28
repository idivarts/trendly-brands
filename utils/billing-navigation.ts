import type { UpgradeSource } from "@/shared-constants/analytics-events";
import { track } from "@/shared-libs/utils/analytics";
import { router, type Href } from "expo-router";

/**
 * The single way to reach the billing screen.
 *
 * Every upgrade CTA in the app used to call `router.push("/billing")` directly
 * — fourteen sites, none of which recorded the click. Fourteen hand-written
 * `track()` calls would have fixed that until the fifteenth door shipped
 * without one, so the navigation itself is the thing that reports.
 *
 * It does two jobs that have to stay together:
 *   1. emits `upgrade_cta_clicked` — the user ACTED on a wall, which is the
 *      rung between hitting a limit and looking at pricing, and the one the
 *      funnel was missing entirely.
 *   2. carries `?from=<source>` so the billing screen can report a real
 *      `paywall_viewed.trigger`. Before this it had two possible values for
 *      fourteen doors, so it could not say why anyone was looking at pricing.
 *
 * `feature` and `reason` are passed where the door knows them: `reason`
 * separates a plan lock from exhausted tokens, which is the difference between
 * "upgrade" and "top up" and therefore between two different conversations.
 */
export const goToBilling = (
    source: UpgradeSource,
    meta?: { feature?: string; reason?: string }
): void => {
    track("upgrade_cta_clicked", {
        source,
        feature: meta?.feature,
        reason: meta?.reason,
    });
    router.push(`/billing?from=${source}` as Href);
};
