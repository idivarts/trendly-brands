/**
 * Normalises a user-entered URL for safe insertion into rich-text content.
 *
 * - Trims surrounding whitespace.
 * - Leaves protocol-relative (`//`), anchor (`#`), mailto:/tel: and already
 *   schemed URLs untouched.
 * - Prepends `https://` to bare hosts (e.g. "trendly.now" → "https://trendly.now").
 *
 * Returns an empty string for blank input so callers can treat it as "no URL".
 */
export function normalizeUrl(raw: string): string {
    const url = (raw || "").trim();
    if (!url) return "";
    if (/^(https?:\/\/|mailto:|tel:|\/\/|#|\/)/i.test(url)) return url;
    return `https://${url}`;
}
