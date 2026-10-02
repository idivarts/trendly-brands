const {
    AndroidConfig,
    withAndroidManifest,
    withInfoPlist,
} = require('expo/config-plugins');

/**
 * Branch.io native KEY configuration, resolved per stage.
 *
 * react-native-branch@7 ships NO Expo config plugin — it assumes a bare React
 * Native project where you edit Info.plist and AndroidManifest.xml by hand.
 * Prebuild regenerates both, so the key has to be injected here or it silently
 * disappears on the next build.
 *
 * ── Scope: keys only. Domains live in app.json ──────────────────────────────
 * This plugin used to add `associatedDomains` / `intentFilters` too, resolved
 * per stage. That broke `eas credentials`: EAS syncs Apple capabilities FROM
 * the resolved Expo config, and the domains came from EXPO_PUBLIC_BRANCH_*
 * which is only set in CI. Run locally, the config had no associated domains,
 * so EAS treated that as authoritative and reported
 *
 *     ✔ Synced capabilities: Disabled: Associated Domains
 *
 * silently turning the capability off on the App ID and breaking the next iOS
 * build. Anything EAS mirrors to Apple must therefore be environment-INDEPENDENT.
 *
 * So app.json now declares all four domains (live + test) unconditionally. That
 * is safe: the entitlement only says the app is CAPABLE of handling those
 * links, and link domains are public — they are readable in any app's
 * entitlements and in the AASA file Branch serves. Which Branch environment the
 * app actually talks to is decided by the key below, which is the only part
 * that genuinely has to vary per stage.
 *
 * ── Why one key, not Branch's {live,test} dict ──────────────────────────────
 * Branch's SDKs pick between a live and test key using the DEBUG/RELEASE build
 * configuration. Trendly's environments don't line up with that: a dev build is
 * a release build pointed at dev infrastructure, so the dict would put the dev
 * app on the LIVE Branch instance.
 *
 * ── Credentials come from the environment ───────────────────────────────────
 *     EXPO_PUBLIC_BRANCH_LIVE_KEY      EXPO_PUBLIC_BRANCH_TEST_KEY
 *
 * app.json props of the same names still work as a fallback. A missing key is a
 * no-op rather than an error, so the project builds before Branch is
 * provisioned — and crucially, a missing key no longer changes the app's
 * capabilities, only whether Branch initialises.
 */

/**
 * Unfilled placeholders count as absent — same convention as isConfigured() in
 * shared-constants/marketing.ts.
 */
function isSet(value) {
    return !!value && !value.startsWith('REPLACE_WITH_');
}

function withBranch(config, props = {}) {
    // Environment first so credentials never need to be committed.
    const liveKey = process.env.EXPO_PUBLIC_BRANCH_LIVE_KEY || props.liveKey;
    const testKey = process.env.EXPO_PUBLIC_BRANCH_TEST_KEY || props.testKey;

    // Default to dev when unset: a misconfigured build should land in Branch's
    // TEST environment, never pollute live attribution data.
    const isProd = process.env.EXPO_PUBLIC_APP_STAGE === 'prod';
    const stage = isProd ? 'prod' : 'dev';
    const apiKey = isProd ? liveKey : testKey;

    if (!isSet(apiKey)) {
        console.warn(
            `[with-branch] stage=${stage}: ${isProd ? 'liveKey' : 'testKey'} not configured — ` +
            'Branch will not initialise in this build. Associated domains are unaffected.'
        );
        return config;
    }

    console.log(`[with-branch] stage=${stage} → ${isProd ? 'LIVE' : 'TEST'} Branch instance`);

    // ── iOS ──────────────────────────────────────────────────────────────────
    config = withInfoPlist(config, (cfg) => {
        cfg.modResults.branch_key = apiKey;
        return cfg;
    });

    // ── Android ──────────────────────────────────────────────────────────────
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
