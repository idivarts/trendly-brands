import type { AnalyticsSuperProperties } from "@/shared-constants/analytics-events";
import { setPendingDeepLink } from "@/utils/deep-link-intent";
import { Console } from "@/shared-libs/utils/console";
import type { AnalyticsSink } from "@/shared-libs/utils/analytics";
import Constants from "expo-constants";
import branch, { BranchEvent } from "react-native-branch";
import { resolveBranchEvent } from "./branch-event-map";

/**
 * Branch — native build.
 *
 * Three jobs:
 *  1. DEFERRED DEEP LINKING — a user who taps an ad, installs from the store,
 *     and opens the app for the first time still lands on the intended screen.
 *     Plain Universal Links cannot do this: the link is consumed by the store,
 *     so the destination is lost across the install.
 *  2. INSTALL ATTRIBUTION — reports which campaign produced the install, and
 *     feeds ~campaign/~channel into every analytics event as super-properties,
 *     which is what makes CAC-per-channel answerable.
 *  3. CONVERSION EVENTS — reports signup, trial and subscription back to Branch
 *     (createBranchSink below), which forwards them to the ad networks. Without
 *     this, Branch knows only that an install happened, so Meta can optimise
 *     for installers and nothing further down the funnel.
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

/** Unfilled placeholders count as absent — same convention as plugins/with-branch.js. */
const isSet = (value: string | undefined): boolean =>
    !!value && !value.startsWith("REPLACE_WITH_");

/**
 * Whether the build actually carries Branch credentials.
 *
 * This has to agree with plugins/with-branch.js, because that plugin decides
 * whether a key was ever compiled into Info.plist / AndroidManifest — and
 * calling into a native SDK that never initialised is what we are guarding
 * against. So it mirrors the plugin exactly on both counts:
 *
 *  - SOURCE: the env var first, `app.json` plugin props as the fallback. Reading
 *    only the props (as this did originally) could never return true, because
 *    the plugin is registered in app.json as a BARE STRING with no props object
 *    — all the real keys come from EXPO_PUBLIC_BRANCH_*. That silently disabled
 *    Branch wholesale: no subscribe, so no install attribution and no deferred
 *    deep linking either, even on builds whose native key was present and fine.
 *    `EXPO_PUBLIC_*` is inlined into the bundle by Metro, so it is readable here.
 *
 *  - CHOICE: the key for THIS stage, not either key. The plugin embeds
 *    `isProd ? liveKey : testKey`, so a build with only a live key configured
 *    has no Branch at all on dev, and checking `some()` would wrongly report it
 *    as configured and then call into an uninitialised SDK.
 *
 * The stage is read from the raw env var rather than APP_STAGE on purpose:
 * APP_STAGE folds in `__DEV__`, so a local debug build pointed at prod would
 * disagree with the plugin about which key was embedded. Here the question is
 * only ever "what did the build do", and the plugin's own expression answers it.
 */
const isBranchConfigured = (): boolean => {
    const plugins = Constants.expoConfig?.plugins ?? [];
    const entry = plugins.find(
        (p) => Array.isArray(p) && typeof p[0] === "string" && p[0].includes("with-branch")
    );
    const props = (Array.isArray(entry) ? entry[1] : undefined) as
        | Record<string, string>
        | undefined;

    const key =
        process.env.EXPO_PUBLIC_APP_STAGE === "prod"
            ? process.env.EXPO_PUBLIC_BRANCH_LIVE_KEY || props?.liveKey
            : process.env.EXPO_PUBLIC_BRANCH_TEST_KEY || props?.testKey;

    return isSet(key);
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

            // Deferred deep link: record where the app should go, but do NOT
            // navigate from here. This callback can fire before the router has
            // mounted and before auth has settled, so navigating directly races
            // the boot gate in app/_layout.tsx and loses the destination — see
            // utils/deep-link-intent.ts. The gate replays it when it is safe to.
            //
            // The path is only ever a screen, never an origin: a Branch link is
            // attacker-controllable, so setPendingDeepLink rejects anything that
            // is not an in-app path.
            const path = p.$deeplink_path;
            if (path) setPendingDeepLink(path);
        });
    } catch (error) {
        Console.error(error, "Branch init");
        return () => { };
    }
};

