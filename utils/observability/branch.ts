import type { AnalyticsSuperProperties } from "@/shared-constants/analytics-events";
import type { AnalyticsSink } from "@/shared-libs/utils/analytics";

/**
 * Branch — web build.
 *
 * Deliberately a no-op. Branch's value here is deferred deep linking, INSTALL
 * attribution and forwarding mobile conversions to the ad networks, none of
 * which exists on web; web attribution is handled by click-ID capture in
 * utils/attribution.ts, and web conversions go to the Meta pixel and GA4 sinks.
 *
 * This file is also what keeps react-native-branch out of the web bundle
 * entirely: the SDK's RNBranch module THROWS "Unsupported platform" at import
 * time off iOS/Android, so the web path must not import it even transitively.
 * Metro picks branch.native.ts on native and this on web.
 *
 * The real implementation is branch.native.ts.
 */
export const initBranch = async (
    _onAttribution: (props: AnalyticsSuperProperties) => void
): Promise<() => void> => {
    return () => { };
};

/** No Branch SDK on web, so there is nothing to report conversions to. */
export const createBranchSink = (): AnalyticsSink | null => null;
