import { formatTimeToNow } from "@/utils/date";

describe("formatTimeToNow", () => {
    it("formats an epoch-ms timestamp", () => {
        expect(formatTimeToNow(Date.now() - 60_000)).toContain("ago");
    });

    it("formats epoch seconds too", () => {
        expect(formatTimeToNow(Math.floor((Date.now() - 60_000) / 1000))).toContain("ago");
    });

    it("still formats an ISO date string", () => {
        const iso = new Date(Date.now() - 86_400_000).toISOString();
        expect(formatTimeToNow(iso)).toContain("ago");
    });

    it("formats a Firestore Timestamp", () => {
        const seconds = Math.floor((Date.now() - 3_600_000) / 1000);
        expect(formatTimeToNow({ seconds, nanoseconds: 0 })).toContain("ago");
    });

    // The regression. These used to fall through the normaliser untouched, so
    // `instanceof Date` was false, the NaN guard was skipped, and date-fns threw
    // RangeError from inside a render — taking down the screen holding the label
    // rather than degrading it.
    it.each([
        ["undefined", undefined],
        ["null", null],
        ["a non-date string", "not a date"],
        ["an empty object", {}],
        ["NaN", NaN],
        ["Infinity", Infinity],
    ])("returns a placeholder for %s instead of throwing", (_label, value) => {
        expect(() => formatTimeToNow(value as any)).not.toThrow();
        expect(formatTimeToNow(value as any)).toBe("-");
    });
});
