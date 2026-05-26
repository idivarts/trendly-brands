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
