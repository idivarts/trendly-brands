import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { captureAttribution, toSuperProperties } from "@/utils/attribution";
import { initBranch } from "@/utils/observability/branch";
import { createPostHogSink } from "@/utils/observability/posthog";
import { clearSentryUser, initSentry, setSentryUser } from "@/utils/observability/sentry";
import { resolveTokenStatus } from "@/hooks/use-entitlements";
import { MARKETING, isConfigured } from "@/shared-constants/marketing";
import {
    identify,
    registerSink,
    reset,
    setSuperProperties,
    track,
} from "@/shared-libs/utils/analytics";
import { APP_STAGE } from "@/shared-libs/utils/environment";
import { firebaseSink } from "@/shared-libs/utils/analytics/sinks/firebase";
import { metaSink } from "@/shared-libs/utils/analytics/sinks/meta";
import Constants from "expo-constants";
import { usePathname } from "expo-router";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Boots analytics + error reporting and keeps the session's identity and
 * super-properties in sync.
 *
 * Split in two on purpose:
 *   - AnalyticsProvider mounts at the ROOT, because Sentry and attribution
 *     capture must be running before anything can fail or before the URL's
 *     click IDs are navigated away from.
 *   - AnalyticsOrgSync mounts inside (main), where the org and brand contexts
 *     actually exist. Merging those into super-properties at the root is
 *     impossible — the providers are further down the tree.
 */

let bootstrapped = false;

const bootstrap = () => {
    if (bootstrapped) return;
    bootstrapped = true;

    // Errors first: everything after this point is then reportable.
    initSentry();

    // Firebase/GA4 — the Google Ads conversion + audience link. Web-only by
    // construction (see the sink), which is fine: ads drive to web signup.
    registerSink(firebaseSink);

    // Meta pixel — only fires where MarketingPixels installed fbq, i.e. web.
    if (isConfigured(MARKETING.META_PIXEL_ID)) registerSink(metaSink);

    // PostHog — the only product-analytics sink that works on native.
    const posthog = createPostHogSink();
    if (posthog) registerSink(posthog);

    setSuperProperties({
        environment: APP_STAGE,
        site: "brands",
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version,
    });
};

export const AnalyticsProvider = ({ children }: PropsWithChildren) => {
    const { manager, session } = useAuthContext();
    const pathname = usePathname();
    const identifiedRef = useRef<string | null>(null);

    useEffect(() => {
        bootstrap();

        // Read click IDs off the URL before any navigation replaces it.
        captureAttribution()
            .then((data) => setSuperProperties(toSuperProperties(data)))
            .catch(() => {
                // Attribution is best-effort; never block boot on it.
            });

        // Branch supplies the native half of attribution (install + deferred
        // deep link); on web it is a no-op.
        let unsubscribe: (() => void) | undefined;
        initBranch((props) => setSuperProperties(props))
            .then((fn) => {
                unsubscribe = fn;
            })
            .catch(() => {
                // Same reasoning as above.
            });

        return () => unsubscribe?.();
    }, []);

    // Identity. Keyed on the manager id so a re-render can't re-identify, and
    // so a sign-out followed by a different sign-in is handled correctly.
    useEffect(() => {
        const id = manager?.id;

        if (!session || !id) {
            if (identifiedRef.current) {
                identifiedRef.current = null;
                clearSentryUser();
                // Drops super-properties too, so the next user on this device
                // does not inherit the previous user's org and plan.
                reset();
            }
            return;
        }

        if (identifiedRef.current === id) return;
        identifiedRef.current = id;

        identify(id, { email: manager?.email, name: manager?.name });
        setSentryUser(id, manager?.email);
    }, [session, manager?.id, manager?.email, manager?.name]);

    // Screen views.
    useEffect(() => {
        if (!pathname) return;
        track("screen_viewed", { path: pathname });
    }, [pathname]);

    return <>{children}</>;
};

/**
 * Keeps org/brand/plan context on every event. Mounted inside (main) because
 * that is where OrganizationProvider and BrandContextProvider live.
 *
 * Renders nothing — it exists only for the effect.
 */
export const AnalyticsOrgSync = () => {
    const { selectedBrand } = useBrandContext();
    const { selectedOrganization, selectedOrgBilling, selectedOrgWallet } =
        useOrganizationContext();

    useEffect(() => {
        const planKey = selectedOrgBilling?.planKey;

        setSuperProperties({
            org_id: selectedOrganization?.id,
            brand_id: selectedBrand?.id,
            plan_key: planKey,
            is_paid: planKey ? planKey !== "free" : undefined,
            token_state: resolveTokenStatus(selectedOrgWallet).state,
        });
    }, [
        selectedOrganization?.id,
        selectedBrand?.id,
        selectedOrgBilling?.planKey,
        selectedOrgWallet?.balance,
        selectedOrgWallet?.topupBalance,
        selectedOrgWallet?.monthlyAllotment,
    ]);

    return null;
};

