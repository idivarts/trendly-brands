import { resolveBranchEvent } from "../branch-event-map";
import { toCustomData } from "../branch.native";

/**
 * Branch is what Meta reads for app campaigns, so this map decides what the ad
 * networks are allowed to optimise against. The properties locked in here are
 * the ones that would silently mis-bid rather than fail loudly:
 *
 *  - the funnel reaches Branch at all (the gap this integration closed: with no
 *    conversion events, Branch reports only installs);
 *  - a trial start and a paid charge stay distinct, and revenue rides only on
 *    the charge;
 *  - a restore is not a second sale.
 */

// react-native-branch reads its standard-event names off the native module and
// throws "Unsupported platform" at import. The sink's param coercion under test
// here does not touch the SDK, so a bare stub is enough to load the module.
jest.mock("react-native-branch", () => ({
    __esModule: true,
    default: { subscribe: jest.fn(), setIdentity: jest.fn(), logout: jest.fn() },
    BranchEvent: class {},
}));

describe("acquisition", () => {
    it("reports a completed signup as Branch's CompleteRegistration", () => {
        // The headline fix: this is what lets Meta optimise for registrations
        // instead of installs.
        expect(resolveBranchEvent("signup_completed", {})).toEqual({
            standard: "CompleteRegistration",
        });
    });

    it("keeps a login distinct from a signup, so it cannot inflate conversions", () => {
        expect(resolveBranchEvent("login_completed", {})).toEqual({ standard: "Login" });
    });

    it("forwards the activation step", () => {
        expect(resolveBranchEvent("social_connected", { platform: "instagram" })).toEqual({
            standard: "CompleteTutorial",
        });
    });
});

describe("monetisation", () => {
    it("reports a trial start as StartTrial", () => {
        expect(resolveBranchEvent("subscription_started", { is_trial: true })).toEqual({
            standard: "StartTrial",
        });
    });

    it("attaches no revenue to a trial, because no money has moved", () => {
        const spec = resolveBranchEvent("subscription_started", {
            is_trial: true,
            value: 49,
            currency: "USD",
        });
        expect(spec?.withRevenue).toBeFalsy();
    });

    it("reports a paid conversion as Subscribe, carrying revenue", () => {
        expect(resolveBranchEvent("subscription_started", { is_trial: false })).toEqual({
            standard: "Subscribe",
            withRevenue: true,
        });
    });

    it("treats a missing trial flag as a paid conversion", () => {
        // The flag is optional in the registry, so absence must not silently
        // downgrade a real sale into a trial.
        expect(resolveBranchEvent("subscription_started", {})?.standard).toBe("Subscribe");
    });

    it("forwards checkout intent", () => {
        expect(resolveBranchEvent("checkout_started", {})).toEqual({
            standard: "InitiatePurchase",
        });
    });

    it("sends cancellation as a custom event, since Branch has no standard one", () => {
        expect(resolveBranchEvent("subscription_cancelled", { plan_key: "pro" })).toEqual({
            custom: "trendly_subscription_cancelled",
        });
    });

    it("does NOT report a restore as a new subscription", () => {
        // A reinstall restoring an existing purchase would otherwise book the
        // same subscription twice.
        expect(resolveBranchEvent("subscription_restored", { plan_key: "pro" })).toBeNull();
    });
});

describe("everything else", () => {
    it("sends nothing for the product taxonomy Branch has no use for", () => {
        for (const event of [
            "screen_viewed",
            "ai_generation_completed",
            "inbox_reply_sent",
            "calendar_item_rescheduled",
            "content_created",
        ]) {
            expect(resolveBranchEvent(event, {})).toBeNull();
        }
    });
});

describe("customData", () => {
    it("stringifies booleans, which Branch would otherwise reject", () => {
        // Branch's SDK warns and the value is unusable unless it is a string.
        expect(toCustomData({ is_trial: true, plan_key: "pro" })).toEqual({
            is_trial: "true",
            plan_key: "pro",
        });
    });

    it("drops null and undefined rather than sending them as text", () => {
        expect(toCustomData({ plan_key: null, provider: undefined, method: "google" })).toEqual(
            { method: "google" }
        );
    });

    it("drops values Branch cannot represent, instead of [object Object]", () => {
        expect(toCustomData({ platform: ["instagram"], org_id: { a: 1 } })).toEqual({});
    });

    it("keeps the session noise off conversions", () => {
        // track() spreads every super-property onto every event; forwarding it
        // verbatim would put ~13 keys on each conversion.
        expect(
            toCustomData({ screen: "/billing", token_state: "low", app_version: "4.1.0" })
        ).toEqual({});
    });

    it("does not send Branch's own campaign data back to it", () => {
        // On native these came FROM Branch, so echoing them is circular and a
        // stale copy could contradict Branch's own ~campaign on the same event.
        expect(
            toCustomData({ campaign: "spring", channel: "facebook", utm_source: "ig" })
        ).toEqual({});
    });

    it("keeps the dimensions a conversion is actually segmented by", () => {
        expect(
            toCustomData({
                plan_key: "pro",
                provider: "iap",
                method: "apple",
                org_id: "org_1",
                environment: "prod",
                screen: "/pay-wall",
            })
        ).toEqual({
            plan_key: "pro",
            provider: "iap",
            method: "apple",
            org_id: "org_1",
            environment: "prod",
        });
    });
});
