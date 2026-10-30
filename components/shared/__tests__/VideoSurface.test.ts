/**
 * The bug this guards against is invisible at the call site.
 *
 * expo-av's `Video` sizes its player from `videoStyle`, not `style`, and the
 * web build strips `position` from the player's style — so a `Video` used
 * directly renders at the file's INTRINSIC size on web, cropped by the box
 * around it, with its controls pushed outside. Nothing about
 * `<Video style={fill} />` looks wrong, and it was wrong in four places.
 *
 * `VideoSurface` always sets `videoStyle`. This keeps it the only way in.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(__dirname, "..", "..", "..");
const ROOTS = ["components", "app"];
const ALLOWED = "components/shared/VideoSurface.tsx";
const IMPORTS_VIDEO = /import\s*\{[^}]*\bVideo\b[^}]*\}\s*from\s*["']expo-av["']/;

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        if (entry === "node_modules") continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.tsx?$/.test(entry)) out.push(full);
    }
    return out;
}

describe("expo-av Video is only reached through VideoSurface", () => {
    it("has no other file importing Video from expo-av", () => {
        const offenders = ROOTS.flatMap((r) => walk(join(ROOT, r)))
            .filter((f) => IMPORTS_VIDEO.test(readFileSync(f, "utf8")))
            .map((f) => relative(ROOT, f))
            .filter((f) => f !== ALLOWED);
        expect(offenders).toEqual([]);
    });
});
