import {
    consumePendingDeepLink,
    getPendingDeepLink,
    isPublicDeepLink,
    setPendingDeepLink,
    subscribeToPendingDeepLink,
} from "../deep-link-intent";

/**
 * The store is the whole fix for the cold-start race, so the two properties the
 * boot gate leans on are locked in here:
 *
 *  - a destination survives until something is in a position to honour it, and
 *    is then honoured exactly once (consume-once is what stops the gate from
 *    navigating to the same path again on its next run);
 *  - every transition notifies, including the clear — without that the gate
 *    never re-runs for a warm-start tap, and never learns the path was used.
 *
 * Plus the security property: a Branch link picks a screen, never an origin.
 */

// The store is module state, so each test starts from a known-empty one.
beforeEach(() => {
    consumePendingDeepLink();
});

describe("parking a destination", () => {
    it("holds an in-app path", () => {
        setPendingDeepLink("/contents/abc123");
        expect(getPendingDeepLink()).toBe("/contents/abc123");
    });

    it("keeps query strings and fragments intact", () => {
        setPendingDeepLink("/contents/abc123?tab=preview#top");
        expect(getPendingDeepLink()).toBe("/contents/abc123?tab=preview#top");
    });

    it.each([
        ["an absolute http URL", "https://evil.example/steal"],
        ["a scheme-relative URL", "//evil.example/steal"],
        ["another app's scheme", "trendly-brands://contents/abc"],
        ["a bare relative path", "contents/abc123"],
        ["an empty string", ""],
    ])("rejects %s", (_label, path) => {
        setPendingDeepLink(path);
        expect(getPendingDeepLink()).toBeNull();
    });

    it("does not let a rejected path clear one already parked", () => {
        setPendingDeepLink("/contents/abc123");
        setPendingDeepLink("https://evil.example/steal");
        expect(getPendingDeepLink()).toBe("/contents/abc123");
    });
});

describe("consuming a destination", () => {
    it("returns the path once, then nothing", () => {
        setPendingDeepLink("/contents/abc123");

        expect(consumePendingDeepLink()).toBe("/contents/abc123");
        expect(consumePendingDeepLink()).toBeNull();
        expect(getPendingDeepLink()).toBeNull();
    });

    it("returns null when nothing is parked", () => {
        expect(consumePendingDeepLink()).toBeNull();
    });
});

describe("notifications", () => {
    it("fires when a destination is parked", () => {
        const listener = jest.fn();
        const unsubscribe = subscribeToPendingDeepLink(listener);

        setPendingDeepLink("/contents/abc123");

        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });

    it("fires when a destination is consumed", () => {
        setPendingDeepLink("/contents/abc123");

        const listener = jest.fn();
        const unsubscribe = subscribeToPendingDeepLink(listener);

        consumePendingDeepLink();

        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });

    it("stays quiet for a repeat of the path already parked", () => {
        setPendingDeepLink("/contents/abc123");

        const listener = jest.fn();
        const unsubscribe = subscribeToPendingDeepLink(listener);

        setPendingDeepLink("/contents/abc123");

        expect(listener).not.toHaveBeenCalled();
        unsubscribe();
    });

    it("stays quiet for a rejected path", () => {
        const listener = jest.fn();
        const unsubscribe = subscribeToPendingDeepLink(listener);

        setPendingDeepLink("https://evil.example/steal");

        expect(listener).not.toHaveBeenCalled();
        unsubscribe();
    });

    it("stops after unsubscribe", () => {
        const listener = jest.fn();
        subscribeToPendingDeepLink(listener)();

        setPendingDeepLink("/contents/abc123");

        expect(listener).not.toHaveBeenCalled();
    });
});

/**
 * The boot gate replays a public destination with no session, and parks every
 * other one behind sign-in. Getting this predicate wrong fails in one of two
 * expensive ways: too narrow and a shared link sends its recipient to sign-up;
 * too broad and an authenticated screen is navigated to with no session.
 */
describe("isPublicDeepLink", () => {
    it.each([
        "/share/abc123",
        "/influencer/xyz",
        "/influencer-list",
        "/influencer-images",
        "/collaboration-application",
    ])("accepts the public route %s", (path) => {
        expect(isPublicDeepLink(path)).toBe(true);
    });

    it.each([
        "/contents/abc123",
        "/content-calendar",
        "/billing",
        "/",
    ])("rejects the authenticated route %s", (path) => {
        expect(isPublicDeepLink(path)).toBe(false);
    });

    it("rejects an absolute URL even when it contains a public path", () => {
        expect(isPublicDeepLink("https://evil.example/share/abc")).toBe(false);
        expect(isPublicDeepLink("//evil.example/share/abc")).toBe(false);
    });

    it("does not accept a path that merely starts with a public segment", () => {
        // "/sharent" must not pass on the strength of "/share" — the prefixes
        // carry their trailing slash for exactly this reason.
        expect(isPublicDeepLink("/sharent/abc")).toBe(false);
    });
});
