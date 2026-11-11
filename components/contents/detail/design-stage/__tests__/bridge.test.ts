/**
 * The frame script, which TypeScript cannot check.
 *
 * `BRIDGE_SCRIPT` is a template literal, so everything in it — including its
 * comments — is a string to the compiler. A stray backtick ends the literal and
 * a stray `${` becomes an interpolation, and the first of those happened: a
 * comment written with `holdAtStart` in backticks closed the string and the
 * error surfaced two hundred lines away as "',' expected".
 *
 * The file's own header warns about the sharper version of the same hazard — a
 * minified build emitting the inlined runtime functions as anonymous
 * expressions, which is a PARSE error that takes the whole script down: no
 * __cmd, no taps, no playback, and no clue in the frame as to why. It worked in
 * a dev server and died in every production build.
 *
 * So the first test here compiles the script. It is cheap and it is the only
 * thing standing between that class of mistake and a silent frame.
 */
import { BRIDGE_SCRIPT, buildFrameHtml, injectBridge } from "../bridge";

describe("the injected frame script", () => {
    it("is syntactically valid JavaScript", () => {
        // Compiles without running: the body touches window/document only
        // inside functions.
        expect(() => new Function(BRIDGE_SCRIPT)).not.toThrow();
    });

    it("still parses once the hold flag is prepended", () => {
        const tag = injectBridge("<html><body></body></html>", true);
        const script = tag.slice(
            tag.indexOf("<script data-frame-bridge>") + "<script data-frame-bridge>".length,
            tag.lastIndexOf("</script>")
        );
        expect(script).toContain("window.__frameHold=true");
        expect(() => new Function(script)).not.toThrow();
    });
});

describe("holding a design on its first frame", () => {
    it("asks the document to hold when a transport owns the clock", () => {
        expect(buildFrameHtml("<html><body></body></html>", 1, 1080, 1920, true)).toContain(
            "window.__frameHold=true"
        );
    });

    it("does NOT hold by default", () => {
        // A still design has no play button. Pinning one that animates in from
        // opacity:0 would leave it blank for good, so the flag is opt-in and
        // every existing caller keeps the old behaviour.
        expect(buildFrameHtml("<html><body></body></html>", 1, 1080, 1920)).toContain(
            "window.__frameHold=false"
        );
    });

    it("puts the flag INSIDE the tagged script, so a save strips it too", () => {
        // `serialize()` drops [data-frame-bridge] wholesale. A flag in a tag of
        // its own would survive into the saved document and travel to the
        // render worker, which has its own ideas about time.
        const html = buildFrameHtml("<html><body></body></html>", 1, 1080, 1920, true);
        const tags = html.match(/<script[^>]*>/g) ?? [];
        expect(tags).toHaveLength(1);
        expect(tags[0]).toContain("data-frame-bridge");
    });

    it("pins at zero and re-pins on the first frame, but never over playback", () => {
        // The second pin exists because an animation the browser has not
        // resolved style for yet is absent from getAnimations() at end-of-parse.
        // It must not fire once play() has started, or pressing Play on a scene
        // would snap it back to the beginning one frame later.
        expect(BRIDGE_SCRIPT).toContain("if (window.__frameHold)");
        expect(BRIDGE_SCRIPT).toMatch(/requestAnimationFrame\(function\(\)\{\s*if \(vRaf \|\| vStartWall\) return;/);
    });
});
