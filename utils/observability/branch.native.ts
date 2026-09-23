import type { AnalyticsSuperProperties } from "@/shared-constants/analytics-events";
import { Console } from "@/shared-libs/utils/console";
import Constants from "expo-constants";
import { router } from "expo-router";
import branch from "react-native-branch";

/**
 * Branch — native build.
 *
 * Two jobs:
 *  1. DEFERRED DEEP LINKING — a user who taps an ad, installs from the store,
 *     and opens the app for the first time still lands on the intended screen.
 *     Plain Universal Links cannot do this: the link is consumed by the store,
 *     so the destination is lost across the install.
 *  2. INSTALL ATTRIBUTION — reports which campaign produced the install, and
 *     feeds ~campaign/~channel into every analytics event as super-properties,
 *     which is what makes CAC-per-channel answerable.
 *
 * Which Branch instance this talks to (TEST on dev, LIVE on prod) is decided at
 * BUILD time by plugins/with-branch.js, not here — the key is compiled into
 * Info.plist / AndroidManifest.
 *
 * ⚠️ Branch's free tier covers deep linking; full ad-network attribution
 * ("Universal Ads") is a paid add-on — confirm the account tier before relying
 * on (2) for campaign reporting.
 */

/** Branch's own reserved keys, which is where campaign context actually lives. */
interface BranchParams {
    "+clicked_branch_link"?: boolean;
    "~campaign"?: string;
    "~channel"?: string;
    "~feature"?: string;
    /** Set on a link to say where it should land, e.g. "/contents/abc123". */
    $deeplink_path?: string;
}

/**
 * Whether the build actually carries Branch credentials.
 *
 * Read from the config plugin's own props rather than a parallel env var, so
 * app.json stays the single source of truth for the keys. An unprovisioned
 * build still has the placeholder, and calling into an uninitialised native SDK
 * would throw.
 */
const isBranchConfigured = (): boolean => {
    const plugins = Constants.expoConfig?.plugins ?? [];
    const entry = plugins.find(
        (p) => Array.isArray(p) && typeof p[0] === "string" && p[0].includes("with-branch")
    );
    if (!Array.isArray(entry)) return false;

    const props = entry[1] as Record<string, string> | undefined;
    const keys = [props?.liveKey, props?.testKey];
    return keys.some((k) => !!k && !k.startsWith("REPLACE_WITH_"));
};

/**
 * Subscribe to Branch link opens. Returns an unsubscribe function.
 *
 * `onAttribution` is called only for real Branch link opens, so an ordinary
 * cold start never overwrites a previous campaign with empty values.
 */
export const initBranch = async (
    onAttribution: (props: AnalyticsSuperProperties) => void
): Promise<() => void> => {
    if (!isBranchConfigured()) return () => { };

    try {
        return branch.subscribe(({ error, params }) => {
            if (error) {
                Console.error(error, "Branch subscribe");
                return;
            }

            const p = (params ?? {}) as BranchParams;
            if (!p["+clicked_branch_link"]) return;

            onAttribution({
                campaign: p["~campaign"],
                channel: p["~channel"],
            });

            // Deferred deep link: route only for in-app paths, and never to a
            // URL supplied by the link itself — a Branch link is attacker-
            // controllable, so it may choose a screen but not an origin.
            const path = p.$deeplink_path;
            if (path && path.startsWith("/") && !path.startsWith("//")) {
                try {
                    router.push(path as never);
                } catch (e) {
                    Console.error(e, "Branch deep link routing");
                }
            }
        });
    } catch (error) {
        Console.error(error, "Branch init");
        return () => { };
    }
};
