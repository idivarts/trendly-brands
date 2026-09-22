/**
 * Twitter/X thread auto-splitter.
 *
 * Splits a long body into an ordered list of tweets, each within `limit`
 * characters (default 280). The splitter NEVER breaks in the middle of a word,
 * and prefers to break at the end of a sentence/statement; failing that it
 * breaks at the last whitespace before the limit. A single over-long word (rare,
 * e.g. a giant URL) is hard-split as a last resort so a tweet can't exceed the
 * limit.
 *
 * AI-assisted splitting is a planned future enhancement — this is the
 * deterministic baseline.
 */
export const TWEET_LIMIT = 280;

const SENTENCE_END = /[.!?…](?=\s|$)/g;

/** True for characters we're happy to break a line on (whitespace). */
function lastWhitespaceIndex(s: string): number {
    for (let i = s.length - 1; i >= 0; i--) {
        if (/\s/.test(s[i])) return i;
    }
    return -1;
}

/** The index just after the last sentence terminator within `s`, or -1. */
function lastSentenceBreak(s: string): number {
    let match: RegExpExecArray | null;
    let idx = -1;
    SENTENCE_END.lastIndex = 0;
    while ((match = SENTENCE_END.exec(s)) !== null) {
        idx = match.index + 1; // include the terminator
    }
    return idx;
}

export function splitIntoThread(body: string, limit: number = TWEET_LIMIT): string[] {
    const text = (body ?? "").trim();
    if (!text) return [];
    if (text.length <= limit) return [text];

    const tweets: string[] = [];
    let rest = text;

    while (rest.length > limit) {
        const window = rest.slice(0, limit + 1); // +1 so a break exactly at limit counts

        // 1) Prefer a sentence boundary that isn't uselessly early (>40% of limit).
        const sentenceAt = lastSentenceBreak(window.slice(0, limit));
        // 2) Otherwise the last whitespace before the limit.
        const spaceAt = lastWhitespaceIndex(window.slice(0, limit));

        let cut: number;
        if (sentenceAt > limit * 0.4) {
            cut = sentenceAt;
        } else if (spaceAt > 0) {
            cut = spaceAt;
        } else {
            // No safe boundary (one giant token) — hard split at the limit.
            cut = limit;
        }

        const piece = rest.slice(0, cut).trim();
        if (piece) tweets.push(piece);
        rest = rest.slice(cut).trim();
    }

    if (rest) tweets.push(rest);
    return tweets;
}

/** Whether any segment of a thread exceeds the per-tweet limit. */
export function threadHasOverflow(thread: string[], limit: number = TWEET_LIMIT): boolean {
    return thread.some((t) => t.length > limit);
}
