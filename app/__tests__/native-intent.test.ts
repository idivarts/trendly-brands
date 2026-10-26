import { redirectSystemPath } from "../+native-intent";

/**
 * `redirectSystemPath` sends Branch URLs to `/` so the router does not try to
 * match an opaque Branch link ID against the route tree, and passes everything
 * else through untouched. The host list it keys off has to stay in step with
 * `ios.associatedDomains` / `android.intentFilters` in app.json.
 */
describe("redirectSystemPath", () => {
    const swallowed = (path: string) =>
        redirectSystemPath({ path, initial: true });

    describe("Branch links are handed to Branch", () => {
        it.each([
            // Custom live domain (CNAME onto Branch).
            "https://share.trendly.now/OcjIGZkVU6b",
            // Branch-owned default domains, live + test, plain + -alternate.
            "https://zgh4c.app.link/OcjIGZkVU6b",
            "https://zgh4c-alternate.app.link/OcjIGZkVU6b",
            "https://zgh4c.test-app.link/OcjIGZkVU6b",
            "https://zgh4c-alternate.test-app.link/OcjIGZkVU6b",
        ])("redirects %s to /", (url) => {
            expect(swallowed(url)).toBe("/");
        });
    });

    /**
     * When the OS does not claim the link (Android App Links unverified, or the
     * tap happening in an in-app webview), the Branch page bounces into the app
     * over the custom scheme instead — `intent://open?…#Intent;scheme=…` — and
     * `open` is not a route.
     */
    describe("Branch's custom-scheme entry point is handed to Branch", () => {
        it.each([
            // Exactly what Android's intent:// fallback resolves to, params and all.
            "trendly-brands://open?_branch_referrer=H4sIAAAAAAAAAwXBQQ&link_click_id=1643356066691905396",
            // The no-param form, driven by the branch_intent intent extra.
            "trendly-brands://open",
            "trendly-brands://open/",
            "trendly-brands://open#fragment",
            // The scheme lives in app.json, so a rename must not switch this off.
            "trendly://open?link_click_id=1",
        ])("redirects %s to /", (url) => {
            expect(swallowed(url)).toBe("/");
        });
    });

    describe("everything else passes through", () => {
        it.each([
            // A link that DOES carry $android_deeplink_path arrives on the custom
            // scheme as a real route, and must reach the router untouched.
            "trendly-brands://share/tok123?link_click_id=1643356066691905396",
            // `open` is an ordinary first path segment over http(s) — only the
            // custom scheme's host is Branch's reserved target.
            "https://brands.trendly.now/open",
            // ...and only as the WHOLE host, not as a prefix of one.
            "trendly-brands://opendoc/42",
            // Sibling hosts under trendly.now must NOT be swallowed — the
            // custom domain is matched exactly, never by suffix.
            "https://brands.trendly.now/share/abc123",
            "https://be.trendly.now/api/v2/health",
            "https://trendly.now/pricing",
            // A look-alike that a bare suffix comparison would catch.
            "https://myapp.link/foo",
            // Custom scheme and bare paths.
            "trendly-brands://content/42",
            "/content/42",
        ])("leaves %s untouched", (path) => {
            expect(swallowed(path)).toBe(path);
        });
    });
});
