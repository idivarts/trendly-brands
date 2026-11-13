import {
    clipGeometry,
    formatClock,
    frameAt,
    rulerTicks,
    sceneAt,
    timelineDurationMs,
    toLayerTree,
    toTracks,
    type DesignScene,
} from "../studio-layout";

// The three scenes the model actually wrote on dev.
const scenes: DesignScene[] = [
    { id: "hook", src: "compositions/hook.html", startMs: 0, durationMs: 3000, trackIndex: 1, trackKind: "graphics" },
    { id: "benefits", src: "compositions/benefits.html", startMs: 3000, durationMs: 4000, trackIndex: 1, trackKind: "graphics" },
    { id: "outro", src: "compositions/outro.html", startMs: 7000, durationMs: 3000, trackIndex: 1, trackKind: "graphics" },
];

describe("timelineDurationMs", () => {
    /**
     * The root's data-duration is what the renderer cuts to and what the
     * wallet charged for. Deriving the width from the scenes instead would
     * draw a timeline that disagrees with the film.
     */
    it("prefers the film's own duration over the scenes", () => {
        expect(timelineDurationMs(10000, scenes)).toBe(10000);
        // Even when the scenes imply something else.
        expect(timelineDurationMs(12000, scenes)).toBe(12000);
    });

    it("falls back to the scenes rather than drawing nothing", () => {
        expect(timelineDurationMs(undefined, scenes)).toBe(10000);
        expect(timelineDurationMs(0, scenes)).toBe(10000);
    });

    it("is zero when there is nothing at all", () => {
        expect(timelineDurationMs(undefined, [])).toBe(0);
        expect(timelineDurationMs(undefined, undefined)).toBe(0);
    });
});

describe("toTracks", () => {
    it("groups by the renderer's own track index", () => {
        const tracks = toTracks(scenes);
        expect(tracks).toHaveLength(1);
        expect(tracks[0].index).toBe(1);
        expect(tracks[0].label).toBe("Graphics");
        expect(tracks[0].scenes.map((s) => s.id)).toEqual(["hook", "benefits", "outro"]);
    });

    it("separates rows and returns them in index order", () => {
        const two = toTracks([
            { ...scenes[0], trackIndex: 2, trackKind: "audio" },
            { ...scenes[1], trackIndex: 1 },
        ]);
        expect(two.map((t) => t.index)).toEqual([1, 2]);
        expect(two[1].label).toBe("Audio");
    });

    /** Single-track films are what the AI writes today; they must not vanish. */
    it("puts untracked scenes on one row", () => {
        const t = toTracks([
            { id: "a", src: "a.html", startMs: 0, durationMs: 1000, trackIndex: 0 },
            { id: "b", src: "b.html", startMs: 1000, durationMs: 1000, trackIndex: 0 },
        ]);
        expect(t).toHaveLength(1);
        expect(t[0].scenes).toHaveLength(2);
        expect(t[0].label).toBe("Scene");
    });

    it("orders clips within a row by time, whatever order they arrive in", () => {
        const t = toTracks([scenes[2], scenes[0], scenes[1]]);
        expect(t[0].scenes.map((s) => s.id)).toEqual(["hook", "benefits", "outro"]);
    });

    it("handles no scenes", () => {
        expect(toTracks(undefined)).toEqual([]);
        expect(toTracks([])).toEqual([]);
    });
});

describe("clipGeometry", () => {
    it("places a clip as a fraction of the film", () => {
        expect(clipGeometry(scenes[1], 10000)).toEqual({ left: 0.3, width: 0.4 });
    });

    /**
     * The authoring contract permits a scene to run past the root's duration,
     * and the renderer just cuts it. Drawn literally it would be wider than
     * the track and shove the whole row out of alignment.
     */
    it("never lets a clip overrun the track", () => {
        const overlong = { ...scenes[2], startMs: 7000, durationMs: 9000 };
        const g = clipGeometry(overlong, 10000);
        expect(g.left).toBeCloseTo(0.7);
        expect(g.width).toBeCloseTo(0.3);
        expect(g.left + g.width).toBeLessThanOrEqual(1);
    });

    it("clamps a clip that starts past the end", () => {
        const g = clipGeometry({ ...scenes[0], startMs: 50000, durationMs: 1000 }, 10000);
        expect(g.left).toBe(1);
        expect(g.width).toBe(0);
    });

    it("returns nothing for a film with no length, rather than dividing by zero", () => {
        expect(clipGeometry(scenes[0], 0)).toEqual({ left: 0, width: 0 });
    });
});

describe("sceneAt", () => {
    it("finds the scene under the playhead", () => {
        expect(sceneAt(scenes, 0)?.id).toBe("hook");
        expect(sceneAt(scenes, 1500)?.id).toBe("hook");
        expect(sceneAt(scenes, 5000)?.id).toBe("benefits");
        expect(sceneAt(scenes, 9999)?.id).toBe("outro");
    });

    /**
     * Half-open intervals. At exactly a cut the NEXT scene is on screen,
     * which is what the renderer does — closed intervals would have two
     * scenes both claiming that frame, and the inspector would flicker
     * between them.
     */
    it("gives a cut to the incoming scene", () => {
        expect(sceneAt(scenes, 3000)?.id).toBe("benefits");
        expect(sceneAt(scenes, 7000)?.id).toBe("outro");
    });

    it("is null past the end and in a gap", () => {
        expect(sceneAt(scenes, 10000)).toBeNull();
        expect(sceneAt([scenes[0], { ...scenes[2], startMs: 8000 }], 5000)).toBeNull();
    });
});

