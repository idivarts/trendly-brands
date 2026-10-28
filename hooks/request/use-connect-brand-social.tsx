import { useBrandContext } from "@/contexts/brand-context.provider";
import type { SocialEntryPoint } from "@/shared-constants/analytics-events";
import { track } from "@/shared-libs/utils/analytics";
import { IS_LIVE } from "@/shared-libs/utils/environment";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { rememberSocialConnectAttempt } from "@/utils/social-connect-attempt";
import { Linking, Platform } from "react-native";

const CONNECT_BASE = IS_LIVE
    ? "https://connect.trendly.now"
    : "https://dev.connect.trendly.now";

const useConnectBrandSocial = () => {
    const { selectedBrand } = useBrandContext();

    const connectSocial = async (
        platform?: string,
        /** Which door the user came through, for the callback to report. */
        context?: {
            entryPoint: SocialEntryPoint;
            platformsConnected: number;
            isReconnect: boolean;
        }
    ) => {
        const token = await AuthApp.currentUser?.getIdToken();
        if (!token) return;

        if (platform && context) {
            // The handoff out of the app, and the ONLY denominator for
            // "started a connection and never came back" — everything between
            // here and the callback happens in trendly-connect, including the
            // platform's own permission screen, which is where people drop.
            track("social_connect_started", {
                platform,
                entry_point: context.entryPoint,
                is_reconnect: context.isReconnect,
                platforms_connected: context.platformsConnected,
            });
            // Parked in storage rather than memory: on web the callback opens
            // in a NEW TAB, so nothing in this closure is reachable from it.
            await rememberSocialConnectAttempt({
                platform,
                entryPoint: context.entryPoint,
                platformsConnected: context.platformsConnected,
                brandId: selectedBrand?.id,
                startedAt: Date.now(),
            });
        }

        const url = new URL(`${CONNECT_BASE}/connect/`);
        url.searchParams.set("token", token);
        url.searchParams.set("app", "brands");
        url.searchParams.set("callbackScheme", "trendly-brands");
        if (!IS_LIVE) url.searchParams.set("stage", "dev");
        if (selectedBrand?.id) url.searchParams.set("brandId", selectedBrand.id);
        if (platform) url.searchParams.set("platform", platform);

        if (Platform.OS === "web") {
            window.open(url.toString(), "_blank");
        } else {
            await Linking.openURL(url.toString());
        }
    };

    return { connectSocial };
};

export default useConnectBrandSocial;
