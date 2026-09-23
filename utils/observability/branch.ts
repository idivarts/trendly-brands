import type { AnalyticsSuperProperties } from "@/shared-constants/analytics-events";

/**
 * Branch — web build.
 *
 * Deliberately a no-op. Branch's value here is deferred deep linking and
 * INSTALL attribution, neither of which exists on web; web attribution is
 * handled by click-ID capture in utils/attribution.ts instead.
 *
 * The real implementation is branch.native.ts.
 */
export const initBranch = async (
    _onAttribution: (props: AnalyticsSuperProperties) => void
): Promise<() => void> => {
    return () => { };
};
