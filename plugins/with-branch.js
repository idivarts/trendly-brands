const {
    AndroidConfig,
    withAndroidManifest,
    withInfoPlist,
} = require('expo/config-plugins');

/**
 * Branch.io native configuration, resolved per stage.
 *
 * react-native-branch@7 ships NO Expo config plugin — it assumes a bare React
 * Native project where you edit Info.plist and AndroidManifest.xml by hand.
 * Prebuild regenerates both, so the Branch config has to be injected here or it
 * silently disappears on the next build.
 *
 * ── Why ONE key is baked in, not a {live,test} dict ──────────────────────────
 * Branch's SDKs pick between a live and test key using the DEBUG/RELEASE build
 * configuration. Trendly's environments don't line up with that: a dev build is
 * a release build that happens to point at dev infrastructure. Relying on the
 * dict would put the dev app on the live Branch instance.
 *
 * So the stage is resolved here, at prebuild, from EXPO_PUBLIC_APP_STAGE — the
 * same variable that already selects the Firestore database and API host — and
 * exactly one key is written. dev and prod are separate builds anyway, so
 * there is nothing to choose at runtime.
 *
 * ── Why the domains live here too ───────────────────────────────────────────
 * Branch's live and test apps CANNOT share a link domain (test is normally
 * `<subdomain>.test-app.link`). Since the domain changes with the stage, it
 * can't be a static list in app.json, so this plugin owns associatedDomains
 * and intentFilters as well — one place responsible for all Branch config.
 *
 * ── Credentials come from the environment, not from app.json ────────────────
 * Values are read from EXPO_PUBLIC_BRANCH_* so nothing has to be committed:
 *
 *   EXPO_PUBLIC_BRANCH_LIVE_KEY     EXPO_PUBLIC_BRANCH_LIVE_DOMAIN
 *   EXPO_PUBLIC_BRANCH_TEST_KEY     EXPO_PUBLIC_BRANCH_TEST_DOMAIN
 *
 * app.json props of the same names still work as a fallback, but env wins — so
 * the checked-in config can stay empty and CI supplies everything.
 *
 * Missing credentials are a no-op rather than an error, so the project still
 * builds before Branch is provisioned.
 */

/** Branch serves Universal Links from both the domain and its -alternate twin. */
function alternateOf(domain) {
    const [subdomain, ...rest] = domain.split('.');
    return [`${subdomain}-alternate`, ...rest].join('.');
}

/**
 * Unfilled placeholders count as absent — same convention as isConfigured() in
 * shared-constants/marketing.ts. Without this, a not-yet-provisioned project
 * would ship `applinks:REPLACE_WITH_…` in its entitlements and a junk
 * branch_key, which fails Apple's associated-domains validation rather than
 * simply doing nothing.
 */
function isSet(value) {
    return !!value && !value.startsWith('REPLACE_WITH_');
}

function withBranch(config, props = {}) {
    // Environment first so credentials never need to be committed; the app.json
    // props remain supported for a local one-off override.
    const liveKey = process.env.EXPO_PUBLIC_BRANCH_LIVE_KEY || props.liveKey;
    const testKey = process.env.EXPO_PUBLIC_BRANCH_TEST_KEY || props.testKey;
    const liveDomain = process.env.EXPO_PUBLIC_BRANCH_LIVE_DOMAIN || props.liveDomain;
    const testDomain = process.env.EXPO_PUBLIC_BRANCH_TEST_DOMAIN || props.testDomain;

    // Default to dev when unset: a misconfigured build should land in Branch's
    // TEST environment, never pollute live attribution data.
    const isProd = process.env.EXPO_PUBLIC_APP_STAGE === 'prod';
    const stage = isProd ? 'prod' : 'dev';

    const apiKey = isProd ? liveKey : testKey;
    const domain = isProd ? liveDomain : testDomain;

    if (!isSet(apiKey) || !isSet(domain)) {
        console.warn(
            `[with-branch] stage=${stage}: ${isProd ? 'liveKey/liveDomain' : 'testKey/testDomain'} not configured ` +
            '— skipping Branch native config. Deep links and install attribution will not work in this build.'
        );
        return config;
    }

    console.log(`[with-branch] stage=${stage} → ${isProd ? 'LIVE' : 'TEST'} instance, domain ${domain}`);

    const domains = [domain, alternateOf(domain)];

    // ── iOS: Universal Links entitlement ─────────────────────────────────────
    config.ios = config.ios ?? {};
    config.ios.associatedDomains = Array.from(
        new Set([
            ...(config.ios.associatedDomains ?? []),
            ...domains.map((d) => `applinks:${d}`),
        ])
    );

    // ── iOS: the key itself ──────────────────────────────────────────────────
    config = withInfoPlist(config, (cfg) => {
        cfg.modResults.branch_key = apiKey;
        return cfg;
    });

    // ── Android: App Links ───────────────────────────────────────────────────
    config.android = config.android ?? {};
    config.android.intentFilters = [
        ...(config.android.intentFilters ?? []),
        {
            action: 'VIEW',
            // Lets Android verify ownership and open the app without a chooser.
            autoVerify: true,
            data: domains.map((d) => ({ scheme: 'https', host: d })),
            category: ['BROWSABLE', 'DEFAULT'],
        },
    ];

    // ── Android: key + instance selection ────────────────────────────────────
    config = withAndroidManifest(config, (cfg) => {
        const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
            cfg.modResults
        );

        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            application,
            'io.branch.sdk.BranchKey',
            apiKey
        );

        // The Android SDK validates the key against this flag: a key_test_…
        // with TestMode=false (or the reverse) fails to initialise.
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            application,
            'io.branch.sdk.TestMode',
            isProd ? 'false' : 'true'
        );

        return cfg;
    });

    return config;
}

module.exports = withBranch;
