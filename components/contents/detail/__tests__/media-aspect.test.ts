import { isAspectAccepted, previewAspect } from "../media-spec";

describe("isAspectAccepted", () => {
    it("rejects a landscape asset on a reel (the reported bug)", () => {
        // 1920x1080 landscape clip uploaded to a 9:16 Reel.
        expect(isAspectAccepted("reel", 1920 / 1080)).toBe(false);
        // ...so the preview falls back to the canonical 9:16.
        expect(previewAspect("reel")).toBeCloseTo(0.5625, 4);
    });

    it("accepts a genuine 9:16 clip on a reel", () => {
        expect(isAspectAccepted("reel", 1080 / 1920)).toBe(true);
    });

    it("accepts the whole landscape band on a video", () => {
        expect(isAspectAccepted("video", 4 / 3)).toBe(true);     // 1.333
        expect(isAspectAccepted("video", 16 / 9)).toBe(true);    // 1.777
        expect(isAspectAccepted("video", 2.39)).toBe(true);      // 21:9
        expect(isAspectAccepted("video", 0.5625)).toBe(false);   // portrait
    });

    it("accepts both 1:1 and 4:5 on a post", () => {
        expect(isAspectAccepted("post", 1)).toBe(true);
        expect(isAspectAccepted("post", 0.8)).toBe(true);
        expect(isAspectAccepted("post", 1920 / 1080)).toBe(false);
    });

    it("treats a missing or nonsense measurement as not accepted", () => {
        expect(isAspectAccepted("reel", undefined)).toBe(false);
        expect(isAspectAccepted("reel", 0)).toBe(false);
        expect(isAspectAccepted("reel", NaN)).toBe(false);
        expect(isAspectAccepted("reel", Infinity)).toBe(false);
    });

    it("never accepts a type that has no media", () => {
        expect(isAspectAccepted("live", 1)).toBe(false);
        expect(isAspectAccepted("text", 1)).toBe(false);
    });
});
