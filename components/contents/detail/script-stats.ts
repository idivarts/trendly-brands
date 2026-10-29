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
    const text = scriptPlainText(script);
    if (!text) return 0;
    return text.split(/\s+/).length;
}

/**
 * The script's visible words, with markup and whitespace differences removed.
 *
 * Tags become a space (never nothing, or `<p>one</p><p>two</p>` would read as
 * one word) and runs of whitespace collapse.
 */
export function scriptPlainText(script: string): string {
    return script
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Whether two scripts say the same thing.
 *
 * Compared by visible text rather than by string, because the rich-text editor
 * reformats the markup it is given — so a script nobody has touched stops
 * matching the bytes the server holds within a render. A raw comparison made
 * the "has the user edited this?" test answer yes every time, which turned
 * every AI edit into a conflict prompt the user had to clear by hand.
 */
export function sameScript(a: string, b: string): boolean {
    return scriptPlainText(a) === scriptPlainText(b);
}

/** The handoff card's script-row state line. */
export function scriptStateLabel(script: string): string {
    const words = scriptWordCount(script);
    if (words === 0) return "Not started";
    return `Draft · ~${words} ${words === 1 ? "word" : "words"}`;
}