/**
 * The dimensions worth sending to Branch alongside a conversion.
 *
 * An allowlist rather than the whole payload, for the same reason the Meta sink
 * forwards only three fields: `track()` spreads every super-property onto every
 * event, so passing it through verbatim would put ~13 keys on each conversion —
 * including `screen` and `token_state`, which say nothing about a conversion.
 *
 * `campaign` / `channel` / `utm_*` are excluded deliberately rather than by
 * omission: on native those values CAME from Branch (see initBranch above), so
 * sending them back is circular, and a stale copy could disagree with Branch's
 * own ~campaign on the same event.
 */
const CUSTOM_DATA_KEYS = [
    // Who converted, and into what.
    "plan_key",
    "provider",
    "is_trial",
    // How they signed up — the only param signup_completed carries.
    "method",
    "has_attribution",
    // Which social, for the activation event.
    "platform",
    // The join key back to our own data.
    "org_id",
    // Second line of defence if a TEST key ever ships to prod, matching why the
    // `environment` super-property exists at all.
    "environment",
] as const;

/**
 * Branch's customData accepts strings only — the SDK warns and the value is
 * unusable otherwise (see _convertParams in react-native-branch/src/BranchEvent.js).
 *
 * Numbers and booleans are therefore stringified rather than dropped, and
 * anything else (an event's `platforms: string[]`, say) is skipped: those are
 * dimensions PostHog already holds, and they would reach Branch's dashboard as
 * "[object Object]".
 */
export const toCustomData = (props: Record<string, any>): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const key of CUSTOM_DATA_KEYS) {
        const value = props[key];
        if (value === null || value === undefined) continue;
        const type = typeof value;
        if (type === "string") out[key] = value as string;
        else if (type === "number" || type === "boolean") out[key] = String(value);
    }
    return out;
};

/**
 * Branch sink — the conversion half of the integration.
 *
 * Why a sink rather than a `branch.logEvent` call next to each signup and
 * checkout: the funnel is already emitted through the analytics facade from one
 * place per event (auth-context for signup, SubscriptionTransitionWatcher for
 * plan changes). Adding a second, parallel set of call sites would be one more
 * thing to forget on the next funnel change, and the two would drift. This way
 * Branch sees exactly what PostHog and Meta see.
 *
 * Returns null when Branch is not provisioned for this stage, which keeps it
 * consistent with createPostHogSink and means an unprovisioned build simply has
 * no Branch sink instead of calling into an uninitialised native SDK.
 */
export const createBranchSink = (): AnalyticsSink | null => {
    if (!isBranchConfigured()) return null;

    return {
        name: "branch",

        track: (event, props) => {
            const mapped = resolveBranchEvent(event, props);
            if (!mapped) return;

            // Resolve a standard event's NAME against the SDK's own constants,
            // rather than hardcoding Branch's wire strings in the map.
            const name = mapped.standard
                ? BranchEvent[mapped.standard]
                : mapped.custom;
            if (!name) return;

            // Revenue is attached only where the map says money actually moved,
            // so a trial start is never reported as revenue. `revenue` is
            // stringified by the SDK itself for iOS's NSDecimalNumber, so a
            // number is the right thing to pass.
            const revenue = mapped.withRevenue ? props.value : undefined;

            new BranchEvent(name, undefined, {
                ...(revenue !== undefined ? { revenue } : {}),
                ...(revenue !== undefined && props.currency
                    ? { currency: props.currency }
                    : {}),
                customData: toCustomData(props),
            })
                // logEvent queues and retries internally, so a failure here is
                // a programming error rather than a network one — but it must
                // never reach the UI that emitted the event.
                .logEvent()
                .catch((error) => Console.error(error, "Branch logEvent"));
        },

        /**
         * Ties Branch's events to our own user id, so a conversion can be
         * joined back to the install and the campaign that produced it. Branch
         * calls this the "identity"; it is also what its own cohort reporting
         * dedupes on.
         */
        identify: (userId) => {
            branch.setIdentity(userId);
        },

        /**
         * Branch's own logout, NOT a tracking opt-out. It clears the identity
         * and the install's referring params so the next user to sign in on
         * this device does not inherit the previous user's attribution — which
         * is the same reason the facade's reset() drops super-properties.
         */
        reset: () => {
            branch.logout();
        },
    };
};
