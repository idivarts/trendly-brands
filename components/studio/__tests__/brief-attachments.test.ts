/**
 * The handle rules.
 *
 * Two of these are not cosmetic. Renumbering handles silently repoints every
 * sentence the user has already typed at a different file, and an unresolved
 * handle is fatal at the backend — so finding it late costs a round trip and
 * a refusal rather than a line of text under the chips.
 */
import {
    BriefAttachment,
    insertHandle,
    matchHandles,
    mentionQuery,
    nextHandle,
    unresolvedHandles,
} from "../brief-attachments";

const att = (ref: string, mediaId = "m" + ref): BriefAttachment => ({
    ref,
    mediaId,
    url: "https://example.test/" + mediaId,
    kind: "image",
});

describe("nextHandle", () => {
    it("starts at attachment1", () => {
        expect(nextHandle([])).toBe("attachment1");
    });

    it("counts up in attach order", () => {
        expect(nextHandle([att("attachment1")])).toBe("attachment2");
    });

    it("NEVER reuses a handle after a removal", () => {
        // The one that matters. With attachment1 removed, reusing "1" would
        // repoint every sentence already typed about it at a different file.
        expect(nextHandle([att("attachment2")])).toBe("attachment3");
    });

    it("is one past the highest, not one past the count", () => {
        expect(nextHandle([att("attachment2"), att("attachment5")])).toBe("attachment6");
    });
});

describe("mentionQuery", () => {
    it("opens on a bare @ at the caret", () => {
        expect(mentionQuery("use @", 5)).toEqual({ query: "", start: 4 });
    });

    it("carries what has been typed so far", () => {
        expect(mentionQuery("use @att", 8)).toEqual({ query: "att", start: 4 });
    });

    it("closes once a space is typed", () => {
        expect(mentionQuery("use @att now", 12)).toBeNull();
    });

    it("does not fire inside an email address", () => {
        // Otherwise typing a support address opens a file picker mid-word.
        expect(mentionQuery("mail rahul@idiv.in", 14)).toBeNull();
    });

    it("opens at the very start of the brief", () => {
        expect(mentionQuery("@a", 2)).toEqual({ query: "a", start: 0 });
    });

    it("returns null when there is no @ behind the caret", () => {
        expect(mentionQuery("just words", 5)).toBeNull();
    });
});

describe("matchHandles", () => {
    const atts = [att("attachment1"), att("attachment2")];

    it("offers everything for a bare @", () => {
        expect(matchHandles(atts, "")).toHaveLength(2);
    });

    it("narrows as you type, ignoring case", () => {
        expect(matchHandles(atts, "ATTACHMENT2").map((a) => a.ref)).toEqual(["attachment2"]);
    });

    it("offers nothing when nothing matches", () => {
        expect(matchHandles(atts, "zzz")).toHaveLength(0);
    });
});

describe("insertHandle", () => {
    it("replaces the partial mention and leaves a trailing space", () => {
        // The space is not cosmetic: without it the next word types straight
        // onto the handle and the token stops matching.
        const text = "use @att";
        const m = mentionQuery(text, 8)!;
        expect(insertHandle(text, m, 8, "attachment1")).toEqual({
            text: "use @attachment1 ",
            caret: 17,
        });
    });

    it("keeps whatever followed the caret", () => {
        const text = "use @ as the face";
        const m = mentionQuery(text, 5)!;
        expect(insertHandle(text, m, 5, "attachment1").text).toBe(
            "use @attachment1  as the face"
        );
    });
});

describe("unresolvedHandles", () => {
    it("finds a handle whose file was removed", () => {
        // Removing a chip deliberately does NOT edit the brief, so this is the
        // state the user is left in — and the backend calls it fatal.
        expect(unresolvedHandles("@attachment1 is the face", [])).toEqual(["attachment1"]);
    });

    it("says nothing when every handle resolves", () => {
        expect(unresolvedHandles("@attachment1 is the face", [att("attachment1")])).toEqual([]);
    });

    it("ignores an @ that is not one of our handles", () => {
        // "@rahul" is about a person and is none of this module's business.
        expect(unresolvedHandles("ask @rahul about it", [])).toEqual([]);
    });

    it("ignores an email address", () => {
        expect(unresolvedHandles("mail rahul@attachment1.com", [])).toEqual([]);
    });

    it("matches case-insensitively", () => {
        // Autocapitalise does this at the start of a sentence on a phone, and
        // it is obviously meant to be the same file.
        expect(unresolvedHandles("@Attachment1 is the face", [att("attachment1")])).toEqual([]);
    });

    it("still SEES a capitalised handle when nothing is attached", () => {
        // The test above cannot tell "matched and resolved" from "never
        // matched at all" — drop the regex's `i` and it passes for the wrong
        // reason, leaving a capitalised handle to sail past the warning and be
        // refused by the backend. This one fails in that case.
        expect(unresolvedHandles("@Attachment1 is the face", [])).toEqual(["Attachment1"]);
    });

    it("reports each missing handle once", () => {
        expect(unresolvedHandles("@attachment1 and @attachment1 again", [])).toEqual([
            "attachment1",
        ]);
    });
});
