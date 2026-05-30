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

/** Removes an outer `<html>…</html>` wrapper, returning the inner markup. */
function stripHtmlWrapper(html: string): string {
    const trimmed = html.trim();
    const match = trimmed.match(/^<html>([\s\S]*)<\/html>$/i);
    return (match ? match[1] : trimmed).trim();
}

/**
 * Decodes HTML entities to plain characters — the principled half of keeping
 * the two editors in sync at the TEXT level.
 *
 * Quill (web) and react-native-enriched (native) escape text differently:
 *  - Quill escapes `& < > " '` (as `&amp; &lt; &gt; &quot; &#39;`) and encodes
 *    EVERY space as `&nbsp;`.
 *  - The native editor escapes only `& < >`, and on Android additionally emits
 *    `&#NN;` for every non-ASCII character (em-dashes, accents, emoji…).
 *
 * Chasing each entity with its own rule is endless. Instead we DECODE every
 * numeric entity and every divergent named entity back to its literal
 * character — which both editors and the HTML viewers render identically —
 * and keep ONLY the three entities both serializers already agree on
 * (`&amp; &lt; &gt;`). Markup-critical characters that decode to `& < >` (and
 * non-breaking spaces) are re-mapped to their canonical form so the HTML stays
 * valid. No new rule is needed when the next stray entity shows up.
 */
function decodeSharedEntities(html: string): string {
    const canonicalChar = (cp: number): string => {
        if (!Number.isFinite(cp) || cp <= 0 || cp > 0x10ffff) return "";
        if (cp === 0x26) return "&amp;"; // & — keep encoded (both agree)
        if (cp === 0x3c) return "&lt;"; //  < — keep encoded (both agree)
        if (cp === 0x3e) return "&gt;"; //  > — keep encoded (both agree)
        if (cp === 0xa0) return " "; //      non-breaking space → regular space
        try {
            return String.fromCodePoint(cp);
        } catch {
            return "";
        }
    };
    return html
        // numeric entities (decimal + hex), e.g. &#39; &#8212; &#x1F600;
        .replace(/&#(\d+);/g, (_, dec) => canonicalChar(parseInt(dec, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => canonicalChar(parseInt(hex, 16)))
        // named entities Quill emits that the native editor leaves literal
        .replace(/&nbsp;/gi, " ")
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        // any literal non-breaking-space character → regular space
        .replace(/ /g, " ")
        // recover the double-escaped `&amp;nbsp;` left by strategies that were
        // opened+saved on iOS under the earlier buggy build
        .replace(/&amp;nbsp;/gi, " ");
}

/**
 * Rewrites HTML into the single tag vocabulary understood by the native
 * `react-native-enriched` editor — the structural half of keeping the editors
 * in sync.
 *
 * The native parser only recognises `<b>`/`<i>` (not `<strong>`/`<em>`) and
 * headings `<h1>`–`<h3>`, and has no size-span concept. Quill emits
 * `<strong>`/`<em>`, `<h1>`–`<h5>` and `<span class="ql-size-small">`, so left
 * as-is, web-authored bold/italic/large-heading content would lose its
 * formatting on mobile. This maps everything to the common denominator.
 */
function toEnrichedVocabulary(html: string): string {
    return html
        // bold: <strong> → <b>
        .replace(/<\s*strong(\s[^>]*)?>/gi, "<b>")
        .replace(/<\s*\/\s*strong\s*>/gi, "</b>")
        // italic: <em> → <i>
        .replace(/<\s*em(\s[^>]*)?>/gi, "<i>")
        .replace(/<\s*\/\s*em\s*>/gi, "</i>")
        // strikethrough variants → <s>
        .replace(/<\s*(del|strike)(\s[^>]*)?>/gi, "<s>")
        .replace(/<\s*\/\s*(del|strike)\s*>/gi, "</s>")
        // headings beyond <h3> collapse to <h3> (native ceiling)
        .replace(/<\s*h[4-6](\s[^>]*)?>/gi, "<h3>")
        .replace(/<\s*\/\s*h[4-6]\s*>/gi, "</h3>")
        // size spans (e.g. Quill's ql-size-small) have no native equivalent — unwrap
        .replace(/<\s*span(\s[^>]*)?>/gi, "")
        .replace(/<\s*\/\s*span\s*>/gi, "");
}

/**
 * Canonical rich-text normaliser shared by BOTH editors (web Quill + native
 * `react-native-enriched`), used on load AND on export so the two stay in sync.
 *
 * It:
 *  1. converts legacy markdown to HTML (`ensureHtml`),
 *  2. decodes divergent HTML entities back to plain characters so the two
 *     serializers agree at the text level (`decodeSharedEntities`),
 *  3. rewrites the markup to the native editor's tag vocabulary
 *     (`toEnrichedVocabulary`), and
 *  4. wraps the result in `<html>…</html>` — required for the native editor to
 *     parse `defaultValue` as rich content (it checks `startsWith("<html>")` /
 *     `endsWith("</html>")` on iOS and Android; bare `<p>…</p>` would render as
 *     literal tags).
 *
 * The function is idempotent: feeding it already-canonical content returns the
 * same string, so it is safe to run on every change without causing update
 * loops. Returns "" for empty content so the placeholder shows cleanly.
 */
export function ensureEnrichedHtml(content: string): string {
    const inner = toEnrichedVocabulary(
        decodeSharedEntities(stripHtmlWrapper(ensureHtml(content || "")))
    ).trim();
    if (!inner) return "";
    return `<html>\n${inner}\n</html>`;
}
