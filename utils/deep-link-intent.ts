import { useSyncExternalStore } from "react";

/**
 * A deep-link destination that has been resolved but not yet honoured.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Branch resolves a link asynchronously, so `branch.subscribe` can fire at any
 * point during boot — including before the router has mounted and before auth
 * has settled. Navigating straight from that callback races the boot gate in
 * `app/_layout.tsx`, and the deep link loses in two ways:
 *
 *  1. COLD START, SIGNED OUT — the most common case, because deferred deep
 *     linking (tap ad → install → first open) is by definition a signed-out
 *     launch. Branch pushes `/contents/abc`, the gate then sees no session and
 *     resets to `/lets-start`. The destination is gone before the user has even
 *     finished signing in.
 *  2. COLD START, BEFORE MOUNT — navigating before the root layout has mounted
 *     throws, which the old call site could only swallow.
 *
 * Parking the destination here instead inverts the control: Branch never
 * navigates, it just records intent. `app/_layout.tsx` owns every boot
 * navigation decision and replays the intent at the one moment it is safe to —
 * signed in, out of onboarding, router mounted.
 *
 * ── Lifetime ────────────────────────────────────────────────────────────────
 * Deliberately in memory only, not persisted. The intent has to survive a
 * sign-in (same JS session, so it does), but it must NOT survive an app
 * restart: a link tapped days ago should not hijack an unrelated launch.
 */
let pending: string | null = null;

const listeners = new Set<() => void>();

const emit = (): void => {
    listeners.forEach((listener) => listener());
};

/**
 * A Branch link is attacker-controllable: whoever creates it chooses
 * `$deeplink_path`. It may therefore select a screen inside this app, but it
 * must never be able to supply an origin — so anything that could read as a
 * scheme-relative URL (`//evil.example`) or an absolute URL is rejected rather
 * than parked. Validating at the door means no call site can forget to.
 */
const isInAppPath = (path: string): boolean =>
    path.startsWith("/") && !path.startsWith("//");

/**
 * The `app/(public)/` routes, which render without a session.
 *
 * This matters for deep links specifically: the boot gate holds a parked
 * destination until the user is signed in, which is right for the deferred
 * -deep-link case it was built for (tap ad → install → sign up → land), but
 * wrong for a public share link, whose recipient is usually not a Trendly user
 * at all. Forcing them through sign-up to read a read-only page would defeat
 * the share.
 *
 * Listed explicitly rather than inferred: being reachable without auth is a
 * property of the screen, and a new public route should have to opt in here
 * deliberately.
 */
const PUBLIC_PATH_PREFIXES = [
    "/share/",
    "/influencer/",
    "/influencer-list",
    "/influencer-images",
    "/collaboration-application",
];

/**
 * Whether this destination can be honoured with no session, so the boot gate
 * can replay it instead of parking it behind sign-in.
 */
export const isPublicDeepLink = (path: string): boolean =>
    isInAppPath(path) &&
    PUBLIC_PATH_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(prefix)
    );

/** Record where the app should go once it is in a position to go there. */
export const setPendingDeepLink = (path: string): void => {
    if (!isInAppPath(path) || pending === path) return;

    pending = path;
    emit();
};

export const getPendingDeepLink = (): string | null => pending;

/**
 * Read and clear in one step, so a destination can only ever be honoured once.
 *
 * Clearing notifies subscribers, which matters: `usePendingDeepLink` would
 * otherwise keep handing the consumed path back to the boot gate on its next
 * run and navigate to it again.
 */
export const consumePendingDeepLink = (): string | null => {
    if (pending === null) return null;

    const path = pending;
    pending = null;
    emit();

    return path;
};

export const subscribeToPendingDeepLink = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/**
 * Subscribe a component to the parked destination.
 *
 * This is what lets a link that arrives while the app is already open and idle
 * still be honoured: nothing else in the boot gate's dependencies changes on a
 * warm-start tap, so without this the effect would never re-run.
 */
export const usePendingDeepLink = (): string | null =>
    useSyncExternalStore(
        subscribeToPendingDeepLink,
        getPendingDeepLink,
        getPendingDeepLink
    );
