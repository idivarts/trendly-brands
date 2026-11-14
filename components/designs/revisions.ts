/**
 * The way back, as the history list reads it.
 *
 * ── Why this is a module and not a function in the panel ──────────────────
 * Same reason as design-status and studio-layout: this app has jest but no
 * React Native renderer, so importing a component into a test pulls in the
 * whole RN tree and fails. Rules that decide what the user is told live
 * beside the components, in a file a test can import.
 *
 * And these rules matter more than most. The list is how someone decides
 * which version to go back to; a row that names the wrong one, or that
 * offers to restore the film already playing, is worse than no list.
 */

/** What wrote a revision. The backend's DesignRevision* constants. */
export type RevisionSource = "authoring" | "ai-edit" | "inspector" | "restore";

/** One revision, as the design endpoint returns it. */
export interface DesignRevision {
    n: number;
    prefix: string;
    previewUrl?: string;
    at: number;
    by: RevisionSource;
    note?: string;
    durationMs?: number;
}

/** A revision prepared for the list. */
export interface RevisionRow {
    n: number;
    /** "Written by AI", "Restored" — what happened, in the user's words. */
    title: string;
    /** The brief, or whatever the writer said about the change. */
    note: string;
    /** "just now", "14 minutes ago", "3 days ago". */
    when: string;
    /** True for the one the design is pointing at. It cannot be restored. */
    current: boolean;
}

const TITLES: Record<RevisionSource, string> = {
    authoring: "Written by AI",
    "ai-edit": "Edited by AI",
    inspector: "Edited by hand",
    restore: "Restored",
};

/**
 * How a revision is described when `by` is something this build does not
 * know. A later backend may add a source; an unrecognised row should still
 * be restorable rather than blank.
 */
const UNKNOWN_TITLE = "Changed";

/**
 * The list, newest first, with the current revision marked.
 *
 * `currentPrefix` is the design's projectPrefix — the pointer. Compared by
 * PREFIX and not by number on purpose: a restore puts a second entry on the
 * same files, and after it both the restored revision and the restore row
 * are "what is playing". Marking only the newest would invite someone to
 * restore the revision they are already watching and wonder why nothing
 * happened.
 */
export function revisionRows(
    revisions: DesignRevision[] | undefined,
    currentPrefix: string | undefined,
    now: number = Date.now()
): RevisionRow[] {
    if (!revisions?.length) return [];
    return [...revisions]
        .sort((a, b) => b.n - a.n)
        .map((r) => ({
            n: r.n,
            title: TITLES[r.by] ?? UNKNOWN_TITLE,
            note: (r.note ?? "").trim(),
            when: relativeTime(r.at, now),
            current: !!currentPrefix && r.prefix === currentPrefix,
        }));
}

/**
 * How long ago, in words.
 *
 * Rounded down, because "2 minutes ago" for something 119 seconds old is
 * fine and "3 minutes ago" is a lie. A timestamp in the future — a clock
 * skewed between a phone and a Lambda — reads as "just now" rather than as
 * a negative number.
 */
export function relativeTime(at: number, now: number = Date.now()): string {
    if (!Number.isFinite(at) || at <= 0) return "";
    const seconds = Math.floor((now - at) / 1000);
    if (seconds < 45) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
}

/**
 * What the empty list should say.
 *
 * A design nobody has written yet has no history and never had one, which
 * is a different thing from a design whose history was pruned — and the
 * only one of the two a user will ever see here, since the first write
 * creates revision 1.
 */
export const NO_REVISIONS = "Nothing yet. Every version of this film will appear here as you make it.";