describe("frameAt", () => {
    const frames = [
        { url: "a.png", timeMs: 0 },
        { url: "b.png", timeMs: 2000 },
        { url: "c.png", timeMs: 4000 },
    ];

    /**
     * The LAST frame at or before the playhead, not the nearest. Frames are
     * sampled seconds apart, so "nearest" would show the upcoming scene while
     * the playhead is still in the previous one — the picture would change
     * before the cut does.
     */
    it("takes the last frame at or before the playhead", () => {
        expect(frameAt(frames, 0)?.url).toBe("a.png");
        expect(frameAt(frames, 1999)?.url).toBe("a.png");
        // Nearest would pick c.png here; correct is b.png.
        expect(frameAt(frames, 3900)?.url).toBe("b.png");
        expect(frameAt(frames, 9000)?.url).toBe("c.png");
    });

    it("shows the first frame rather than an empty stage before the first sample", () => {
        expect(frameAt([{ url: "late.png", timeMs: 5000 }], 0)?.url).toBe("late.png");
    });

    it("is null when there are no frames", () => {
        expect(frameAt([], 1000)).toBeNull();
        expect(frameAt(undefined, 1000)).toBeNull();
    });
});

describe("formatClock", () => {
    it("reads as a clock", () => {
        expect(formatClock(0)).toBe("0:00");
        expect(formatClock(4000)).toBe("0:04");
        expect(formatClock(63000)).toBe("1:03");
        expect(formatClock(600000)).toBe("10:00");
    });

    it("does not print NaN or negative time", () => {
        expect(formatClock(NaN)).toBe("0:00");
        expect(formatClock(-5000)).toBe("0:00");
    });
});

describe("rulerTicks", () => {
    it("spaces a short film at one second", () => {
        expect(rulerTicks(10000)).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]);
    });

    /** A long film must not grow a tick per second. */
    it("widens the step rather than crowding", () => {
        const ticks = rulerTicks(300000);
        expect(ticks.length).toBeLessThanOrEqual(11);
        expect(ticks[1] - ticks[0]).toBeGreaterThanOrEqual(30000);
    });

    it("never labels time the film does not have", () => {
        for (const t of rulerTicks(7000)) expect(t).toBeLessThanOrEqual(7000);
    });

    it("is empty for a film with no length", () => {
        expect(rulerTicks(0)).toEqual([]);
    });
});

describe("toLayerTree", () => {
    it("lists one node per scene when nothing is expanded", () => {
        const tree = toLayerTree(scenes, new Set());
        expect(tree).toHaveLength(3);
        expect(tree[0]).toMatchObject({ id: "hook", label: "hook", depth: 0 });
        expect(tree[0].detail).toBe("0:00 · 3.0s");
    });

    it("folds a scene's own file in underneath when expanded", () => {
        const tree = toLayerTree(scenes, new Set(["benefits"]));
        expect(tree.map((n) => n.id)).toEqual(["hook", "benefits", "benefits::src", "outro"]);
        // The directory prefix is noise in a tree that is already nested.
        expect(tree[2].label).toBe("benefits.html");
        expect(tree[2].depth).toBe(1);
    });

    /**
     * The shape authoring ACTUALLY emits. A single-document design has every
     * scene as a section of index.html, so `src` is "" — and the tree used to
     * offer a disclosure triangle that opened a bullet, a blank name and the
     * word "scene". The fixture above is the sub-composition shape, which is
     * why every test here passed while every real design on dev showed it.
     */
    describe("a single-document design, where a scene has no file", () => {
        const flat: DesignScene[] = [
            { id: "hook", src: "", startMs: 0, durationMs: 3000, trackIndex: 0 },
            { id: "cta", src: "", startMs: 3000, durationMs: 3000, trackIndex: 0 },
        ];

        it("offers no triangle, because there is nothing to open", () => {
            const tree = toLayerTree(flat, new Set());
            expect(tree.map((n) => n.hasChildren)).toEqual([false, false]);
        });

        it("folds out nothing even when asked to", () => {
            const tree = toLayerTree(flat, new Set(["hook", "cta"]));
            expect(tree.map((n) => n.id)).toEqual(["hook", "cta"]);
            // The assertion that would have caught the bug: no node is nameless.
            expect(tree.every((n) => n.label.length > 0)).toBe(true);
        });

        // "compositions/" with nothing after it is not a file either.
        it("treats a bare directory as no file", () => {
            const tree = toLayerTree(
                [{ id: "hook", src: "compositions/", startMs: 0, durationMs: 1000, trackIndex: 0 }],
                new Set(["hook"])
            );
            expect(tree).toHaveLength(1);
            expect(tree[0].hasChildren).toBe(false);
        });
    });

    it("still marks a sub-composition scene as expandable", () => {
        expect(toLayerTree(scenes, new Set()).every((n) => n.hasChildren)).toBe(true);
    });

    it("handles no scenes", () => {
        expect(toLayerTree(undefined, new Set())).toEqual([]);
    });
});
