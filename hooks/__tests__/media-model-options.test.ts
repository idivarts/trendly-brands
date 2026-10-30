/**
 * The length chips offered for a video model.
 *
 * Every case here is a 422 waiting to happen: the provider validates the exact
 * value, and a chip the user can press that the provider always rejects reads
 * as the product being broken.
 */
import { IMediaModel } from "@/shared-libs/firestore/trendly-pro/models/media-model";
import { durationOptionsFor, secondsOf } from "../media-model-options";

const model = (over: Partial<IMediaModel>): IMediaModel => ({
    id: "m",
    provider: "elevenlabs",
    displayName: "M",
    kind: "video",
    enabled: true,
    ...over,
});

describe("durationOptionsFor", () => {
    // The reported bug: Veo takes 4, 6 or 8 and refuses 5, but the chips were
    // derived from the 4-8 range and offered 5s.
    it("offers the exact set when a model has one", () => {
        expect(
            durationOptionsFor(model({ minDurationS: 4, maxDurationS: 8, durationsS: [4, 6, 8] }))
        ).toEqual(["4s", "6s", "8s"]);
    });

    it("sorts the set and drops nonsense", () => {
        expect(durationOptionsFor(model({ durationsS: [8, 4, 0, 6] }))).toEqual(["4s", "6s", "8s"]);
    });

    it("falls back to the range when there is no set", () => {
        expect(durationOptionsFor(model({ minDurationS: 4, maxDurationS: 8 }))).toEqual([
            "4s",
            "5s",
            "6s",
            "8s",
        ]);
    });

    it("always offers something, so the request carries a length", () => {
        expect(durationOptionsFor(model({ minDurationS: 7, maxDurationS: 7 }))).toEqual(["7s"]);
        expect(durationOptionsFor(undefined)).toEqual([]);
    });
});

describe("secondsOf", () => {
    it("reads the label the chips store", () => {
        expect(secondsOf("8s")).toBe(8);
        expect(secondsOf("15s")).toBe(15);
        expect(secondsOf(undefined)).toBe(0);
        expect(secondsOf("auto")).toBe(0);
    });
});
