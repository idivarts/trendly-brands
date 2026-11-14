/**
 * The captions a film carries, as the panel shows them.
 *
 * ── Why these are not editable here ───────────────────────────────────────
 * A caption track is TRANSCRIBED from the audio of the voiceover it
 * follows, and rebuilt whenever that line changes. Typing over the words
 * would be editing a transcript of something about to be replaced — so
 * this panel shows them and says where to change them, which is the
 * voiceover line in the Script tab.
 *
 * ── Why the panel shows two versions of the same sentence ─────────────────
 * What the voiceover was ASKED to say and what the transcriber HEARD are
 * not always the same: "three o'clock" comes back as "3 o'clock". Both are
 * true and they matter differently — one is the line someone wrote, the
 * other is what a viewer reads on screen. Hiding the difference would have
 * someone fixing a caption by editing a line that already says the right
 * thing.
 */

/** One word of a caption track, with the moment it appears. */
export interface CaptionWord {
    text: string;
    startMs: number;
    durationMs: number;
}

/** One caption track, as the design's script endpoint returns it. */
export interface CaptionTrack {
    elementId: string;
    sceneId: string;
    /** The id of the voiceover these words came out of. */
    follows: string;
    /** What that voiceover was asked to say. */
    spoken: string;
    startMs: number;
    words: CaptionWord[];
}

/** A track prepared for the panel. */
export interface CaptionRow {
    elementId: string;
    /** "Hook", or "Captions" when it belongs to no named scene. */
    title: string;
    /** The words as they appear on screen, joined. */
    read: string;
    /** The line the voiceover was asked to say, when it differs. */
    spoken: string;
    words: CaptionWord[];
    /** "0:00 – 0:04", or "" when there is nothing timed yet. */
    span: string;
    /** True when the track exists but has no words in it yet. */
    empty: boolean;
}

/**
 * Prepare the tracks for display, in the order they are seen.
 *
 * Sorted by when they appear rather than by document order, for the same
 * reason the script is: a panel listing a film's parts should read in the
 * order a viewer meets them.
 */
export function captionRows(tracks: CaptionTrack[] | undefined): CaptionRow[] {
    if (!tracks?.length) return [];
    return [...tracks]
        .sort((a, b) => a.startMs - b.startMs)
        .map((t) => {
            const read = t.words.map((w) => w.text).join(" ").trim();
            return {
                elementId: t.elementId,
                title: trackTitle(t),
                read,
                // Only when it adds something. The common case is that the
                // transcript matches the line, and printing it twice is
                // noise that hides the times it does not.
                spoken: differs(read, t.spoken) ? t.spoken : "",
                words: t.words,
                span: spanOf(t.words),
                empty: t.words.length === 0,
            };
        });
}

/** What to call a track: its scene, or what it is. */
export function trackTitle(t: CaptionTrack): string {
    const name = (t.sceneId ?? "").trim();
    if (name === "") return "Captions";
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Whether the spoken line is worth showing beside the transcript.
 *
 * Compared loosely — case, punctuation and spacing differ between a line
 * someone typed and the same line as heard, and showing both over a comma
 * would be pedantry rather than information.
 */
export function differs(read: string, spoken: string): boolean {
    const plain = (s: string) =>
        (s ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9 ]+/g, "")
            .replace(/\s+/g, " ")
            .trim();
    const a = plain(read);
    const b = plain(spoken);
    return b !== "" && a !== b;
}

/** "0:00 – 0:04" across a track's words, or "" when there are none. */
export function spanOf(words: CaptionWord[]): string {
    if (!words.length) return "";
    const first = words[0].startMs;
    const last = words.reduce((end, w) => Math.max(end, w.startMs + w.durationMs), first);
    return `${clock(first)} – ${clock(last)}`;
}

/** 0:04, from milliseconds. */
export function clock(ms: number): string {
    const total = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** What the panel says when a film has no captions at all. */
export const NO_CAPTIONS =
    "This film has no captions. Ask for them in the brief, or add a voiceover and they are written from it.";

/** Where captions come from, said once under the list. */
export const CAPTIONS_SOURCE =
    "Captions are transcribed from the voiceover. Change the spoken line in the Script tab and they are rebuilt on the next preview or render.";
