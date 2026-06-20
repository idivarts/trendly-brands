/**
 * Country detection + India gating helpers.
 *
 * The brand's country is captured silently at onboarding (no UI) and stored on
 * the brand document as an ISO-3166 alpha-2 code. It is the source of truth for
 * India-only gating (discovery, in-app invites, Razorpay payments).
 *
 * IMPORTANT: a brand with no country (all legacy brands) is treated as India.
 * Always gate through `isIndiaCountry()` / `isIndiaBrand()` — never compare the
 * raw field directly.
 */

const INDIA_TIMEZONES = ["Asia/Kolkata", "Asia/Calcutta"];

/**
 * Best-effort detection of the user's ISO-3166 alpha-2 country code, using only
 * the built-in Intl APIs (no extra native dependency).
 *
 * Order of precedence:
 *   1. India timezone => "IN" (most reliable signal that this is an Indian business).
 *   2. Region from the resolved locale (e.g. "en-US" => "US").
 *   3. Fallback "IN" so detection failure degrades to existing India behaviour.
 */
export function detectCountryCode(): string {
    try {
        const resolved = Intl.DateTimeFormat().resolvedOptions();
        const tz = resolved.timeZone;
        if (tz && INDIA_TIMEZONES.includes(tz)) {
            return "IN";
        }

        const locale =
            (resolved as { locale?: string }).locale ||
            (typeof navigator !== "undefined" ? navigator.language : "");
        if (locale) {
            const region = new Intl.Locale(locale).maximize().region;
            if (region) {
                return region.toUpperCase();
            }
        }
    } catch {
        // fall through
    }
    return "IN";
}

/** Whether a stored country code represents India. Missing/empty => India. */
export function isIndiaCountry(country?: string | null): boolean {
    if (!country) return true;
    return country.trim().toUpperCase() === "IN";
}

/** Whether a brand should be treated as India-based. Missing country => India. */
export function isIndiaBrand(brand?: { country?: string } | null): boolean {
    return isIndiaCountry(brand?.country);
}
