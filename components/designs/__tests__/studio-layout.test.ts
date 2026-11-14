import {
    TICK_SPACING_PX,
    ticksForWidth,
    clipGeometry,
    formatClock,
    frameAt,
    rulerTicks,
    sceneAt,
    timelineDurationMs,
    isPlayerEcho,
    PLAYER_ECHO_MS,
    toLayerTree,
    clipAt,
    timelineTracks,
    type DesignClip,
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

describe("timelineTracks", () => {
    const clips: DesignClip[] = [
        { elementId: "s1", kind: "scene", trackIndex: 0, startMs: 0, durationMs: 3000, label: "hook" },
        { elementId: "s2", kind: "scene", trackIndex: 0, startMs: 3000, durationMs: 3000, label: "benefits" },
        { elementId: "shot", kind: "image", trackIndex: 1, startMs: 0, durationMs: 3000, label: "pour.jpg" },
        { elementId: "vo", kind: "voice", trackIndex: 2, startMs: 0, durationMs: 6000, label: "Cold brew, cold mornings" },
        { elementId: "score", kind: "music", trackIndex: 3, startMs: 0, durationMs: 6000, label: "bgm_001.wav" },
        { elementId: "caps", kind: "captions", trackIndex: 4, startMs: 0, durationMs: 6000, label: "Cold brew" },
    ];

    /**
     * The whole point of the phase. A reel with music, a voiceover and a
     * photograph used to draw ONE row and three invisible things.
     */
    it("draws a row for each kind of thing in the film", () => {
        const tracks = timelineTracks(clips, undefined);
        expect(tracks.map((t) => t.index)).toEqual([0, 1, 2, 3, 4]);
        expect(tracks.map((t) => t.label)).toEqual([
            "Scenes",
            "Pictures",
            "Voice",
            "Music",
            "Captions",
        ]);
        expect(tracks[0].clips.map((c) => c.elementId)).toEqual(["s1", "s2"]);
    });

    it("names a row after what most of it is, not after its number", () => {
        // The media row normally mixes a picture and a video.
        const mixed = timelineTracks(
            [
                { elementId: "a", kind: "image", trackIndex: 7, startMs: 0, durationMs: 1000 },
                { elementId: "b", kind: "image", trackIndex: 7, startMs: 1000, durationMs: 1000 },
                { elementId: "c", kind: "video", trackIndex: 7, startMs: 2000, durationMs: 1000 },
            ],
            undefined
        );
        expect(mixed).toHaveLength(1);
        expect(mixed[0].index).toBe(7);
        expect(mixed[0].label).toBe("Pictures");
        // The video is still ON the row — the name decides nothing else.
        expect(mixed[0].clips).toHaveLength(3);
    });

    it("orders clips within a row by time, whatever order they arrive in", () => {
        const t = timelineTracks([clips[1], clips[0]], undefined);
        expect(t[0].clips.map((c) => c.elementId)).toEqual(["s1", "s2"]);
    });

    /**
     * Every design authored before the backend reported clips has scenes and
     * nothing else. It must still draw its spine rather than an empty
     * timeline, which would read as a broken studio.
     */
    it("falls back to the scenes for a film written before clips existed", () => {
        const t = timelineTracks(undefined, scenes);
        expect(t).toHaveLength(1);
        expect(t[0].label).toBe("Scenes");
        expect(t[0].clips.map((c) => c.elementId)).toEqual(["hook", "benefits", "outro"]);
        expect(t[0].clips.every((c) => c.kind === "scene")).toBe(true);
    });

    it("prefers the clips when both are there", () => {
        const t = timelineTracks(clips, scenes);
        expect(t).toHaveLength(5);
    });

    it("drops a clip with no id, which nothing could address later", () => {
        const t = timelineTracks(
            [
                { elementId: "", kind: "image", trackIndex: 1, startMs: 0, durationMs: 1000 },
                clips[0],
            ],
            undefined
        );
        expect(t).toHaveLength(1);
        expect(t[0].clips.map((c) => c.elementId)).toEqual(["s1"]);
    });

    it("handles nothing at all", () => {
        expect(timelineTracks(undefined, undefined)).toEqual([]);
        expect(timelineTracks([], [])).toEqual([]);
    });
});

describe("clipAt", () => {
    const clips: DesignClip[] = [
        { elementId: "s1", kind: "scene", trackIndex: 0, startMs: 0, durationMs: 3000 },
        { elementId: "s2", kind: "scene", trackIndex: 0, startMs: 3000, durationMs: 3000 },
        { elementId: "score", kind: "music", trackIndex: 3, startMs: 0, durationMs: 6000 },
    ];

    it("is the scene under the playhead, never the music over it", () => {
        expect(clipAt(clips, 1500)?.elementId).toBe("s1");
        // Half-open at the cut: the NEXT scene owns the frame, so two clips
        // never both claim it.
        expect(clipAt(clips, 3000)?.elementId).toBe("s2");
        expect(clipAt(clips, 6000)).toBeNull();
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
    it("spaces a short film at one second, and does not label the very end", () => {
        // The last tick's label is drawn rightwards from its mark, so one
        // at 100% prints outside the lane — off the edge of the pane on a
        // phone. The end of the ruler is the end of the film already.
        expect(rulerTicks(10000)).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]);
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

/**
 * The app and the live player each have a clock, and both write to the same
 * playhead. This is the rule that stops them fighting over it.
 */
describe("isPlayerEcho", () => {
    it("is false before the player has said anything", () => {
        expect(isPlayerEcho(null, 4000)).toBe(false);
    });

    it("treats the player's own tick as its own", () => {
        expect(isPlayerEcho(4000, 4000)).toBe(true);
        expect(isPlayerEcho(4000, 4000 + PLAYER_ECHO_MS)).toBe(true);
        expect(isPlayerEcho(4000, 4000 - PLAYER_ECHO_MS)).toBe(true);
    });

    it("lets a real seek through", () => {
        // Clicking a scene three seconds away is nobody's rounding error.
        expect(isPlayerEcho(4000, 7000)).toBe(false);
        expect(isPlayerEcho(4000, 0)).toBe(false);
        expect(isPlayerEcho(4000, 4000 + PLAYER_ECHO_MS + 1)).toBe(false);
    });

    // A tick at 30fps is 33ms; the window must swallow one without swallowing
    // a deliberate jump.
    it("is wider than a frame and narrower than a scene", () => {
        expect(PLAYER_ECHO_MS).toBeGreaterThan(1000 / 30);
        expect(PLAYER_ECHO_MS).toBeLessThan(1000);
    });
});


describe("rulerTicks / ticksForWidth", () => {
    /**
     * At phone width ten labels in 375px overlapped into a grey smear, and
     * the last one printed off the edge of the screen.
     */
    it("thins the ruler on a narrow lane", () => {
        const wide = rulerTicks(9000, ticksForWidth(900));
        const narrow = rulerTicks(9000, ticksForWidth(300));
        expect(narrow.length).toBeLessThan(wide.length);
        expect(narrow.length).toBeGreaterThanOrEqual(2);
    });

    /** The actual requirement: labels that do not touch each other. */
    it("leaves room between every pair of labels, at any width", () => {
        for (const w of [240, 300, 420, 600, 900, 1400]) {
            for (const total of [3000, 9000, 45000, 300000]) {
                const t = rulerTicks(total, ticksForWidth(w));
                for (let i = 1; i < t.length; i++) {
                    const gapPx = ((t[i] - t[i - 1]) / total) * w;
                    expect(gapPx).toBeGreaterThanOrEqual(TICK_SPACING_PX - 1);
                }
            }
        }
    });

    it("never labels the very end, whose label would print outside the lane", () => {
        for (const w of [300, 600, 900]) {
            for (const t of rulerTicks(9000, ticksForWidth(w))) {
                expect(t / 9000).toBeLessThanOrEqual(0.97);
            }
        }
    });

    it("still gives a usable ruler when the lane has not been measured", () => {
        expect(rulerTicks(9000, ticksForWidth(0)).length).toBeGreaterThan(2);
    });

    it("has nothing to draw for a film of no length", () => {
        expect(rulerTicks(0, 10)).toEqual([]);
    });
});
