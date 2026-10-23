const {
    AndroidConfig,
    withAndroidManifest,
    withAppDelegate,
    withInfoPlist,
    withMainActivity,
    withMainApplication,
} = require('expo/config-plugins');

/**
 * Branch.io native KEY configuration, resolved per stage.
 *
 * react-native-branch@7 ships NO Expo config plugin — it assumes a bare React
 * Native project where you edit Info.plist and AndroidManifest.xml by hand.
 * Prebuild regenerates both, so the key has to be injected here or it silently
 * disappears on the next build.
 *
 * ── Scope: the native SDK wiring, and the keys. Domains live in app.json ───
 * Android needs RNBranchModule.getAutoInstance() in MainApplication, and
 * initSession() / onNewIntent() in MainActivity. That wiring was missing, and
 * since the JS subscribe() calls Branch.notifyNativeToInit() unconditionally on
 * both platforms, every keyed Android build died on launch:
 *
 *     FATAL EXCEPTION: NullPointerException ... deferredSessionBuilder
 *       at io.branch.referral.Branch.notifyNativeToInit(Branch.java:2644)
 *       at io.branch.rnbranch.RNBranchModule.notifyNativeToInit(...)
 *
 * — a read of the Branch singleton that getAutoInstance() is what creates.
 *
 * iOS needs the same wiring for a different reason. It never crashed: there,
 * notifyNativeToInit goes through [Branch getInstance], which creates the
 * singleton lazily. But without initSession / openURL / continueUserActivity in
 * the AppDelegate, Branch resolves nothing — so iOS deep links and attribution
 * were silently dead rather than loudly broken, which is the worse failure.
 *
 * Prebuild regenerates all three native files, so the mods below are the only
 * place that wiring can live.
 *
 * This plugin used to add `associatedDomains` / `intentFilters` too, resolved
 * per stage. That broke `eas credentials`: EAS syncs Apple capabilities FROM
 * the resolved Expo config, and the domains came from a pair of now-deleted
 * EXPO_PUBLIC_BRANCH_*_DOMAIN vars that were only set in CI. Run locally, the
 * config had no associated domains, so EAS treated that as authoritative and
 * reported
 *
 *     ✔ Synced capabilities: Disabled: Associated Domains
 *
 * silently turning the capability off on the App ID and breaking the next iOS
 * build. Anything EAS mirrors to Apple must therefore be environment-INDEPENDENT.
 *
 * So app.json now declares every domain (custom + live + test) unconditionally,
 * and it is the ONLY place a Branch link domain is configured — there is no
 * domain env var or Actions variable left in any repo. That is safe: the
 * entitlement only says the app is CAPABLE of handling those
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

/**
 * Patching a generated file means the generator is the real dependency, so a
 * missing anchor has to fail the build. Silently skipping is what produced the
 * crash this mod fixes: a binary where Branch never initialised, which nothing
 * downstream could detect.
 */
function insertAfter(contents, anchor, insertion, what) {
    const match = contents.match(anchor);
    if (!match) {
        throw new Error(
            `[with-branch] could not find ${what} — the Expo template changed. ` +
            'Fix plugins/with-branch.js before building: without this wiring ' +
            'react-native-branch crashes on launch (Branch.notifyNativeToInit ' +
            'dereferences a null singleton).'
        );
    }
    // Function replacement, so `$` in the Kotlin never reads as a capture ref.
    return contents.replace(anchor, (m) => `${m}${insertion}`);
}

function assertLanguage(actual, expected, file) {
    if (actual !== expected) {
        throw new Error(
            `[with-branch] ${file} is ${actual}, not ${expected} — these mods only ` +
            'know that template. Update plugins/with-branch.js.'
        );
    }
}

/**
 * Same contract as insertAfter, for anchors the insertion must precede.
 */
function insertBefore(contents, anchor, insertion, what) {
    const match = contents.match(anchor);
    if (!match) {
        throw new Error(
            `[with-branch] could not find ${what} — the Expo template changed. ` +
            'Fix plugins/with-branch.js before building, or Branch will not ' +
            'initialise in this build.'
        );
    }
    return contents.replace(anchor, (m) => `${insertion}${m}`);
}

const RNBRANCH_IMPORT = 'import io.branch.rnbranch.RNBranchModule';

/**
 * MainApplication: create the Branch singleton before React starts.
 *
 * getAutoInstance() also calls Branch.registerPlugin("ReactNative", …), which
 * is what puts the SDK into its deferred-init mode — the mode notifyNativeToInit
 * later releases from JS. Both halves come from this one call.
 */
