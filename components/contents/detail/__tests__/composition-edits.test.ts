/**
 * The timeline's edit operations.
 *
 * These are the calls that decide what gets rendered and what gets charged, so
 * each test here is a rule we would otherwise only discover in an export:
 * a clip that cannot be shortened past a fade, a trim that leaves a freeze at
 * the end of a shot, an overlay restamped to the start of the video.
 */
import {
    Composition,
    measureComposition,
    measureOverlays,
    videoTrack,
} from "@/shared-libs/design/composition-runtime";
import { IAsset } from "@/shared-libs/firestore/trendly-pro/models/asset";
import {
    MIN_CLIP_MS,
    addOverlay,
    appendClip,
    clipFromAsset,
    clipLabel,
    cutFootageRange,
    findClip,
    footageOnScreenMs,
    insertClipAfter,
    moveClip,
    newClipId,
    patchClipSource,
    patchFootage,
    removeClip,
    setClipDuration,
    setOverlayWindow,
    setTransition,
} from "../design-stage/composition-edits";

const design = (id: string, durationMs: number): Composition["tracks"][0]["clips"][0] => ({
    id,
    durationMs,
    source: { kind: "design", revisionId: "rev1" },
});

const comp = (clips: Composition["tracks"][0]["clips"]): Composition => ({
    width: 1080,
    height: 1920,
    fps: 30,
    tracks: [{ kind: "video", clips }],
});

const videoClips = (c: Composition) => videoTrack(c)?.clips ?? [];

describe("appendClip / insertClipAfter", () => {
    it("appends and restamps the derived offsets", () => {
        const next = appendClip(comp([design("a", 2000)]), design("b", 3000));
        expect(videoClips(next).map((c) => c.id)).toEqual(["a", "b"]);
        expect(videoClips(next)[1].startMs).toBe(2000);
        expect(next.durationMs).toBe(5000);
    });

    it("inserts after a named clip, not at the end", () => {
        const next = insertClipAfter(
            comp([design("a", 1000), design("b", 1000)]),
            "a",
            design("x", 500)
        );
        expect(videoClips(next).map((c) => c.id)).toEqual(["a", "x", "b"]);
    });

    it("falls back to appending when the anchor is gone", () => {
        const next = insertClipAfter(comp([design("a", 1000)]), "nope", design("x", 500));
        expect(videoClips(next).map((c) => c.id)).toEqual(["a", "x"]);
    });
});

describe("removeClip", () => {
    it("removes a clip and recloses the timeline", () => {
        const next = removeClip(comp([design("a", 2000), design("b", 3000)]), "a");
        expect(videoClips(next).map((c) => c.id)).toEqual(["b"]);
        expect(videoClips(next)[0].startMs).toBe(0);
        expect(next.durationMs).toBe(3000);
    });

    // A composition with an empty video track cannot render at all, and the
    // honest way to end up with no media is to clear the media.
    it("refuses to remove the last picture clip", () => {
        const one = comp([design("a", 2000)]);
        expect(removeClip(one, "a")).toBe(one);
    });

    it("removes the last OVERLAY happily", () => {
        const withOne = addOverlay(comp([design("a", 4000)]), {
            id: "o1",
            startMs: 1000,
            durationMs: 1000,
            source: { kind: "design", revisionId: "cap", transparent: true },
        });
        const next = removeClip(withOne, "o1");
        expect(measureOverlays(next)).toHaveLength(0);
        expect(videoClips(next)).toHaveLength(1);
    });
});

describe("moveClip", () => {
    it("swaps with the neighbour and re-derives offsets", () => {
        const next = moveClip(comp([design("a", 1000), design("b", 4000)]), "b", -1);
        expect(videoClips(next).map((c) => c.id)).toEqual(["b", "a"]);
        expect(measureComposition(next).clips.map((c) => c.startMs)).toEqual([0, 4000]);
    });

    it("is a no-op at either end", () => {
        const c = comp([design("a", 1000), design("b", 1000)]);
        expect(moveClip(c, "a", -1)).toBe(c);
        expect(moveClip(c, "b", 1)).toBe(c);
    });
});

describe("setClipDuration", () => {
    it("clamps to the minimum rather than accepting a zero-length clip", () => {
        const next = setClipDuration(comp([design("a", 2000)]), "a", 0);
        expect(videoClips(next)[0].durationMs).toBe(MIN_CLIP_MS);
    });
});

