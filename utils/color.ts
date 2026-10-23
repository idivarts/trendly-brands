// ─── color ────────────────────────────────────────────────────────────────────
// Alpha blending for design-token colors.
//
// ⚠️ Why this exists: the tokens in `shared-uis/constants/Colors.ts` are
// `rgb(…)` STRINGS, not hex. So the tempting shorthand
//
//     backgroundColor: colors.onPrimary + "33"      // ❌
//
// produces `"rgb(255, 255, 255)33"` — not a color at all. On web the browser
// silently drops the invalid declaration, so whatever the base style set wins;
// on native it's undefined behaviour. This shipped as a real bug: a selected
// chip's checkmark circle fell back to white, with a white check inside it, so
// the selected state rendered as an empty white circle.
//
// Always go through `withAlpha()` instead. It handles `rgb()`, `rgba()`, 3/6/8-
// digit hex, and `transparent`.

/** Clamp to the 0–1 alpha range. */
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Return `color` at `alpha` opacity (0–1), as an `rgba()` string.
 *
 * ```ts
 * withAlpha(colors.onPrimary, 0.2)  // "rgba(255, 255, 255, 0.2)"
 * withAlpha("#054463", 0.5)         // "rgba(5, 68, 99, 0.5)"
 * ```
 *
 * Unparseable input is returned unchanged rather than throwing — a slightly
 * wrong color is a better failure mode than a crashed screen.
 */
export function withAlpha(color: string, alpha: number): string {
    const a = clamp01(alpha);
    const input = (color ?? "").trim();
    if (!input || input === "transparent") return "transparent";

    // rgb(r, g, b) / rgba(r, g, b, a) — including the space-separated CSS4 form.
    const fnMatch = input.match(/^rgba?\(([^)]+)\)$/i);
    if (fnMatch) {
        const parts = fnMatch[1]
            .split(/[,/\s]+/)
            .map((p) => p.trim())
            .filter(Boolean);
        if (parts.length >= 3) {
            const [r, g, b] = parts;
            // Multiply into any existing alpha so nesting composes predictably.
            const existing = parts.length >= 4 ? parseFloat(parts[3]) : 1;
            const finalA = clamp01((Number.isFinite(existing) ? existing : 1) * a);
            return `rgba(${r}, ${g}, ${b}, ${finalA})`;
        }
        return input;
    }

    // #rgb / #rrggbb / #rrggbbaa
    const hex = input.replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) {
        const [r, g, b] = hex.split("").map((c) => parseInt(c + c, 16));
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    if (/^[0-9a-f]{6}$/i.test(hex) || /^[0-9a-f]{8}$/i.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const existing = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return `rgba(${r}, ${g}, ${b}, ${clamp01(existing * a)})`;
    }

    return input;
}
