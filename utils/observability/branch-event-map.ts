/**
 * Maps Trendly funnel events onto Branch's standard event vocabulary.
 *
 * Kept separate from the sink for the same reason sinks/meta-event-map.ts is:
 * these names are an external contract with the ad accounts Branch forwards to,
 * and changing one silently breaks whatever campaign optimises against it.
 *
 * Returns the NAME of a standard event rather than the SDK's constant, so this
 * table stays free of any react-native-branch import. That matters: the SDK's
 * RNBranch module throws "Unsupported platform" at import time off iOS and
 * Android, and the constants are read off the native module, so importing it
 * here would make this file unusable on web and a hazard to import by mistake.
 * branch.native.ts resolves the name against BranchEvent, where the import is
 * already native-only. The union is what keeps the names honest at compile time.
 */

/** The subset of Branch's standard events this app reports. Keys of `BranchEvent`. */
export type BranchStandardEvent =
    | "CompleteRegistration"
    | "Login"
    | "CompleteTutorial"
    | "InitiatePurchase"
    | "StartTrial"
    | "Subscribe";

export interface BranchEventSpec {
    /** A Branch standard event, forwarded to the ad networks by name. */
    standard?: BranchStandardEvent;
    /** A Branch custom event, for funnel steps Branch has no standard name for. */
    custom?: string;
    /** Attach `value`/`currency` as Branch revenue. Only where money moved. */
    withRevenue?: boolean;
}

/**
 * Resolve the Branch event for a Trendly event, or null to send nothing.
 *
 * A function rather than a flat lookup table because one Trendly event maps to
 * two different Branch events depending on its params — see subscription_started.
 *
 * ── Deliberately NOT forwarded ──────────────────────────────────────────────
 * Branch's value is attribution, so it gets the funnel the ad networks can
 * optimise against and nothing else. Forwarding the full product taxonomy
 * (screen_viewed, ai_generation_*, inbox_*, calendar_*) would bloat the event
 * set without improving delivery, and PostHog already answers those questions.
 *
 * `subscription_restored` is excluded for a sharper reason: restoring an
 * existing purchase on a reinstall is not a new conversion, and mapping it to
 * Subscribe would book the same subscription twice.
 */
export const resolveBranchEvent = (
    event: string,
    props: Record<string, any>
): BranchEventSpec | null => {
    switch (event) {
        // ── Acquisition ─────────────────────────────────────────────────────
        // ⭐ The conversion this integration exists for. Without it Branch only
        // ever reports installs, so Meta optimises for people who install the
        // app rather than people who go on to create an account.
        case "signup_completed":
            return { standard: "CompleteRegistration" };

        // A returning user, not a conversion. Forwarded because it is what
        // separates reactivation from acquisition in Branch's own reporting.
        case "login_completed":
            return { standard: "Login" };

        // ── Activation ──────────────────────────────────────────────────────
        // Connecting a social account is the point the product becomes usable,
        // and the best available proxy for "this signup was real". Branch has no
        // Lead event (which is what the Meta pixel map uses); CompleteTutorial
        // is its standard user-lifecycle event for finishing setup.
        case "social_connected":
            return { standard: "CompleteTutorial" };

        // ── Monetisation ────────────────────────────────────────────────────
        case "checkout_started":
            return { standard: "InitiatePurchase" };

        case "subscription_started":
            // ⭐ A trial start and a paid charge are different events to a
            // bidding algorithm: the trial is the earliest signal dense enough
            // to optimise on, the purchase is what revenue is measured on.
            //
            // Revenue rides ONLY on the paid branch. A trial has taken no
            // money, so attaching `value` there would report revenue that may
            // never arrive and inflate ROAS for every campaign feeding trials.
            return props.is_trial
                ? { standard: "StartTrial" }
                : { standard: "Subscribe", withRevenue: true };

        // Branch has no standard cancellation event, so this is custom. It is
        // still worth sending: it is the churn denominator, and it lets a
        // campaign's cohort be judged on subscriptions that survived.
        case "subscription_cancelled":
            return { custom: "trendly_subscription_cancelled" };

        default:
            return null;
    }
};
