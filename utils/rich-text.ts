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

// ───────────────────────────────────────────────────────────────────────────
// AI Quick Edit (native) — convert the AI's result into an enriched-vocab HTML
// fragment suitable for the native editor's `replaceRange(start,end,html)`
// command. The AI returns markdown (or HTML); we coerce it to the editor's
// exact tags (`<b>/<i>/<s>/<code>/<a>`, `<h1-3>`, `<p>`, `<ul>/<li>`).
// ───────────────────────────────────────────────────────────────────────────

function escapeTextForHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inline markdown → enriched inline tags. */
function mdInlineToEnriched(text: string): string {
    let s = escapeTextForHtml(text);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t, u) => `<a href="${u}">${t}</a>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/__([^_]+)__/g, "<b>$1</b>");
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, "$1<i>$2</i>");
    s = s.replace(/~~([^~]+)~~/g, "<s>$1</s>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    return s;
}

/** Map standard HTML tags the AI might emit onto the enriched editor's
 *  vocabulary (`<strong>`→`<b>`, `<em>`→`<i>`, `<del>/<strike>`→`<s>`,
 *  `<h4-6>`→`<h3>`, `<pre>`→`<codeblock>`). Tags the parser doesn't recognise
 *  are left alone (it ignores unknowns). */
function mapStandardTagsToEnriched(html: string): string {
    return html
        .replace(/<\s*strong(\s[^>]*)?>/gi, "<b>")
        .replace(/<\s*\/\s*strong\s*>/gi, "</b>")
        .replace(/<\s*em(\s[^>]*)?>/gi, "<i>")
        .replace(/<\s*\/\s*em\s*>/gi, "</i>")
        .replace(/<\s*(del|strike)(\s[^>]*)?>/gi, "<s>")
        .replace(/<\s*\/\s*(del|strike)\s*>/gi, "</s>")
        .replace(/<\s*h[4-6](\s[^>]*)?>/gi, "<h3>")
        .replace(/<\s*\/\s*h[4-6]\s*>/gi, "</h3>")
        .replace(/<\s*pre(\s[^>]*)?>/gi, "<codeblock>")
        .replace(/<\s*\/\s*pre\s*>/gi, "</codeblock>");
}

/**
 * Convert the AI Quick Edit result into an `<html>…</html>` fragment in the
 * enriched editor's tag vocabulary, ready for `replaceRange`.
 *
 * The AI is given the selection's HTML and replies with HTML — so we treat the
 * result as HTML (map any standard tags to enriched ones). For robustness we
 * also accept markdown / plain text: a single line stays inline (so replacing a
 * word inside a paragraph doesn't inject a block), multi-line markdown is
 * converted to blocks.
 */
export function aiResultToEnrichedFragment(result: string): string {
    const trimmed = (result || "").trim();
    if (!trimmed) return "";

    // Already HTML → keep its structure, just normalise the tag vocabulary.
    if (isHtml(trimmed)) {
        const inner = mapStandardTagsToEnriched(stripHtmlWrapper(trimmed)).trim();
        if (!inner) return "";
        return `<html>\n${inner}\n</html>`;
    }

    // Plain text / markdown fallback.
    const lines = trimmed
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    if (lines.length === 0) return "";

    const isBlock =
        lines.length > 1 || /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)/.test(lines[0]);

    // Inline: a single run of text → no block wrapper, so it merges into the
    // paragraph the selection lives in.
    if (!isBlock) {
        return `<html>${mdInlineToEnriched(lines[0])}</html>`;
    }

    // Block: map each line, grouping consecutive list items inside a <ul>.
    const out: string[] = [];
    let inList = false;
    const closeList = () => {
        if (inList) {
            out.push("</ul>");
            inList = false;
        }
    };
    for (const line of lines) {
        let m: RegExpMatchArray | null;
        const li = line.match(/^(?:[-*+]|\d+\.)\s+(.*)/);
        if (li) {
            if (!inList) {
                out.push("<ul>");
                inList = true;
            }
            out.push(`<li>${mdInlineToEnriched(li[1])}</li>`);
            continue;
        }
        closeList();
        if ((m = line.match(/^#\s+(.*)/))) out.push(`<h1>${mdInlineToEnriched(m[1])}</h1>`);
        else if ((m = line.match(/^##\s+(.*)/))) out.push(`<h2>${mdInlineToEnriched(m[1])}</h2>`);
        else if ((m = line.match(/^#{3,6}\s+(.*)/))) out.push(`<h3>${mdInlineToEnriched(m[1])}</h3>`);
        else out.push(`<p>${mdInlineToEnriched(line)}</p>`);
    }
    closeList();
    return `<html>\n${out.join("\n")}\n</html>`;
}
