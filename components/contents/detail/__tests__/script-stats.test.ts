/**
 * The handoff card's script row shows "Not started" vs "Draft · ~N words".
 * That state line replaces the signal the old collapsible card gave by
 * auto-expanding when a script existed, so an empty-looking script must never
 * read as a draft — rich text arrives wrapped in markup, and markup alone is
 * not content.
 */
import { scriptStateLabel, scriptWordCount } from "../script-stats";

describe("scriptWordCount", () => {
    it("is zero for an empty script", () => {
        expect(scriptWordCount("")).toBe(0);
    });

    it("is zero for markup with no text — an empty editor still emits tags", () => {
        expect(scriptWordCount("<p></p>")).toBe(0);
        expect(scriptWordCount("<p><br></p>")).toBe(0);
        expect(scriptWordCount("<p>&nbsp;</p>")).toBe(0);
    });

    it("counts words, not tags", () => {
        expect(scriptWordCount("<p>Hey everyone</p>")).toBe(2);
        expect(scriptWordCount("<p><strong>Scene one</strong> opens wide</p>")).toBe(4);
    });

    it("does not fuse words across block boundaries", () => {
        // "<p>one</p><p>two</p>" must be 2 words, not 1 ("onetwo").
        expect(scriptWordCount("<p>one</p><p>two</p>")).toBe(2);
    });

    it("collapses runs of whitespace and entities", () => {
        expect(scriptWordCount("<p>one&nbsp;&nbsp;two   three</p>")).toBe(3);
    });

    it("handles a realistic shot list", () => {
        // Scene markers tokenise too ("[Scene", "1", "-", "Hook]" = 4), which is
        // fine for a label that says "~" — it is a sense of length, not a count
        // of prose.
        const script =
            "<h3>[Scene 1 - Hook]</h3><p>Open on the bottle, close up.</p>" +
            "<h3>[Scene 2 - CTA]</h3><p>Use code BREW20.</p>";
        expect(scriptWordCount(script)).toBe(17);
    });
});

describe("scriptStateLabel", () => {
    it("reads as not started when the editor is effectively empty", () => {
        expect(scriptStateLabel("")).toBe("Not started");
        expect(scriptStateLabel("<p><br></p>")).toBe("Not started");
    });

    it("reads as a draft once there are words, and singularises one word", () => {
        expect(scriptStateLabel("<p>Hook</p>")).toBe("Draft · ~1 word");
        expect(scriptStateLabel("<p>Hook line two</p>")).toBe("Draft · ~3 words");
    });
});
