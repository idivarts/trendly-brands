/**
 * The lane rules.
 *
 * Worth tests because two of them cost money when wrong: offering AI footage
 * where the format cannot hold video sells a clip that then gets dropped, and
 * mistaking uploaded media for generated media offers to re-generate something
 * that was never generated.
 */
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { currentLane, isEmptyScene, laneDef, resolveLane, sceneLanes } from "../scene-types";

const scene = (over: Partial<IStudioScene> = {}): IStudioScene =>
    ({
        id: "s1",
        durationMs: 4000,
        primaryKind: "motion",
        layers: [{ id: "l1", kind: "html", slot: "full" }],
        ...over,
    }) as IStudioScene;

describe("sceneLanes", () => {
    it("offers all four when footage is available", () => {
        expect(sceneLanes({ canFootage: true }).map((l) => l.key)).toEqual([
            "motion",
            "composite",
            "footage",
            "own",
        ]);
    });

    it("drops footage when the format cannot hold video", () => {
        // Not cosmetic: the clip would be generated, charged for, and then
        // dropped by a format with nowhere to put it.
        expect(sceneLanes({ canFootage: false }).map((l) => l.key)).toEqual([
            "motion",
            "composite",
            "own",
        ]);
    });

    it("gives an approach to the design lanes and only those", () => {
        // `footage` is a different endpoint with its own per-second price, and
        // `own` is not a generation. Handing either an `approach` would send
        // them down the design path.
        expect(laneDef("motion")?.approach).toBe("motion");
        expect(laneDef("composite")?.approach).toBe("composite");
        expect(laneDef("footage")?.approach).toBeUndefined();
        expect(laneDef("own")?.approach).toBeUndefined();
    });
});

describe("currentLane", () => {
    it("opens a design scene on how it was designed", () => {
        expect(currentLane(scene({ primaryKind: "motion" }))).toBe("motion");
        expect(currentLane(scene({ primaryKind: "composite" }))).toBe("composite");
    });

    it("tells generated footage from an uploaded clip", () => {
        expect(currentLane(scene({ primaryKind: "video", gen: { model: "veo" } as any }))).toBe(
            "footage"
        );
        expect(currentLane(scene({ primaryKind: "video" }))).toBe("own");
    });

    it("tells a generated image from an uploaded one", () => {
        expect(currentLane(scene({ primaryKind: "image", gen: { model: "x" } as any }))).toBe(
            "composite"
        );
        expect(currentLane(scene({ primaryKind: "image" }))).toBe("own");
    });

    it("chooses nothing for an empty scene", () => {
        // Deliberately null rather than a guess: defaulting to "motion" would
        // put a prompt box in front of someone who has not said they want a
        // design.
        expect(currentLane(scene({ primaryKind: "empty", layers: [] }))).toBeNull();
    });

    it("chooses nothing with no scene at all", () => {
        expect(currentLane(null)).toBeNull();
    });
});

describe("resolveLane", () => {
    const all = sceneLanes({ canFootage: true });
    const noFootage = sceneLanes({ canFootage: false });

    it("falls back to the scene's own lane until the user picks one", () => {
        expect(resolveLane(null, scene({ primaryKind: "composite" }), all)).toBe("composite");
    });

    it("honours an explicit pick over the scene's own lane", () => {
        expect(resolveLane("footage", scene({ primaryKind: "motion" }), all)).toBe("footage");
    });

    it("chooses nothing for an empty scene with no pick", () => {
        expect(resolveLane(null, scene({ primaryKind: "empty", layers: [] }), all)).toBeNull();
    });

    it("refuses a lane that is not on offer", () => {
        // A generated video scene on a format that cannot hold video. Returning
        // "footage" would draw a chosen lane with no controls under it, which
        // reads as the feature being broken.
        const vid = scene({ primaryKind: "video", gen: { model: "veo" } as any });
        expect(resolveLane(null, vid, noFootage)).toBeNull();
        expect(resolveLane("footage", vid, noFootage)).toBeNull();
    });
});

describe("isEmptyScene", () => {
    it("goes by the layers, not by primaryKind", () => {
        // The half-landed generation: the cache says motion, the authority says
        // nothing is there. Trusting the cache hides the picker from the one
        // scene that most needs it.
        expect(isEmptyScene(scene({ primaryKind: "motion", layers: [] }))).toBe(true);
    });

    it("is false for a scene with a layer", () => {
        expect(isEmptyScene(scene())).toBe(false);
    });

    it("is false with no scene", () => {
        expect(isEmptyScene(null)).toBe(false);
    });
});
