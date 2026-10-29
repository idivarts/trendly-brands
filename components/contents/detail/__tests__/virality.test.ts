import {
    BANDS,
    displayBand,
    isUsableScore,
    rawBand,
    repairInstruction,
} from "@/components/contents/detail/virality";

describe("rawBand", () => {
    it("maps each threshold to its band", () => {
        expect(rawBand(0)).toBe("Rework");
        expect(rawBand(39)).toBe("Rework");
        expect(rawBand(40)).toBe("Weak");
        expect(rawBand(59)).toBe("Weak");
        expect(rawBand(60)).toBe("Publishable");
        expect(rawBand(74)).toBe("Publishable");
        expect(rawBand(75)).toBe("Strong");
        expect(rawBand(89)).toBe("Strong");
        expect(rawBand(90)).toBe("Exceptional");
        expect(rawBand(100)).toBe("Exceptional");
    });

    it("covers every band in the table", () => {
        for (const b of BANDS) expect(rawBand(b.min)).toBe(b.label);
    });
});

describe("displayBand", () => {
    it("returns the raw band with no history", () => {
        expect(displayBand(85)).toBe("Strong");
        expect(displayBand(91)).toBe("Exceptional");
    });

    // The case this exists for: five runs of an unedited script scored 82–92
    // on dev, crossing the 90 boundary twice. The band must not follow it.
    it("holds the previous band just over a boundary", () => {
        expect(displayBand(90, "Strong")).toBe("Strong");
        expect(displayBand(92, "Strong")).toBe("Strong");
    });

    it("gives way once the score clears the boundary", () => {
        expect(displayBand(93, "Strong")).toBe("Exceptional");
    });

    it("holds the previous band just under a boundary", () => {
        expect(displayBand(89, "Exceptional")).toBe("Exceptional");
        expect(displayBand(87, "Exceptional")).toBe("Exceptional");
    });

    it("gives way once the score falls clear", () => {
        expect(displayBand(86, "Exceptional")).toBe("Strong");
    });

    // A real edit that moves the score two bands is not wobble, and pinning the
    // old band would misreport it.
    it("never holds across a two-band jump", () => {
        expect(displayBand(80, "Weak")).toBe("Strong");
        expect(displayBand(45, "Strong")).toBe("Weak");
    });

    it("ignores a band label it does not know", () => {
        expect(displayBand(91, "Legendary")).toBe("Exceptional");
    });

    it("is stable when applied to its own output", () => {
        // Re-scoring repeatedly must not ratchet: feeding the displayed band
        // back in may hold, but must never move further than the raw band.
        let band = displayBand(85, "Strong");
        for (const n of [91, 88, 92, 89, 90]) {
            band = displayBand(n, band);
            expect(band).toBe("Strong");
        }
    });
});

describe("repairInstruction", () => {
    it("asks for one fix in a sentence", () => {
        expect(repairInstruction(["Add a hook."])).toBe("Fix this in the script: Add a hook.");
    });

    it("lists several and forbids collateral edits", () => {
        const out = repairInstruction(["Add a hook.", "Cut one of the two asks."]);
        expect(out).toContain("change nothing else");
        expect(out).toContain("- Add a hook.");
        expect(out).toContain("- Cut one of the two asks.");
    });
});

describe("isUsableScore", () => {
    const good = { overall: 84, band: "Strong", dimensions: [] };

    it("accepts a score it can read", () => {
        expect(isUsableScore(good)).toBe(true);
    });

    // The document the backend wrote before it persisted the API shape. Every
    // field reads undefined, and a band derived from undefined would render as
    // the lowest one — a confident verdict from nothing.
    it("rejects a document with Go field names", () => {
        expect(isUsableScore({ Overall: 84, Band: "Strong", Dimensions: [] })).toBe(false);
    });

    it("rejects the obvious non-scores", () => {
        expect(isUsableScore(undefined)).toBe(false);
        expect(isUsableScore(null)).toBe(false);
        expect(isUsableScore({})).toBe(false);
        expect(isUsableScore("84")).toBe(false);
        expect(isUsableScore({ overall: "84", dimensions: [] })).toBe(false);
        expect(isUsableScore({ overall: NaN, dimensions: [] })).toBe(false);
        expect(isUsableScore({ overall: 84 })).toBe(false);
    });

    it("accepts a zero score, which is a real verdict", () => {
        expect(isUsableScore({ overall: 0, dimensions: [] })).toBe(true);
    });
});