describe("setTransition", () => {
    it("stores the fade the user asked for, not the clamped one", () => {
        // The runtime clamps an overlap to half the shorter clip — here 250ms —
        // but the stored value stays 1000 so lengthening the clips restores it.
        const next = setTransition(
            comp([design("a", 500), design("b", 4000)]),
            "b",
            "fade",
            1000
        );
        expect(findClip(next, "b")!.clip.transitionIn).toEqual({ kind: "fade", ms: 1000 });
        expect(measureComposition(next).clips[1].transition.ms).toBe(250);
    });

    it("zeroes the length on a cut", () => {
        const faded = setTransition(comp([design("a", 2000), design("b", 2000)]), "b", "fade", 400);
        const cut = setTransition(faded, "b", "cut");
        expect(findClip(cut, "b")!.clip.transitionIn).toEqual({ kind: "cut", ms: 0 });
    });
});

describe("footage trimming", () => {
    const footageComp = (): Composition =>
        comp([
            {
                id: "f1",
                durationMs: 4000,
                source: { kind: "footage", url: "https://x/v.mp4", inMs: 0, outMs: 4000, volume: 0 },
            },
        ]);

    it("re-lengths the clip to the trim, so nothing freezes at the end", () => {
        const next = patchFootage(footageComp(), "f1", { outMs: 2500 });
        expect(findClip(next, "f1")!.clip.durationMs).toBe(2500);
    });

    // At 2x a 4s window is on screen for 2s. Getting this backwards is what
    // makes a sped-up clip run out of source halfway through.
    it("divides the window by the speed", () => {
        const next = patchFootage(footageComp(), "f1", { speed: 2 });
        expect(findClip(next, "f1")!.clip.durationMs).toBe(2000);
        const slow = patchFootage(footageComp(), "f1", { speed: 0.5 });
        expect(findClip(slow, "f1")!.clip.durationMs).toBe(8000);
    });

    it("pushes the out point past the in point rather than inverting the trim", () => {
        const next = patchFootage(footageComp(), "f1", { inMs: 3000, outMs: 1000 });
        const s = findClip(next, "f1")!.clip.source as { inMs: number; outMs: number };
        expect(s.outMs).toBeGreaterThan(s.inMs);
    });

    it("falls back to the asset's length when there is no out point", () => {
        expect(footageOnScreenMs({ kind: "footage", url: "u" }, 7000)).toBe(7000);
        // Nothing known at all: the clip still has to have a length.
        expect(footageOnScreenMs({ kind: "footage", url: "u" })).toBe(MIN_CLIP_MS);
    });

    it("leaves a non-footage clip alone", () => {
        const c = comp([design("a", 1000)]);
        expect(patchFootage(c, "a", { speed: 2 })).toBe(c);
    });
});

describe("cutFootageRange", () => {
    const comp4s = (): Composition =>
        comp([
            {
                id: "f1",
                durationMs: 4000,
                source: { kind: "footage", url: "https://x/v.mp4", inMs: 0, outMs: 4000, volume: 0 },
            },
            design("after", 1000),
        ]);

    // Striking a line out of the middle of the transcript leaves two pieces.
    it("splits the clip in two when the range is interior", () => {
        const next = cutFootageRange(comp4s(), "f1", 1500, 2500);
        const clips = videoClips(next);
        expect(clips).toHaveLength(3);
        expect(clips[0].source).toMatchObject({ inMs: 0, outMs: 1500 });
        expect(clips[1].source).toMatchObject({ inMs: 2500, outMs: 4000 });
        expect(clips[0].durationMs).toBe(1500);
        expect(clips[1].durationMs).toBe(1500);
        // Two clips in one composition must never share an id.
        expect(clips[0].id).not.toBe(clips[1].id);
        // And the design that followed shifts up by the second that went.
        expect(measureComposition(next).clips[2].startMs).toBe(3000);
    });

    it("is a trim, not a split, when the range reaches the start", () => {
        const next = cutFootageRange(comp4s(), "f1", 0, 1000);
        const clips = videoClips(next);
        expect(clips).toHaveLength(2);
        expect(clips[0].source).toMatchObject({ inMs: 1000, outMs: 4000 });
        expect(clips[0].durationMs).toBe(3000);
    });

    it("is a trim when the range reaches the end", () => {
        const next = cutFootageRange(comp4s(), "f1", 3000, 4000);
        expect(videoClips(next)[0].source).toMatchObject({ inMs: 0, outMs: 3000 });
    });

    it("refuses to cut the whole clip away", () => {
        const c = comp4s();
        expect(cutFootageRange(c, "f1", 0, 4000)).toBe(c);
    });

    it("ignores an empty range and a clip that is not footage", () => {
        const c = comp4s();
        expect(cutFootageRange(c, "f1", 2000, 2000)).toBe(c);
        expect(cutFootageRange(c, "after", 0, 500)).toBe(c);
    });

    it("gives the second piece a cut, not the original's fade", () => {
        const faded = setTransition(comp4s(), "f1", "fade", 300);
        const next = cutFootageRange(faded, "f1", 1500, 2500);
        const clips = videoClips(next);
        expect(clips[0].transitionIn).toEqual({ kind: "fade", ms: 300 });
        expect(clips[1].transitionIn).toEqual({ kind: "cut", ms: 0 });
    });

    it("measures the pieces through the speed", () => {
        const fast = patchFootage(comp4s(), "f1", { speed: 2 });
        const next = cutFootageRange(fast, "f1", 1500, 2500);
        // 1.5s of source at 2x is 0.75s on screen, twice.
        expect(videoClips(next)[0].durationMs).toBe(750);
        expect(videoClips(next)[1].durationMs).toBe(750);
    });
});

