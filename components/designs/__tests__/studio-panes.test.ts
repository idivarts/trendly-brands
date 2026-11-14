import {
    DEFAULT_LAYOUT,
    LEFT_MIN,
    RIGHT_MIN,
    STAGE_MIN,
    clampPaneWidth,
    fitPanes,
    openingPanes,
    parseLayout,
} from "../studio-panes";

describe("clampPaneWidth", () => {
    it("keeps a panel above its own floor", () => {
        expect(clampPaneWidth(50, LEFT_MIN, 290, 1600)).toBe(LEFT_MIN);
    });

    /**
     * The maximum is what is left after the other panel and the stage, not
     * a fraction of the window: at 1280px two panels each capped at 40%
     * would leave the film 256px.
     */
    it("leaves room for the stage and the other panel", () => {
        const left = clampPaneWidth(9999, LEFT_MIN, 290, 1280);
        expect(left).toBe(1280 - 290 - STAGE_MIN);
        expect(left + 290 + STAGE_MIN).toBeLessThanOrEqual(1280);
    });

    it("prefers the floor over a negative budget on a tiny window", () => {
        expect(clampPaneWidth(400, LEFT_MIN, 290, 600)).toBe(LEFT_MIN);
    });

    it("does not resize to NaN", () => {
        expect(clampPaneWidth(NaN, LEFT_MIN, 290, 1600)).toBe(LEFT_MIN);
    });

    it("passes a sensible width straight through", () => {
        expect(clampPaneWidth(420, LEFT_MIN, 290, 1600)).toBe(420);
    });
});

describe("fitPanes", () => {
    it("leaves a comfortable window alone", () => {
        expect(fitPanes(420, 320, 1800)).toEqual({ left: 420, right: 320 });
    });

    /**
     * Someone who sized their panels on an external monitor and unplugged
     * it would otherwise return to a stage of no width — the panels keep
     * the widths they were given and nothing is left between them.
     */
    it("shrinks both panels when the window does", () => {
        const fitted = fitPanes(600, 500, 1200);
        expect(fitted.left + fitted.right + STAGE_MIN).toBeLessThanOrEqual(1201);
        expect(fitted.left).toBeGreaterThanOrEqual(LEFT_MIN);
        expect(fitted.right).toBeGreaterThanOrEqual(RIGHT_MIN);
        // The one deliberately made wider stays the wider of the two.
        expect(fitted.left).toBeGreaterThan(fitted.right);
    });

    it("falls back to both floors when nothing else fits", () => {
        expect(fitPanes(600, 500, 500)).toEqual({ left: LEFT_MIN, right: RIGHT_MIN });
    });

    it("never returns a panel below its floor", () => {
        for (const w of [400, 700, 900, 1100, 1400, 2400]) {
            const f = fitPanes(320, 290, w);
            expect(f.left).toBeGreaterThanOrEqual(LEFT_MIN);
            expect(f.right).toBeGreaterThanOrEqual(RIGHT_MIN);
        }
    });
});

describe("parseLayout", () => {
    it("reads a layout someone saved", () => {
        expect(parseLayout('{"left":400,"right":300,"timeline":false}')).toEqual({
            left: 400,
            right: 300,
            timeline: false,
        });
    });

    /** A stale or hand-edited entry must not open the studio with no stage. */
    it("defaults anything missing or nonsense", () => {
        expect(parseLayout("{}")).toEqual(DEFAULT_LAYOUT);
        expect(parseLayout("not json")).toEqual(DEFAULT_LAYOUT);
        expect(parseLayout('{"left":"wide","right":null,"timeline":"yes"}')).toEqual(DEFAULT_LAYOUT);
        expect(parseLayout('{"left":10,"right":10,"timeline":true}')).toEqual({
            left: LEFT_MIN,
            right: RIGHT_MIN,
            timeline: true,
        });
    });

    it("keeps a hidden timeline hidden", () => {
        expect(parseLayout('{"timeline":false}').timeline).toBe(false);
    });
});

describe("openingPanes", () => {
    /**
     * An empty film has nothing to look at, so the one thing a person can
     * do — say what they want — gets the room.
     */
    it("gives the prompt about half the width on a roomy screen", () => {
        const { left } = openingPanes(1800, 290);
        expect(left).toBeGreaterThanOrEqual(800);
        expect(left).toBeLessThanOrEqual(900);
    });

    /** The stage keeps its floor: an empty player is still the promise. */
    it("never squeezes the stage out, however narrow", () => {
        for (const w of [700, 900, 1024, 1280, 1800, 2560]) {
            const { left, right } = openingPanes(w, 290);
            expect(left).toBeGreaterThanOrEqual(LEFT_MIN);
            expect(right).toBeGreaterThanOrEqual(RIGHT_MIN);
            expect(w - left - right).toBeGreaterThanOrEqual(
                Math.min(STAGE_MIN, w - LEFT_MIN - RIGHT_MIN)
            );
        }
    });

    it("keeps the inspector at whatever width it was given", () => {
        expect(openingPanes(1800, 340).right).toBe(340);
        expect(openingPanes(1800, 10).right).toBe(RIGHT_MIN);
    });
});
