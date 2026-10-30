/**
 * Where the model menu opens.
 *
 * Extracted from the component so the geometry can be checked without a
 * renderer — the bug it is about was invisible in every test that only asked
 * whether the menu opened.
 */
import {
    ANCHOR_GAP,
    DROPDOWN_MAX_HEIGHT,
    DROPDOWN_WIDTH,
    MIN_DROPDOWN_HEIGHT,
    SCREEN_EDGE,
    dropdownPositionFor,
} from "../dropdown-position";

const screen = { width: 1440, height: 900 };
const chip = (x: number, y: number) => ({ x, y, width: 120, height: 28 });

describe("opening upwards", () => {
    // The reported bug: with the chip near the bottom, the menu was placed at
    // `chip.y - gap - MAX_HEIGHT` whatever the list needed, so a short list
    // hung from that top and left the difference as a gap above the chip.
    const pos = dropdownPositionFor(chip(400, 790), screen);

    it("pins the bottom edge to the chip, not the top edge to the maximum", () => {
        expect(pos).toHaveProperty("bottom");
        expect(pos).not.toHaveProperty("top");
        // The menu's bottom sits exactly ANCHOR_GAP above the chip, so the gap
        // cannot depend on how tall the list happens to be.
        expect(pos.bottom).toBe(screen.height - 790 + ANCHOR_GAP);
    });

    it("never reserves more height than there is room above", () => {
        // A short window: no room below (172px) and only 200px above, so the
        // menu opens upward and has to fit in what is there.
        const short = { width: 1440, height: 400 };
        const tight = dropdownPositionFor(chip(400, 200), short);
        expect(tight.bottom).toBeDefined();
        expect(tight.maxHeight).toBeLessThanOrEqual(200 - ANCHOR_GAP - SCREEN_EDGE);
        expect(tight.maxHeight).toBeGreaterThanOrEqual(MIN_DROPDOWN_HEIGHT);
    });

    it("keeps a usable height even when squeezed into almost nothing", () => {
        const squeezed = dropdownPositionFor(chip(400, 40), { width: 1440, height: 200 });
        expect(squeezed.maxHeight).toBe(MIN_DROPDOWN_HEIGHT);
    });
});

describe("opening downwards", () => {
    const pos = dropdownPositionFor(chip(400, 100), screen);

    it("sits just under the chip", () => {
        expect(pos.top).toBe(100 + 28 + ANCHOR_GAP);
        expect(pos).not.toHaveProperty("bottom");
    });

    it("caps at the menu's own maximum when there is plenty of room", () => {
        expect(pos.maxHeight).toBe(DROPDOWN_MAX_HEIGHT);
    });
});

describe("staying on screen", () => {
    it("pulls a right-edge chip's menu back inside", () => {
        const pos = dropdownPositionFor(chip(1400, 100), screen);
        expect(pos.left).toBe(screen.width - DROPDOWN_WIDTH - SCREEN_EDGE);
    });

    it("leaves a comfortably placed chip where it is", () => {
        expect(dropdownPositionFor(chip(400, 100), screen).left).toBe(400);
    });

    it("never pushes a menu off the left edge on a narrow screen", () => {
        const phone = { width: 360, height: 800 };
        const pos = dropdownPositionFor(chip(300, 100), phone);
        expect(pos.left).toBeGreaterThanOrEqual(SCREEN_EDGE);
    });
});