describe("overlays", () => {
    const withCaption = () =>
        addOverlay(comp([design("a", 6000)]), {
            id: "o1",
            startMs: 1000,
            durationMs: 2000,
            source: { kind: "design", revisionId: "cap", transparent: true },
        });

    // The video track's offsets are derived; an overlay's startMs is authored.
    // Restamping it would move every caption to the start of the timeline.
    it("keeps an authored start through an unrelated edit", () => {
        const next = setClipDuration(withCaption(), "a", 8000);
        expect(measureOverlays(next)[0].startMs).toBe(1000);
    });

    it("moves and resizes within its own track", () => {
        const next = setOverlayWindow(withCaption(), "o1", 2500, 1500);
        const [o] = measureOverlays(next);
        expect(o.startMs).toBe(2500);
        expect(o.durationMs).toBe(1500);
    });

    it("never starts before the video does", () => {
        const next = setOverlayWindow(withCaption(), "o1", -500);
        expect(measureOverlays(next)[0].startMs).toBe(0);
    });

    it("refuses to move a picture clip as if it were an overlay", () => {
        const c = withCaption();
        expect(setOverlayWindow(c, "a", 3000)).toBe(c);
    });

    it("creates the overlay track on a composition derived from a design", () => {
        const bare = comp([design("a", 3000)]);
        expect(bare.tracks).toHaveLength(1);
        const next = addOverlay(bare, {
            id: "o",
            startMs: 0,
            durationMs: 1000,
            source: { kind: "design", revisionId: "cap", transparent: true },
        });
        expect(next.tracks.some((t) => t.kind === "overlay")).toBe(true);
    });
});

describe("clipFromAsset", () => {
    const asset = (over: Partial<IAsset>): IAsset => ({
        id: "a1",
        kind: "image",
        source: "upload",
        url: "https://x/i.jpg",
        createdAt: 1,
        ...over,
    });

    it("respects the take's own in and out points", () => {
        const clip = clipFromAsset(
            asset({ kind: "video", url: "https://x/v.mp4", durationMs: 30_000, trimInMs: 2000, trimOutMs: 7000 })
        );
        expect(clip.source).toMatchObject({ kind: "footage", inMs: 2000, outMs: 7000 });
        expect(clip.durationMs).toBe(5000);
    });

    it("silences footage audio by default", () => {
        const clip = clipFromAsset(asset({ kind: "video", durationMs: 4000 }));
        expect((clip.source as { volume: number }).volume).toBe(0);
    });

    it("reads a length from ingest when the asset has none of its own", () => {
        const clip = clipFromAsset(
            asset({ kind: "video", ingest: { status: "done", durationMs: 9000 } })
        );
        expect(clip.durationMs).toBe(9000);
    });

    it("gives a still a slow push and carries the asset id", () => {
        const clip = clipFromAsset(asset({}));
        expect(clip.source).toMatchObject({ kind: "image", kenBurns: "in", assetId: "a1" });
        expect(clip.durationMs).toBeGreaterThan(0);
    });
});

describe("patchClipSource", () => {
    it("merges into the source and leaves the clip otherwise alone", () => {
        const next = patchClipSource(comp([design("a", 2000)]), "a", { sceneIndex: 2 });
        expect(findClip(next, "a")!.clip.source).toEqual({
            kind: "design",
            revisionId: "rev1",
            sceneIndex: 2,
        });
        expect(findClip(next, "a")!.clip.durationMs).toBe(2000);
    });
});

describe("ids and labels", () => {
    it("mints distinct ids", () => {
        expect(new Set([newClipId(), newClipId(), newClipId()]).size).toBe(3);
    });

    it("names a clip by what it is", () => {
        expect(clipLabel(design("a", 1))).toBe("Your design");
        expect(
            clipLabel({ id: "s", durationMs: 1, source: { kind: "design", revisionId: "r", sceneIndex: 1 } })
        ).toBe("Scene 2");
        // A generated clip with no url has not landed yet, and a tile that
        // claims otherwise is a tile the user will try to render.
        expect(
            clipLabel({ id: "g", durationMs: 1, source: { kind: "genvideo", model: "m", prompt: "p" } })
        ).toBe("AI clip — generating");
    });
});
