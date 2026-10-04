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
 * navigation a moment later. Every other URL — the `trendly-brands://` custom
 * scheme, and any real https route — passes through untouched.
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
        return isBranchLink(path) ? "/" : path;
    } catch {
        return path;
    }
}
