/**
 * Expo Router native intent — keep Branch links away from the router.
 *
 * Expo Router v6 configures React Navigation with `prefixes: []`, which means
 * it does NOT filter incoming URLs by host: it strips the scheme + host off
 * whatever the OS hands it and matches the remaining path against the route
 * tree. A Branch universal link looks like
 *
 *     https://zgh4c.test-app.link/OcjIGZkVU6b
 *
 * so the router sees the path `/OcjIGZkVU6b`. That is a Branch link ID, not a
 * route — nothing matches, and the user lands on `+not-found` ("This screen
 * doesn't exist") the instant the app opens.
 *
 * The link ID is only meaningful to Branch, which resolves it server-side and
 * hands back the real destination in `$deeplink_path`. That round trip is
 * async, so it cannot happen here; `utils/observability/branch.native.ts`
 * already listens for it via `branch.subscribe` and routes when it arrives.
 *
 * All this hook has to do is stop the router from guessing in the meantime:
 * send Branch URLs to `/` (the normal entry gate) and let Branch do the
 * navigation a moment later. Every other URL — a real `trendly-brands://`
 * route, and any real https route — passes through untouched.
 *
 * ── The second shape: Branch's own custom-scheme entry point ────────────────
 * The https form above is only how the link arrives when the OS claims it
 * directly (an iOS Universal Link, or a VERIFIED Android App Link). Whenever it
 * is not claimed — Android App Links verification failing for the installed
 * signing cert, or the tap happening inside an in-app webview, where neither
 * platform's link claiming applies — the Branch page loads in the browser
 * instead and bounces into the app over the custom scheme:
 *
 *     https://share.trendly.now/kS5VyU24X6b
 *       → 307 https://zgh4c.app.link/kS5VyU24X6b?_p=…
 *       → 307 intent://open?_branch_referrer=…&link_click_id=…
 *              #Intent;scheme=trendly-brands;package=pro.trendly.brands;…
 *
 * so the app is opened on `trendly-brands://open?…`. Expo Router reads the
 * custom scheme's HOST as the first path segment (see `fromDeepLink` in
 * expo-router/fork/extractPathFromURL), so that is the route `open` — which
 * does not exist, and the user lands on `+not-found` again. `open` is Branch's
 * fixed "just launch the app" target, used whenever the link carries no
 * `$android_deeplink_path`; a link that DOES carry a path arrives as
 * `trendly-brands://share/<token>?…`, a real route, and must keep passing
 * through.
 *
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */

/**
 * Branch's link domains, as declared in `ios.associatedDomains` /
 * `android.intentFilters` in app.json:
 *
 *     share.trendly.now                                         (live, custom)
 *     zgh4c.app.link            zgh4c-alternate.app.link        (live, default)
 *     zgh4c.test-app.link       zgh4c-alternate.test-app.link   (test)
 *
 * The Branch-owned domains are matched on the registrable suffix rather than the
 * four exact hosts so the `-alternate` domains, the live/test split, and any
 * future Branch subdomain are all covered without this file having to track
 * app.json. The leading `(^|\.)` anchor is what keeps an unrelated host like
 * `myapp.link` from matching on a bare suffix comparison.
 */
const BRANCH_LINK_SUFFIX = /(^|\.)(app\.link|test-app\.link)$/i;

/**
 * Branch custom link domains, matched EXACTLY.
 *
 * A custom domain is a CNAME onto Branch, so its links carry the same opaque
 * link IDs and need the same treatment as an `app.link` URL. It cannot be
 * suffix-matched: Trendly serves plenty of unrelated hosts under `trendly.now`
 * (`be.`, `brands.`, the marketing site), and routing those to `/` would
 * swallow real in-app https routes.
 */
const BRANCH_CUSTOM_HOSTS = new Set(["share.trendly.now"]);

/**
 * True when `value` is an absolute URL pointing at a Branch link domain.
 *
 * Deliberately conservative: anything that is not a parseable absolute URL
 * (a bare path, a malformed string) is treated as "not Branch" and left for
 * the router to handle as it would have anyway.
 */
const isBranchLink = (value: string): boolean => {
    const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(value);
    if (!match) return false;

    // Strip userinfo (`user@host`) and any port before comparing the host.
    const host = (match[1].split("@").pop() ?? "").split(":")[0];
    return (
        BRANCH_CUSTOM_HOSTS.has(host.toLowerCase()) || BRANCH_LINK_SUFFIX.test(host)
    );
};

/**
 * True when `value` is Branch's custom-scheme entry point, `<scheme>://open`.
 *
 * Matched on ANY non-http scheme rather than on `trendly-brands` alone: the
 * scheme is configured in app.json (`expo.scheme`) and a rename there must not
 * quietly turn this back off. http(s) is excluded because `open` is a perfectly
 * ordinary first path segment for somebody else's web URL, while as a custom
 * scheme's host it is Branch's own reserved target.
 *
 * Everything after the host is ignored: Branch attaches `link_click_id` /
 * `_branch_referrer` here, and the no-param form (`trendly-brands://open`,
 * driven by the `branch_intent` intent extra) has to match too. The params are
 * not ours to read either way — the native SDK reads them off the intent.
 */
const isBranchOpenURI = (value: string): boolean =>
    /^(?!https?:)[a-z][a-z0-9+.-]*:\/\/open\/?(?:[?#]|$)/i.test(value);

/**
 * Called by Expo Router for the cold-start URL (`initial: true`) and for every
 * link opened while the app is already running.
 *
 * Expo's docs warn that throwing in here can crash the app, hence the catch-all
 * that falls back to the untouched path.
 */
export function redirectSystemPath({
    path,
}: {
    path: string;
    initial: boolean;
}): string {
    try {
        return isBranchLink(path) || isBranchOpenURI(path) ? "/" : path;
    } catch {
        return path;
    }
}
