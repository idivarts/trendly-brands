/**
 * Where the model menu opens, as arithmetic.
 *
 * Split from the component because this is the part that was WRONG and the
 * part a test can hold: the component around it needs a renderer, a modal and
 * a measured layout before it will tell you anything, and none of that was
 * ever going to catch a menu hanging 90px above the chip it belongs to.
 */

export const DROPDOWN_WIDTH = 240;
export const DROPDOWN_MAX_HEIGHT = 320;
export const ANCHOR_GAP = 6;
/** Keeps the menu off the very edge of the screen on either side. */
export const SCREEN_EDGE = 8;
/**
 * Below this a menu is not worth opening in place — it would show one row and
 * a scrollbar. On a screen that cramped it overlaps the chip instead, which is
 * ugly but readable, where a one-row list is neither.
 */
export const MIN_DROPDOWN_HEIGHT = 120;

export interface AnchorRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DropdownPosition {
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
}

/**
 * Anchor the menu to the chip: below it when there is room, above it when
 * there is not, clamped so it never spills off-screen.
 *
 * ⚠️ The upward case is pinned by its BOTTOM, and that is the whole trick. It
 * used to compute a `top` of `anchor.y - gap - DROPDOWN_MAX_HEIGHT` —
 * reserving the maximum height whatever the list actually needed — so a menu
 * shorter than 320px hung from that top and left the difference as a gap
 * between the list and the chip it belongs to. Five models left about 90px of
 * blank space, which reads as a misplaced popup rather than a short one. The
 * bottom edge is the one that should stay put: it is the edge touching the
 * chip.
 *
 * `maxHeight` comes from the space actually available on that side, so a long
 * list scrolls instead of running off the screen.
 */
export function dropdownPositionFor(
    anchor: AnchorRect,
    screen: { width: number; height: number }
): DropdownPosition {
    const spaceBelow = screen.height - (anchor.y + anchor.height);
    const spaceAbove = anchor.y;
    const showAbove = spaceBelow < DROPDOWN_MAX_HEIGHT + ANCHOR_GAP + SCREEN_EDGE;

    let left = anchor.x;
    if (left + DROPDOWN_WIDTH > screen.width - SCREEN_EDGE) {
        left = Math.max(SCREEN_EDGE, screen.width - DROPDOWN_WIDTH - SCREEN_EDGE);
    }

    const room = (space: number) =>
        Math.max(
            MIN_DROPDOWN_HEIGHT,
            Math.min(DROPDOWN_MAX_HEIGHT, space - ANCHOR_GAP - SCREEN_EDGE)
        );

    if (showAbove) {
        return {
            left,
            bottom: screen.height - anchor.y + ANCHOR_GAP,
            maxHeight: room(spaceAbove),
        };
    }
    return {
        left,
        top: anchor.y + anchor.height + ANCHOR_GAP,
        maxHeight: room(spaceBelow),
    };
}
