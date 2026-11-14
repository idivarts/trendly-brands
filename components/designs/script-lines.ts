/**
 * The film as words, grouped the way a script reads.
 *
 * ── Why this is a module ──────────────────────────────────────────────────
 * The usual reason in this folder: jest, no React Native renderer. And the
 * grouping rule is worth testing — a script that puts a line under the
 * wrong scene, or loses one because two scenes share a name, is a script
 * someone edits believing it is the film.
 */

/** One piece of copy, as the backend's /script returns it. */
export interface ScriptLine {
    elementId: string;
    sceneId: string;
    /** "text" is on the screen, "voice" is spoken. */
    kind: "text" | "voice";
    tag: string;
    text: string;
    startMs: number;
}

/** The lines of one scene, in the order they are seen or heard. */
export interface ScriptScene {
    sceneId: string;
    /** What to call it: the scene's own name, or its place in the film. */
    title: string;
    lines: ScriptLine[];
}

/**
 * Group the script by scene, keeping the order the backend sent.
 *
 * The backend already sorted by time, so this never reorders anything: it
 * walks the list and starts a new group when the scene changes. Two scenes
 * with the same name therefore stay two groups, which is right — they are
 * two moments in the film, and merging them would show someone a scene
 * that does not exist.
 */
export function groupScript(lines: ScriptLine[] | undefined): ScriptScene[] {
    if (!lines?.length) return [];
    const out: ScriptScene[] = [];
    for (const line of lines) {
        const last = out[out.length - 1];
        if (last && last.sceneId === line.sceneId) {
            last.lines.push(line);
            continue;
        }
        out.push({
            sceneId: line.sceneId,
            title: sceneTitle(line.sceneId, out.length),
            lines: [line],
        });
    }
    return out;
}

/**
 * What to call a scene in the script.
 *
 * Its own name where it has one, because the author chose it and it says
 * something ("hook", "benefit", "signoff"). A number where it does not —
 * never "Untitled", which tells nobody anything.
 */
export function sceneTitle(sceneId: string, index: number): string {
    const name = (sceneId ?? "").trim();
    if (name === "") return `Scene ${index + 1}`;
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * What the panel calls a line's kind, where it needs saying.
 *
 * Only the spoken ones are labelled: on a page of copy, every line that is
 * not marked is on screen, and labelling all of them is noise.
 */
export function lineBadge(line: ScriptLine): string {
    return line.kind === "voice" ? "Voiceover" : "";
}

/**
 * The request body for editing a line.
 *
 * Both kinds go to the SAME endpoint — the one the inspector uses —
 * because the plan asks for one write path rather than two. A voiceover
 * writes `voice`, which the backend turns into "say this instead" by
 * clearing what the old words resolved to; text writes `text`.
 */
export function lineEdit(line: ScriptLine, next: string): Record<string, string> {
    return line.kind === "voice"
        ? { elementId: line.elementId, voice: next }
        : { elementId: line.elementId, text: next };
}

/**
 * Whether an edited line is worth sending.
 *
 * An unchanged line is not, and nor is a voiceover emptied to nothing —
 * the backend refuses that, and refusing it here saves the user a round
 * trip to be told. An emptied line of ON-SCREEN text is a real edit:
 * clearing a subtitle is a thing people do.
 */
export function worthSendingLine(line: ScriptLine, next: string): boolean {
    const trimmed = next.trim();
    if (trimmed === line.text.trim()) return false;
    if (line.kind === "voice" && trimmed === "") return false;
    return true;
}

/**
 * What the panel says after a voiceover is rewritten.
 *
 * Said rather than hidden, because the film does NOT say the new words
 * yet: speaking takes a round trip to the voice provider, which happens
 * on the next preview or render. A panel that let someone believe
 * otherwise would be lying about what they are about to publish.
 */
export const VOICE_PENDING =
    "The new line is saved. It will be spoken, and its captions rebuilt, the next time this film is previewed or rendered.";
