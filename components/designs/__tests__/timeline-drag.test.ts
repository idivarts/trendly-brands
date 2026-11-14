import {
    DRAG_FLOOR_MS,
    EDGE_PX,
    MIN_CLIP_MS,
    assetFitsRow,
    dragChanged,
    dragModeFor,
    dragWindow,
    dropTypeFor,
    momentAt,
} from "../timeline-drag";

describe("dragModeFor", () => {
    it("reads the edges as trims and the middle as a move", () => {
        expect(dragModeFor(2, 200)).toBe("trim-start");
        expect(dragModeFor(100, 200)).toBe("move");
        expect(dragModeFor(198, 200)).toBe("trim-end");
    });

    /**
     * A two-second clip in a sixty-second film is a sliver ~20px wide. With
     * a fixed 14px edge both zones would overlap in the middle and the clip
     * could only ever be trimmed — the one gesture nobody wants on a clip
     * they can barely see.
     */
    it("caps the edge zone so a sliver can still be moved", () => {
        expect(dragModeFor(10, 21)).toBe("move");
        expect(dragModeFor(1, 21)).toBe("trim-start");
        expect(dragModeFor(20, 21)).toBe("trim-end");
    });

    it("treats a clip of no width as a move rather than dividing by it", () => {
        expect(dragModeFor(0, 0)).toBe("move");
    });

    it("keeps the edge zone to the documented width on a wide clip", () => {
        expect(dragModeFor(EDGE_PX - 1, 600)).toBe("trim-start");
        expect(dragModeFor(EDGE_PX + 1, 600)).toBe("move");
    });
});

describe("dragWindow", () => {
    const from = { startMs: 1000, durationMs: 2000 };
    // A 10s film on a 500px lane: 1px = 20ms.
    const lane = 500;
    const total = 10000;

    it("moves without changing the length", () => {
        const to = dragWindow(from, "move", 100, lane, total);
        expect(to).toEqual({ startMs: 3000, durationMs: 2000 });
    });

    /** A move that shortened the clip at the end would be a silent trim. */
    it("keeps the length when a move hits the end of the film", () => {
        const to = dragWindow(from, "move", 9999, lane, total);
        expect(to.durationMs).toBe(2000);
        expect(to.startMs).toBe(8000);
    });

    it("never moves before the start", () => {
        expect(dragWindow(from, "move", -9999, lane, total).startMs).toBe(0);
    });

    /** Dragging the near edge must leave the far one exactly where it is. */
    it("trims the start and holds the end still", () => {
        const to = dragWindow(from, "trim-start", 50, lane, total);
        expect(to.startMs).toBe(2000);
        expect(to.startMs + to.durationMs).toBe(3000);
    });

    it("will not trim the start past the end", () => {
        const to = dragWindow(from, "trim-start", 9999, lane, total);
        expect(to.durationMs).toBe(MIN_CLIP_MS);
        expect(to.startMs + to.durationMs).toBe(3000);
    });

    it("trims the end without moving the start", () => {
        const to = dragWindow(from, "trim-end", -50, lane, total);
        expect(to).toEqual({ startMs: 1000, durationMs: 1000 });
        expect(dragWindow(from, "trim-end", -9999, lane, total).durationMs).toBe(MIN_CLIP_MS);
    });

    it("will not trim the end past the film", () => {
        expect(dragWindow(from, "trim-end", 9999, lane, total).durationMs).toBe(9000);
    });

    it("returns the window untouched when there is nothing to convert against", () => {
        expect(dragWindow(from, "move", 100, 0, total)).toEqual(from);
        expect(dragWindow(from, "move", 100, lane, 0)).toEqual(from);
    });
});

describe("dragChanged", () => {
    /**
     * A tap registers as a drag of a pixel or two. Every drag writes a
     * revision, and the history is ten deep — so a tap must not spend one.
     */
    it("ignores a tap and accepts a nudge", () => {
        const from = { startMs: 1000, durationMs: 2000 };
        expect(dragChanged(from, { startMs: 1010, durationMs: 2000 })).toBe(false);
        expect(dragChanged(from, { startMs: 1000 + DRAG_FLOOR_MS, durationMs: 2000 })).toBe(true);
        expect(dragChanged(from, { startMs: 1000, durationMs: 2000 + DRAG_FLOOR_MS })).toBe(true);
    });
});

describe("momentAt", () => {
    it("snaps to a tenth of a second, which is a number someone chose", () => {
        // 311px of 500 on a 10s film is 6.22s → 6.2s.
        expect(momentAt(311, 500, 10000)).toBe(6200);
    });

    it("stays inside the film, with room for the shortest clip", () => {
        expect(momentAt(-50, 500, 10000)).toBe(0);
        expect(momentAt(9999, 500, 10000)).toBe(9900);
    });

    it("is the start when there is no film to point at", () => {
        expect(momentAt(100, 500, 0)).toBe(0);
        expect(momentAt(100, 0, 10000)).toBe(0);
    });
});

describe("dropTypeFor / assetFitsRow", () => {
    it("declares what the row is for, from its kind not its number", () => {
        expect(dropTypeFor("music")).toBe("bgm");
        expect(dropTypeFor("sound")).toBe("sfx");
        expect(dropTypeFor("voice")).toBe("voice");
        expect(dropTypeFor("image")).toBe("image");
        // A file dropped on the scene row means "put this picture in my
        // film" — scenes themselves are written, not dropped.
        expect(dropTypeFor("scene")).toBe("image");
        expect(dropTypeFor("captions")).toBe("image");
    });

    it("keeps a sound off a picture row and a picture off a sound row", () => {
        expect(assetFitsRow("audio", "music")).toBe(true);
        expect(assetFitsRow("audio", "image")).toBe(false);
        expect(assetFitsRow("image", "scene")).toBe(true);
        expect(assetFitsRow("image", "voice")).toBe(false);
    });
});
