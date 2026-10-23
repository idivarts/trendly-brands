/**
 * Script stats for the handoff card's state line.
 *
 * Kept out of the component so it stays pure and testable: the line it feeds
 * ("Not started" vs "Draft · ~240 words") replaces the signal the old
 * collapsible script card gave by auto-expanding when a script existed, so an
 * empty editor — which still emits markup — must never read as a draft.
 */

/**
 * Rough word count for a rich-text script. Tags are replaced with a space
 * (never stripped to nothing, or `<p>one</p><p>two</p>` would count as one
 * word), and `&nbsp;` is treated as whitespace. Approximate by design — the
 * label it feeds says "~".
 */
export function scriptWordCount(script: string): number {
    const text = script
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
}

/** The handoff card's script-row state line. */
export function scriptStateLabel(script: string): string {
    const words = scriptWordCount(script);
    if (words === 0) return "Not started";
    return `Draft · ~${words} ${words === 1 ? "word" : "words"}`;
}
