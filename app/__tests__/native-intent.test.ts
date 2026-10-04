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

    describe("everything else passes through", () => {
        it.each([
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
