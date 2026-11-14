import {
    draftFrom,
    editBetween,
    pxToNumber,
    worthSending,
    type ElementDraft,
} from "../inspector-edit";

const base = (): ElementDraft =>
    draftFrom(
        "Hit the 2 PM wall?",
        { color: "#ffffff", backgroundColor: "", fontSize: "88px", fontWeight: "700", textAlign: "center" },
        0,
        3000
    );

describe("draftFrom", () => {
    it("reads what the player reported", () => {
        const d = base();
        expect(d).toEqual({
            text: "Hit the 2 PM wall?",
            color: "#ffffff",
            backgroundColor: "",
            fontSizePx: 88,
            fontWeight: "700",
            textAlign: "center",
            startMs: 0,
            durationMs: 3000,
        });
    });

    it("shows nothing rather than inventing a default", () => {
        // A control with nothing behind it must not write a guess into the
        // film the first time it is touched.
        const d = draftFrom(undefined, undefined, undefined, undefined);
        expect(d.color).toBe("");
        expect(d.fontSizePx).toBeNull();
        expect(d.startMs).toBeNull();
        expect(d.durationMs).toBeNull();
    });
});

describe("pxToNumber", () => {
    it("reads a px value", () => {
        expect(pxToNumber("88px")).toBe(88);
        expect(pxToNumber("88.5px")).toBe(89);
    });

    it("is null for anything that is not one", () => {
        expect(pxToNumber(undefined)).toBeNull();
        expect(pxToNumber("")).toBeNull();
        expect(pxToNumber("inherit")).toBeNull();
    });
});

describe("editBetween", () => {
    it("is null when nothing changed", () => {
        expect(editBetween("title", base(), base())).toBeNull();
    });

    // The one that matters: the panel shows COMPUTED values, so most
    // elements have no inline style at all. Sending the whole draft every
    // time would freeze every element the user merely looked at against
    // the brand kit.
    it("sends only what changed, not the whole draft", () => {
        const after = { ...base(), color: "#054463" };
        const edit = editBetween("title", base(), after);
        expect(edit).toEqual({ elementId: "title", style: { color: "#054463" } });
        expect(edit?.text).toBeUndefined();
        expect(edit?.startMs).toBeUndefined();
    });

    it("sends a text edit down to nothing, because clearing is an edit", () => {
        const edit = editBetween("title", base(), { ...base(), text: "" });
        expect(edit).toEqual({ elementId: "title", text: "" });
        expect(worthSending(edit)).toBe(true);
    });

    it("clears a font size override rather than writing nullpx", () => {
        const edit = editBetween("title", base(), { ...base(), fontSizePx: null });
        expect(edit?.style?.["font-size"]).toBe("");
    });

    it("maps the panel's names onto CSS property names", () => {
        const edit = editBetween("title", base(), {
            ...base(),
            backgroundColor: "#000000",
            fontWeight: "400",
            textAlign: "left",
            fontSizePx: 96,
        });
        expect(edit?.style).toEqual({
            background: "#000000",
            "font-weight": "400",
            "text-align": "left",
            "font-size": "96px",
        });
    });

    it("carries timing in milliseconds", () => {
        const edit = editBetween("title", base(), { ...base(), startMs: 1500, durationMs: 4000 });
        expect(edit).toEqual({ elementId: "title", startMs: 1500, durationMs: 4000 });
    });

    it("does not send a timing it never knew", () => {
        // An element with no data-start reports null. Leaving the control
        // alone must not write a start onto it.
        const before = draftFrom("x", {}, null, null);
        const after = { ...before, color: "#fff" };
        const edit = editBetween("x", before, after);
        expect(edit?.startMs).toBeUndefined();
        expect(edit?.durationMs).toBeUndefined();
    });

    it("sends text, style and timing together when all three moved", () => {
        const edit = editBetween("title", base(), {
            ...base(),
            text: "Tired of sugar?",
            color: "#054463",
            startMs: 500,
        });
        expect(edit).toEqual({
            elementId: "title",
            text: "Tired of sugar?",
            style: { color: "#054463" },
            startMs: 500,
        });
    });
});

describe("worthSending", () => {
    it("refuses nothing", () => {
        expect(worthSending(null)).toBe(false);
        expect(worthSending({ elementId: "title" })).toBe(false);
    });
});
