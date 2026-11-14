import {
    captionRows,
    clock,
    differs,
    spanOf,
    trackTitle,
    type CaptionTrack,
} from "../caption-tracks";

const track = (p: Partial<CaptionTrack> & { elementId: string }): CaptionTrack => ({
    sceneId: "hook",
    follows: "vo",
    spoken: "Hit the 2 PM wall? Not any more.",
    startMs: 200,
    words: [
        { text: "Hit", startMs: 200, durationMs: 320 },
        { text: "the", startMs: 550, durationMs: 210 },
        { text: "2PM", startMs: 800, durationMs: 450 },
        { text: "wall,", startMs: 1300, durationMs: 400 },
        { text: "not", startMs: 1800, durationMs: 300 },
        { text: "anymore.", startMs: 2200, durationMs: 700 },
    ],
    ...p,
});

describe("captionRows", () => {
    it("is empty for a film with no captions", () => {
        expect(captionRows(undefined)).toEqual([]);
        expect(captionRows([])).toEqual([]);
    });

    it("reads a track back as the words on screen", () => {
        const [row] = captionRows([track({ elementId: "c1" })]);
        expect(row.read).toBe("Hit the 2PM wall, not anymore.");
        expect(row.title).toBe("Hook");
        expect(row.span).toBe("0:00 – 0:03");
        expect(row.empty).toBe(false);
    });

    it("puts them in the order they are seen, not document order", () => {
        const rows = captionRows([
            track({ elementId: "late", startMs: 5200, sceneId: "outro" }),
            track({ elementId: "early", startMs: 200 }),
        ]);
        expect(rows.map((r) => r.elementId)).toEqual(["early", "late"]);
    });

    it("says a track is empty rather than hiding it", () => {
        // A track written but not yet filled is a real part of the film,
        // and the panel showing nothing at all is what sent someone
        // looking for a bug.
        const [row] = captionRows([track({ elementId: "c1", words: [] })]);
        expect(row.empty).toBe(true);
        expect(row.read).toBe("");
        expect(row.span).toBe("");
    });
});

describe("the spoken line beside the transcript", () => {
    // "three o'clock" comes back from the transcriber as "3 o'clock".
    // Both are true and they matter differently.
    it("is shown when the words heard differ from the words written", () => {
        const [row] = captionRows([
            track({
                elementId: "c1",
                spoken: "Beat the three o'clock slump.",
                words: [
                    { text: "Beat", startMs: 200, durationMs: 300 },
                    { text: "the", startMs: 500, durationMs: 200 },
                    { text: "3", startMs: 700, durationMs: 200 },
                    { text: "o'clock", startMs: 900, durationMs: 400 },
                    { text: "slump.", startMs: 1300, durationMs: 500 },
                ],
            }),
        ]);
        expect(row.spoken).toBe("Beat the three o'clock slump.");
    });

    it("is not shown when they are the same sentence", () => {
        const [row] = captionRows([
            track({
                elementId: "c1",
                spoken: "Hit the 2PM wall, not anymore.",
            }),
        ]);
        expect(row.spoken).toBe("");
    });

    it("ignores case, punctuation and spacing when deciding", () => {
        // Printing the line twice over a comma is pedantry, and it hides
        // the times the difference is real.
        expect(differs("Hit the 2PM wall not anymore", "Hit the 2PM wall, not anymore.")).toBe(false);
        expect(differs("hit  the   2pm wall", "Hit the 2PM wall")).toBe(false);
        expect(differs("Hit the 3PM wall", "Hit the 2PM wall")).toBe(true);
    });

    it("says nothing when there is no spoken line to compare", () => {
        expect(differs("anything", "")).toBe(false);
    });
});

describe("trackTitle", () => {
    it("uses the scene's name", () => {
        expect(trackTitle(track({ elementId: "c", sceneId: "outro" }))).toBe("Outro");
    });

    it("says what it is when it belongs to no scene", () => {
        expect(trackTitle(track({ elementId: "c", sceneId: "" }))).toBe("Captions");
    });
});

describe("spanOf and clock", () => {
    it("runs from the first word to the end of the last", () => {
        expect(spanOf([{ text: "a", startMs: 1000, durationMs: 500 }])).toBe("0:01 – 0:02");
    });

    it("takes the latest END, not the last word's start", () => {
        // Words can overlap; the track is over when the last one is.
        expect(
            spanOf([
                { text: "a", startMs: 0, durationMs: 9000 },
                { text: "b", startMs: 1000, durationMs: 100 },
            ])
        ).toBe("0:00 – 0:09");
    });

    it("is empty for no words", () => {
        expect(spanOf([])).toBe("");
    });

    it("formats minutes", () => {
        expect(clock(0)).toBe("0:00");
        expect(clock(65_000)).toBe("1:05");
    });
});
