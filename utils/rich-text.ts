/**
 * Canonical rich-text normaliser shared by the web (Lexical) and native
 * (`react-native-enriched`) editors.
 *
 * Both editors now emit the SAME tag vocabulary directly — the web editor's
 * Lexical serializer (`components/rich-text-editor/lexical/serialize.ts`)
 * targets `<b>/<i>/<u>/<s>/<code>`, `<h1–h3>`, `<blockquote>`, `<codeblock>`,
 * `<ul>/<ol>/<li>`, `<a>`, `<img>`, and the native editor produces the same.
 * So the heavy intercompatibility hacks this file used to carry
 * (`decodeSharedEntities`, `toEnrichedVocabulary`) are gone. What remains:
 *
 *  1. legacy-markdown → HTML conversion for strategies stored before the RTF
 *     era (`ensureHtml`), and
 *  2. wrapping the markup in `<html>…</html>` — required for the native editor
 *     to parse `defaultValue` as rich content.
 */

import { marked } from "marked";

/** Returns true if the string looks like HTML (starts with a tag or is empty). */
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

    const result = marked.parse(content, { async: false });
    if (typeof result === "string") return result;
    return `<p>${content}</p>`;
}

/** Removes an outer `<html>…</html>` wrapper, returning the inner markup. */
function stripHtmlWrapper(html: string): string {
    const trimmed = html.trim();
    const match = trimmed.match(/^<html>([\s\S]*)<\/html>$/i);
    return (match ? match[1] : trimmed).trim();
}

/**
 * Canonical normaliser used on load AND export by both editors. Converts legacy
 * markdown to HTML and wraps the result in `<html>…</html>`. Idempotent, so it
 * is safe to run on every change. Returns "" for empty content so the
 * placeholder shows cleanly.
 */
export function ensureEnrichedHtml(content: string): string {
    const inner = stripHtmlWrapper(ensureHtml(content || "")).trim();
    if (!inner) return "";
    return `<html>\n${inner}\n</html>`;
}
