/**
 * Converts legacy markdown strategy content to HTML for the RTF editor.
 *
 * Existing strategies were stored as raw markdown strings (e.g. "**bold**",
 * "## heading", "- bullet"). The RTF editor (TipTap / react-native-enriched)
 * expects HTML. This utility detects the format and converts on-the-fly —
 * no backend migration needed. Once a user edits and saves, the content is
 * stored as HTML and goes through this function as a no-op.
 */

import { marked } from "marked";

/**
 * Returns true if the string looks like HTML (starts with a tag or is empty).
 */
export function isHtml(content: string): boolean {
    if (!content || content.trim() === "") return true;
    return /^\s*</.test(content.trim());
}

/**
 * If the content is legacy markdown, converts it to HTML synchronously.
 * If it's already HTML (or empty), returns it unchanged.
 */
export function ensureHtml(content: string): string {
    if (isHtml(content)) return content;

    // marked.parse can return a Promise in some configurations — use the
    // synchronous lexer+parser path to guarantee a string is returned.
    const result = marked.parse(content, { async: false });

    // Depending on the marked version the sync path returns string directly.
    if (typeof result === "string") return result;

    // Fallback: wrap in a <p> if something unexpected happened.
    return `<p>${content}</p>`;
}

/**
 * Prepares content for the native `<EnrichedTextInput />` (react-native-enriched).
 *
 * The native editor only treats its `defaultValue` as rich content when the
 * string is wrapped in `<html>…</html>` (it checks `startsWith("<html>")` /
 * `endsWith("</html>")` on both iOS and Android). Bare HTML like `<p>…</p>` —
 * which is what `ensureHtml()` and the web Quill editor produce — falls through
 * to the plain-text branch and renders the raw tags as literal text.
 *
 * This wraps the (markdown-normalised) HTML in `<html>…</html>` so the native
 * editor parses and renders it. Content the native editor saves is already
 * wrapped this way, so the round-trip stays consistent. Returns "" for empty
 * content so the placeholder shows cleanly.
 */
export function ensureEnrichedHtml(content: string): string {
    const html = ensureHtml(content || "").trim();
    if (!html) return "";
    if (/^<html>/i.test(html) && /<\/html>$/i.test(html)) return html;
    return `<html>\n${html}\n</html>`;
}
