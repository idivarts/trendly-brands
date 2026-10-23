const STAGE_KEY = 'appStage';

/**
 * Puts the build's stage into the PUBLIC Expo config, so dev and prod resolve
 * to different `runtimeVersion` fingerprints.
 *
 * ── Why ────────────────────────────────────────────────────────────────────
 * `runtimeVersion.policy` is `fingerprint`, and nothing else in the public
 * config varies by stage — with-branch.js moved its domains into app.json when
 * environment-dependent capabilities broke `eas credentials`, and the key it
 * still sets is written through a mod, which the fingerprint does not hash. So
 * a dev build and a prod build of the same commit produced the SAME
 * runtimeVersion, and the only thing keeping a dev update off a production
 * device was the channel string baked into the binary. One mis-promoted build —
 * Play internal track to production, or a dev TestFlight build submitted to the
 * App Store, both of which share this app's store identity — and production
 * silently starts following the `development` channel, with nothing to stop the
 * update installing.
 *
 * With the stage in `extra`, a dev update cannot install on a prod binary at
 * all: the runtimeVersions no longer match, so expo-updates rejects it before
 * the channel is even consulted. Belt as well as braces.
 *
 * ── Why `extra` ────────────────────────────────────────────────────────────
 * It has to live in the public config to be hashed, and it must be something
 * EAS does not mirror to Apple. That rules out anything capability-shaped —
 * see the with-branch.js header for what happened the last time an
 * environment-dependent value reached `associatedDomains`. `extra` is inert:
 * it travels in the manifest and nothing provisions against it.
 *
 * Reading it at runtime is a bonus, not the point:
 *     Constants.expoConfig?.extra?.appStage
 * which is the only way to tell a dev binary from a prod one on a device.
 *
 * Defaults to dev when unset, matching with-branch.js — a misconfigured build
 * should land on dev infrastructure, never production.
 */
function withStage(config) {
    const stage = process.env.EXPO_PUBLIC_APP_STAGE === 'prod' ? 'prod' : 'dev';

    console.log(`[with-stage] stage=${stage} → extra.${STAGE_KEY}`);

    config.extra = { ...config.extra, [STAGE_KEY]: stage };
    return config;
}

module.exports = withStage;
