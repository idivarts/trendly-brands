import {
    sceneHoldsSelection,
    selectionFrom,
    selectionLabel,
    type Selection,
} from "../selection";

const HIT: Selection = { elementId: "hook-title", sceneId: "hook", tag: "h1", text: "Hit the 2 PM wall?" };

describe("selectionFrom", () => {
    it("takes a real selection off the player's message", () => {
        expect(
            selectionFrom({
                source: "trendly-player",
                type: "select",
                elementId: "hook-title",
                sceneId: "hook",
                tag: "H1",
                text: "  Hit the 2 PM wall?  ",
            })
        ).toEqual(HIT);
    });

    // Anything may post into a window. A message that is not the player's
    // select must not move the selection.
    it("ignores a message that is not the player's select", () => {
        expect(selectionFrom({ source: "somewhere-else", type: "select", elementId: "x" })).toBeNull();
        expect(selectionFrom({ source: "trendly-player", type: "time", elementId: "x" })).toBeNull();
        expect(selectionFrom(null)).toBeNull();
    });

    // "Nothing selected" is a state the panels show, not an error. A click
    // on the background resolves to no element and must clear the selection.
    it("treats an element with no id as nothing selected", () => {
        expect(selectionFrom({ source: "trendly-player", type: "select", elementId: "" })).toBeNull();
        expect(selectionFrom({ source: "trendly-player", type: "select" })).toBeNull();
    });
});

describe("selectionLabel", () => {
    it("calls it what the user clicked on", () => {
        expect(selectionLabel(HIT)).toBe("Hit the 2 PM wall?");
    });

    it("falls back to something true rather than to Untitled", () => {
        expect(selectionLabel({ ...HIT, text: "" })).toBe("<h1>");
        expect(selectionLabel({ ...HIT, text: "", tag: "" })).toBe("hook-title");
        expect(selectionLabel(null)).toBe("Nothing selected");
    });

    it("keeps a long line to one line", () => {
        const long = selectionLabel({ ...HIT, text: "x".repeat(200) });
        // The cap is what matters, not the exact number: this sits in a
        // narrow panel and must never wrap.
        expect(long.length).toBeLessThanOrEqual(48);
        expect(long.endsWith("…")).toBe(true);
    });
});

describe("sceneHoldsSelection", () => {
    it("is true only for the scene that owns it", () => {
        expect(sceneHoldsSelection("hook", HIT)).toBe(true);
        expect(sceneHoldsSelection("outro", HIT)).toBe(false);
    });

    // An element outside every scene belongs to none of them — otherwise
    // every scene row would light up at once.
    it("is false for an element with no scene", () => {
        expect(sceneHoldsSelection("hook", { ...HIT, sceneId: "" })).toBe(false);
        expect(sceneHoldsSelection("", { ...HIT, sceneId: "" })).toBe(false);
        expect(sceneHoldsSelection("hook", null)).toBe(false);
    });
});
