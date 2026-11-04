// ─── app-download-gate ────────────────────────────────────────────────────────
// Shared state for the mobile-web "get the app" interstitial.
//
// Every marketing CTA on trendly.now ("Start free", "Get Started", …) points at
// the bare origin, so the website hands us a visitor with no path and the root
// redirect sends them to /lets-start. On a phone browser that is the worst place
// to meet the product for the first time — so on web, at phone width, we put one
// screen in front of it that offers the native app, and let anyone who'd rather
// not install carry on to the web app.
//
// Living here rather than on the website means ONE gate covers every door:
// marketing CTAs, ads, a shared link, a typed URL. Patching ~30 website CTAs
// would have missed all but the first.

import type { DevicePlatformGuess } from "@/shared-constants/analytics-events";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { Platform } from "react-native";

/**
 * Set once the visitor explicitly chooses the web. Long-lived on purpose: a
 * 2-hour TTL (the storage default) would re-gate someone who already said no,
 * which turns a nudge into nagging.
 */
const CONTINUE_ON_WEB_KEY = "continue_on_web";
const CONTINUE_ON_WEB_TTL_HOURS = 24 * 30;

/** Which store to lead with. The UA is a hint for ordering, never a gate. */
export type { DevicePlatformGuess };

export const guessDevicePlatform = (): DevicePlatformGuess => {
    if (Platform.OS === "ios") return "ios";
    if (Platform.OS === "android") return "android";
    if (typeof window === "undefined") return "unknown";

    const ua = window.navigator?.userAgent ?? "";
    // iPadOS 13+ reports a desktop Macintosh UA, so the touch-point count is the
    // only reliable tell that a "Mac" is actually an iPad.
    const isIPadOS =
        /Macintosh/.test(ua) && (window.navigator as any)?.maxTouchPoints > 1;
    // @ts-ignore — MSStream only exists on old IE/Edge, and only to be excluded.
    if ((/iPad|iPhone|iPod/.test(ua) && !window.MSStream) || isIPadOS) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "unknown";
};

export const hasChosenWeb = async (): Promise<boolean> => {
    const value = await PersistentStorage.getItemWithExpiry(CONTINUE_ON_WEB_KEY);
    return !!value;
};

export const chooseWeb = () =>
    PersistentStorage.setItemWithExpiry(
        CONTINUE_ON_WEB_KEY,
        "true",
        CONTINUE_ON_WEB_TTL_HOURS,
    );

/**
 * The query param that skips the interstitial: `/lets-start?web=1`.
 *
 * It has to be on that real path, NOT on the bare origin: the root redirect in
 * `app/_layout.tsx` sends an unauthenticated visitor on with
 * `resetAndNavigate("/lets-start")`, which drops the query string, so a param
 * on `https://brands.trendly.now` never survives the hop.
 *
 * The website's /download page carries it on its "Open the web app" link —
 * someone who just read a page about the apps and chose the browser anyway has
 * answered the gate's question already, and asking again reads as not
 * listening.
 */
const WEB_BYPASS_PARAM_VALUES = ["1", "true"];

/**
 * Expo Router hands a repeated param back as an array, so narrow to the last
 * value rather than assuming a string — `?web=0&web=1` should mean the last
 * thing the URL said, and `String(["0","1"])` would match nothing at all.
 */
export const isWebBypassParam = (value: string | string[] | undefined) => {
    const last = Array.isArray(value) ? value[value.length - 1] : value;
    return !!last && WEB_BYPASS_PARAM_VALUES.includes(last);
};

/**
 * Whether this viewport should see the gate at all — web only (a native user
 * already has the app), and only at phone/tablet width. `xl` is the app's own
 * desktop breakpoint, so this stays in step with every other layout decision.
 */
export const isGateableViewport = (xl: boolean) => Platform.OS === "web" && !xl;
