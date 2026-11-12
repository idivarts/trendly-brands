/**
 * Handles for the files attached to a brief, and the `@` that points at them.
 *
 * ── Why the handle is plain text ───────────────────────────────────────────
 * Typing `@` offers the attached files; picking one inserts the literal
 * characters `@attachment1` into the brief. Nothing rich, no overlay, no
 * custom text engine — this is a `TextInput` on three platforms and a real
 * mention widget there is a project of its own. The CHIPS are what make the
 * link visible; the token is just a word the backend knows how to look up.
 *
 * Two rules fall out of the token being plain text, and both are the kind that
 * look like details until they corrupt a brief:
 *
 *  1. REMOVING A CHIP DOES NOT EDIT THE BRIEF. The words stay and the
 *     reference stops resolving. Reaching into someone's prose to delete words
 *     they typed is worse than leaving a handle that no longer points
 *     anywhere — and the backend refuses an unresolved handle loudly, so
 *     nothing is lost silently.
 *  2. HANDLES ARE NEVER RENUMBERED. Remove `@attachment1` and the second file
 *     stays `@attachment2`. Renumbering would silently repoint every sentence
 *     already typed at a different file, which is the worst thing this module
 *     could do.
 */

/** The same ceiling the backend enforces, so the UI refuses before the API. */
export const MAX_ATTACHMENTS = 4;

export interface BriefAttachment {
    /** The handle WITHOUT its "@" — "attachment1". */
    ref: string;
    mediaId: string;
    url: string;
    kind: "image" | "video";
}

/**
 * The handle for the next file attached.
 *
 * One past the highest ever used, NOT one past the count. With two files
 * attached and the first removed, the next is `attachment3` — because
 * `attachment2` is in the user's prose and must go on meaning what it meant.
 */
export function nextHandle(existing: BriefAttachment[]): string {
    let highest = 0;
    for (const a of existing) {
        const n = Number(/^attachment(\d+)$/.exec(a.ref)?.[1] ?? 0);
        if (n > highest) highest = n;
    }
    return `attachment${highest + 1}`;
}

export interface MentionQuery {
    /** What has been typed after the "@", possibly empty. */
    query: string;
    /** Index of the "@" itself, so an insert can replace from there. */
    start: number;
}

/**
 * Is the caret inside an `@…` the user is typing?
 *
 * Deliberately narrow. It looks backwards from the caret for an `@` with no
 * whitespace between, and refuses if the `@` is preceded by a word character —
 * so an email address does not open a file picker halfway through typing it.
 */
export function mentionQuery(text: string, caret: number): MentionQuery | null {
    if (caret < 0 || caret > text.length) return null;

    for (let i = caret - 1; i >= 0; i--) {
        const ch = text[i];
        if (ch === "@") {
            const before = i > 0 ? text[i - 1] : "";
            // "a@b" is an address, not a mention.
            if (before && /[\w@]/.test(before)) return null;
            return { query: text.slice(i + 1, caret), start: i };
        }
        // A handle is one word. Anything that cannot be inside one ends the
        // search — including the space that means the user moved on.
        if (!/[\w-]/.test(ch)) return null;
    }
    return null;
}

/** The attached files whose handles match what is being typed. */
export function matchHandles(atts: BriefAttachment[], query: string): BriefAttachment[] {
    const q = query.trim().toLowerCase();
    if (!q) return atts;
    return atts.filter((a) => a.ref.toLowerCase().startsWith(q));
}

export interface Insertion {
    text: string;
    /** Where the caret should land — after the handle and its trailing space. */
    caret: number;
}

/**
 * Put `@handle ` into the brief, replacing the partial mention being typed.
 *
 * The trailing space is not cosmetic: without it the next word types straight
 * onto the handle and the token stops matching.
 */
export function insertHandle(
    text: string,
    mention: MentionQuery,
    caret: number,
    ref: string
): Insertion {
    const token = `@${ref} `;
    const next = text.slice(0, mention.start) + token + text.slice(caret);
    return { text: next, caret: mention.start + token.length };
}

/**
 * Handles written in the brief that nothing is attached to any more.
 *
 * The user is shown these BEFORE they press Plan, because the backend treats
 * an unresolved handle as fatal — which is the right call there, but finding
 * out after a round trip is a worse way to learn it than a line under the
 * chips.
 *
 * Matching is case-insensitive, because "@Attachment1" at the start of a
 * sentence is a thing autocapitalise does on a phone and is obviously meant to
 * be the same file.
 */
export function unresolvedHandles(brief: string, atts: BriefAttachment[]): string[] {
    const known = new Set(atts.map((a) => a.ref.toLowerCase()));
    const out: string[] = [];
    const seen = new Set<string>();

    // Only handles of our own shape. A brief mentioning "@rahul" is talking
    // about a person and is none of this module's business.
    for (const m of brief.matchAll(/(^|[^\w@])@(attachment\d+)\b/gi)) {
        const ref = m[2];
        const key = ref.toLowerCase();
        if (known.has(key) || seen.has(key)) continue;
        seen.add(key);
        out.push(ref);
    }
    return out;
}