function withBranchMainApplication(config) {
    return withMainApplication(config, (cfg) => {
        assertLanguage(cfg.modResults.language, 'kt', 'MainApplication');
        let src = cfg.modResults.contents;

        // `expo prebuild` without --clean re-runs mods over an already patched
        // file.
        if (src.includes('RNBranchModule.getAutoInstance')) return cfg;

        src = insertAfter(
            src,
            /^package .+$/m,
            `\n\n${RNBRANCH_IMPORT}`,
            'the MainApplication package declaration'
        );
        src = insertAfter(
            src,
            /override fun onCreate\(\) \{\n\s*super\.onCreate\(\)\n/,
            '    RNBranchModule.getAutoInstance(this)\n',
            'super.onCreate() inside MainApplication.onCreate()'
        );

        cfg.modResults.contents = src;
        return cfg;
    });
}

/**
 * MainActivity: hand Branch the launch intent, and later ones.
 *
 * initSession() is not only the cold-start link resolution — it also records
 * this Activity inside RNBranchModule, and onNewIntent() calls setIntent() on
 * that record. Wire one without the other and the warm-start path NPEs instead.
 */
function withBranchMainActivity(config) {
    return withMainActivity(config, (cfg) => {
        assertLanguage(cfg.modResults.language, 'kt', 'MainActivity');
        let src = cfg.modResults.contents;

        if (src.includes('RNBranchModule.initSession')) return cfg;

        src = insertAfter(
            src,
            /^package .+$/m,
            `\n\nimport android.content.Intent\n${RNBRANCH_IMPORT}`,
            'the MainActivity package declaration'
        );
        src = insertAfter(
            src,
            /override fun getMainComponentName\(\): String = "main"\n/,
            `
  override fun onStart() {
    super.onStart()
    RNBranchModule.initSession(intent.data, this)
  }

  // ReactActivity.onNewIntent only forwards to super when its delegate declines
  // the intent, so super has to stay first here.
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    RNBranchModule.onNewIntent(intent)
  }
`,
            'getMainComponentName() in MainActivity'
        );

        cfg.modResults.contents = src;
        return cfg;
    });
}

/**
 * AppDelegate: give Branch the launch options and every inbound URL.
 *
 * Deliberately NOT using deferInitializationForJSLoad(): the session inits at
 * launch and RNBranch caches the result, which BranchSubscriber then replays
 * (checkCachedEvents defaults to true). Deferring would make a resolved link
 * depend on JS reaching subscribe() — and utils/observability/branch.ts skips
 * subscribe() entirely when no key is configured, which would strand the
 * session forever in exactly that case.
 */
function withBranchAppDelegate(config) {
    return withAppDelegate(config, (cfg) => {
        assertLanguage(cfg.modResults.language, 'swift', 'AppDelegate');
        let src = cfg.modResults.contents;

        if (src.includes('RNBranch.initSession')) return cfg;

        src = insertAfter(src, /^import Expo$/m, '\nimport RNBranch', 'the AppDelegate imports');

        src = insertBefore(
            src,
            /^\s*return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)$/m,
            '    RNBranch.initSession(launchOptions: launchOptions, isReferrable: true)\n\n',
            'the didFinishLaunchingWithOptions return'
        );

        // Branch is asked first in both handlers below: it recognises its own
        // link domains, and letting RCTLinkingManager claim one first would
        // hand JS a bare URL with none of the resolved Branch params.
        src = insertBefore(
            src,
            /^\s*return super\.application\(app, open: url, options: options\) \|\| RCTLinkingManager\.application\(app, open: url, options: options\)$/m,
            '    if RNBranch.application(app, open: url, options: options) { return true }\n',
            'the openURL body'
        );

        src = insertBefore(
            src,
            /^\s*let result = RCTLinkingManager\.application\(application, continue: userActivity, restorationHandler: restorationHandler\)$/m,
            '    if RNBranch.continue(userActivity) { return true }\n',
            'the continueUserActivity body'
        );

        cfg.modResults.contents = src;
        return cfg;
    });
}

function withBranch(config, props = {}) {
    // Unconditional, and ahead of the key check below, which returns early.
    //
    // The key is a BUNDLE-time value (`isBranchConfigured()` in
    // utils/observability/branch.ts reads it from the JS bundle) while this is a
    // BUILD-time one. An OTA can therefore put a keyed bundle on an unkeyed
    // binary — and that bundle calls subscribe(), which calls
    // notifyNativeToInit() regardless. Gating the native wiring on the key would
    // reintroduce the crash through exactly that skew. Registering the SDK with
    // no key is harmless: Branch just never initialises a session.
    config = withBranchMainApplication(config);
    config = withBranchMainActivity(config);
    config = withBranchAppDelegate(config);

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
