/**
 * The contract these tests defend: wrapping a style in `fs()` / `lh()` must be a
 * no-op on desktop web. The desktop layout is already tuned and any drift there
 * — rounding, a stray multiplier, a breakpoint flip — is a regression, not an
 * improvement. Mobile is where the ramp is allowed to do work.
 */

// Every font size and line height that actually appears in the content-planner
// surfaces, so the table below is exercised against real values, not invented ones.
const USED_FONT_SIZES = [9, 10, 11, 12, 12.5, 13, 14, 15, 16, 17, 18, 19, 20, 22, 26, 28];
const USED_LINE_HEIGHTS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 26];

describe("Typography — desktop web is untouched", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.doMock("react-native", () => ({
            Platform: { OS: "web" },
            Dimensions: { get: () => ({ width: 1440, height: 900 }) },
        }));
    });

    it("treats a desktop viewport as non-mobile", () => {
        const { IS_MOBILE_TYPE } = require("../Typography");
        expect(IS_MOBILE_TYPE).toBe(false);
    });

    it("returns every real font size unchanged", () => {
        const { fs } = require("../Typography");
        for (const size of USED_FONT_SIZES) expect(fs(size)).toBe(size);
    });

    it("returns every real line height unchanged", () => {
        const { lh } = require("../Typography");
        for (const height of USED_LINE_HEIGHTS) expect(lh(height)).toBe(height);
    });

    it("returns text-box sizes unchanged", () => {
        const { fbox } = require("../Typography");
        expect(fbox(18)).toBe(18);
    });
});

describe("Typography — a zero-width web viewport must not scale", () => {
    // Some web render passes report an empty viewport before layout settles.
    // A naive `width < 768` would read that as a phone and scale up desktop.
    beforeEach(() => {
        jest.resetModules();
        jest.doMock("react-native", () => ({
            Platform: { OS: "web" },
            Dimensions: { get: () => ({ width: 0, height: 0 }) },
        }));
    });

    it("falls back to desktop sizing", () => {
        const { IS_MOBILE_TYPE, fs } = require("../Typography");
        expect(IS_MOBILE_TYPE).toBe(false);
        expect(fs(13)).toBe(13);
    });
});

describe("Typography — native scales up", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.doMock("react-native", () => ({
            Platform: { OS: "ios" },
            Dimensions: { get: () => ({ width: 390, height: 844 }) },
        }));
    });

    it("applies the documented ramp", () => {
        const { fs } = require("../Typography");
        const expected: Record<number, number> = {
            9: 12, 10: 12, 11: 13, 12: 14, 13: 15, 14: 16,
            15: 16, 16: 17, 17: 18, 18: 19, 19: 20, 20: 21,
            22: 22, 26: 26, 28: 28,
        };
        for (const [base, want] of Object.entries(expected)) {
            expect(fs(Number(base))).toBe(want);
        }
    });

    it("never renders below a 12pt floor", () => {
        const { fs } = require("../Typography");
        for (const size of USED_FONT_SIZES) expect(fs(size)).toBeGreaterThanOrEqual(12);
    });

    it("never grows a size by more than 3pt, so fixed layouts stay intact", () => {
        const { fs } = require("../Typography");
        for (const size of USED_FONT_SIZES) expect(fs(size) - size).toBeLessThanOrEqual(3);
    });

    it("keeps line height ahead of font size", () => {
        const { fs, lh } = require("../Typography");
        // The real pairings in the AI chat: base size -> base leading.
        const pairs: [number, number][] = [[11, 15], [12, 16], [13, 19], [14, 21], [15, 22]];
        for (const [size, height] of pairs) {
            expect(lh(height) / fs(size)).toBeGreaterThan(1.15);
        }
    });

    it("grows a text box enough to hold its bumped label", () => {
        const { fbox, fs } = require("../Typography");
        expect(fbox(18)).toBe(20);
        expect(fbox(18)).toBeGreaterThan(fs(10) + 6);
    });
});

describe("Typography — phone-width web scales up too", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.doMock("react-native", () => ({
            Platform: { OS: "web" },
            Dimensions: { get: () => ({ width: 390, height: 844 }) },
        }));
    });

    it("treats a phone browser like the native app", () => {
        const { IS_MOBILE_TYPE, fs } = require("../Typography");
        expect(IS_MOBILE_TYPE).toBe(true);
        expect(fs(13)).toBe(15);
    });
});
