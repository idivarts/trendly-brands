import { Dimensions, Platform } from "react-native";

/**
 * Responsive type scale.
 *
 * ## Why this exists
 *
 * Every screen in this app hardcodes `fontSize: <number>`, and those numbers
 * were tuned on a desktop browser. They read fine there, but the same absolute
 * pixel value on a phone — held ~35cm from the eye instead of ~60cm, on a
 * physically tiny panel — is a lot harder to read. The worst of it is the
 * 9–13px band (hints, timestamps, counters, badges, chip labels, meta lines),
 * which is most of the secondary text in the content planner.
 *
 * So: **web keeps its exact current numbers, mobile gets a bump.**
 *
 * ## The contract
 *
 * `fs()` is an identity function on desktop web. `fs(13)` is literally `13`
 * there — no rounding, no scaling, no drift. Wrapping a style in `fs()` cannot
 * change the desktop web rendering, which is the whole point: the web layout is
 * already right and must stay byte-identical.
 *
 * ## The ramp
 *
 * Not a flat multiplier. A uniform 1.15x would leave 9px at 10.35px (still
 * unreadable) while pushing a 28px hero to 32px (which overflows its
 * container). Instead the gain is front-loaded onto the small sizes, where the
 * legibility problem actually is, and tapers to zero for display type:
 *
 * | base  | mobile | note                                        |
 * |-------|--------|---------------------------------------------|
 * | 9–10  | 12     | floor — nothing renders below 12pt on mobile |
 * | 11–14 | +2     | the band that hurts: hints, meta, body       |
 * | 15–20 | +1     | titles, section headers                      |
 * | 21+   | +0     | display type is already large enough         |
 *
 * `lh()` is the matching ramp for `lineHeight`, scaled proportionally so text
 * that grows doesn't end up cramped or clipped inside its own line box.
 *
 * ## What counts as "mobile"
 *
 * Native (iOS/Android) always. On web, only when the viewport was already
 * phone-width at load — so a desktop browser is never touched, and a phone
 * browser gets the same treatment as the native app. This is read once at
 * module load on purpose: a desktop user dragging their window narrow keeps the
 * desktop sizes rather than having type reflow under them mid-session.
 */

/** Below this viewport width, web is treated as a phone. Matches `lg` in `useBreakpoints`. */
const MOBILE_WIDTH_BREAKPOINT = 768;

function detectMobileType(): boolean {
    if (Platform.OS !== "web") return true;
    // Guard the 0-width case: some web render passes report an empty viewport
    // before layout settles, and `0 < 768` would wrongly scale up desktop.
    const width = Dimensions.get("window").width;
    return width > 0 && width < MOBILE_WIDTH_BREAKPOINT;
}

/** True when type should be scaled up (native, or a phone-width web viewport). */
export const IS_MOBILE_TYPE = detectMobileType();

/**
 * Scale a font size for the current platform.
 * Identity on desktop web — see the ramp table above.
 */
export const fs = (size: number): number => {
    if (!IS_MOBILE_TYPE) return size;
    if (size <= 14) return Math.max(12, size + 2);
    if (size <= 20) return size + 1;
    return size;
};

/**
 * Scale a `lineHeight` to match `fs()`.
 * Identity on desktop web. Keeps roughly the original leading ratio so a bumped
 * font size still breathes inside its line box.
 */
export const lh = (height: number): number => {
    if (!IS_MOBILE_TYPE) return height;
    if (height <= 24) return Math.round(height * 1.15);
    return height;
};

/**
 * Scale a fixed box that exists only to contain text — a count badge, a pill, a
 * circular avatar initial. Those have a hardcoded `height`/`width`/`minWidth`
 * that would clip once the label inside them grows.
 *
 * Only use this on boxes whose size is dictated by their text. Icon buttons,
 * thumbnails and avatars that hold an image must keep their original size, or
 * touch targets and media grids drift out of alignment.
 */
export const fbox = (size: number): number => (IS_MOBILE_TYPE ? size + 2 : size);
