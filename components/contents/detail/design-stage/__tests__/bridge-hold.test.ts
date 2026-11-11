/**
 * The hold, EXECUTED.
 *
 * `bridge.test.ts` compiles the script; this one runs it, because "does it
 * parse" and "does it actually stop the animation" are different questions and
 * only the second one is the bug the user reported. The script is a string
 * injected into a WebView, so there is no other way to exercise it in CI — a
 * stub document is the whole apparatus.
 *
 * What a real browser adds over this stub is paint timing, and that is checked
 * by opening a scene in the studio. What the stub adds over a browser is that
 * it runs on every commit.
 */
import { BRIDGE_SCRIPT } from "../bridge";

interface FakeAnim {
    currentTime: number | null;
    playState: "running" | "paused";
    pause: () => void;
    play: () => void;
}

const anim = (): FakeAnim => {
    const a: FakeAnim = {
        currentTime: null,
        playState: "running",
        pause() {
            a.playState = "paused";
        },
        play() {
            a.playState = "running";
        },
    };
    return a;
};

/**
 * Enough document for the inlined runtime: slides that can be measured, carry
 * animations, and take a transform.
 */
function stubDom(slides: { durationMs: number; anims: FakeAnim[] }[]) {
    const elements = slides.map((s) => ({
        style: {} as Record<string, string>,
        offsetWidth: 400,
        getAttribute: (name: string) =>
            name === "data-duration" ? String(s.durationMs) : null,
        getAnimations: () => s.anims,
    }));
    const carousel = { style: {} as Record<string, string> };

    const listeners: Record<string, ((e: any) => void)[]> = {};
    const frames: (() => void)[] = [];
    const sent: any[] = [];

    const doc: any = {
        querySelectorAll: (sel: string) => (sel === "[data-slide]" ? elements : []),
        querySelector: (sel: string) => (sel === "[data-carousel]" ? carousel : null),
        addEventListener: () => undefined,
        body: {},
        documentElement: {},
    };
    const win: any = {
        addEventListener: (name: string, fn: (e: any) => void) => {
            (listeners[name] ||= []).push(fn);
        },
        parent: null,
        ReactNativeWebView: { postMessage: (s: string) => sent.push(JSON.parse(s)) },
        performance: { now: () => 0 },
    };

    const run = (hold: boolean) => {
        win.__frameHold = hold;
        // eslint-disable-next-line no-new-func
        new Function(
            "window",
            "document",
            "requestAnimationFrame",
            "cancelAnimationFrame",
            BRIDGE_SCRIPT
        )(
            win,
            doc,
            (fn: () => void) => {
                frames.push(fn);
                return frames.length;
            },
            () => undefined
        );
    };

    return {
        run,
        elements,
        carousel,
        sent,
        /** Fire the pending rAF callbacks, as a first paint would. */
        paint: () => {
            const due = frames.splice(0, frames.length);
            due.forEach((fn) => fn());
        },
        post: (msg: object) =>
            (listeners.message ?? []).forEach((fn) => fn({ data: JSON.stringify(msg) })),
    };
}

describe("a held frame", () => {
    it("pauses every animation and pins it to zero", () => {
        const a = [anim(), anim()];
        const dom = stubDom([{ durationMs: 2000, anims: a }]);
        dom.run(true);

        expect(a.map((x) => x.playState)).toEqual(["paused", "paused"]);
        expect(a.map((x) => x.currentTime)).toEqual([0, 0]);
    });

    it("re-pins on the first paint, for animations that did not exist yet", () => {
        const late = anim();
        const dom = stubDom([{ durationMs: 2000, anims: [] as FakeAnim[] }]);
        dom.run(true);
        // The browser resolves style and the animation appears.
        (dom.elements[0] as any).getAnimations = () => [late];
        dom.paint();

        expect(late.playState).toBe("paused");
        expect(late.currentTime).toBe(0);
    });

    it("reports ready, so the transport knows it can drive the frame", () => {
        const dom = stubDom([{ durationMs: 2000, anims: [anim()] }]);
        dom.run(true);
        expect(dom.sent.map((m) => m.type)).toContain("ready");
    });
});

describe("an unheld frame", () => {
    it("leaves the design's own animations alone", () => {
        // Still designs and the MediaStage preview depend on this: pinned at
        // zero, a design that fades its type in would read as blank.
        const a = [anim()];
        const dom = stubDom([{ durationMs: 2000, anims: a }]);
        dom.run(false);
        dom.paint();

        expect(a[0].playState).toBe("running");
        expect(a[0].currentTime).toBeNull();
    });
});

describe("play, after a hold", () => {
    it("starts the animations the hold had paused", () => {
        const a = [anim()];
        const dom = stubDom([{ durationMs: 2000, anims: a }]);
        dom.run(true);
        expect(a[0].playState).toBe("paused");

        dom.post({ type: "play" });
        dom.paint();

        expect(a[0].playState).toBe("running");
    });

    it("is not undone by the first-paint re-pin", () => {
        // The re-pin is deferred by one frame. If Play lands inside that gap —
        // which is one tap on a freshly opened scene — a re-pin that ignored
        // playback would snap the scene back to its first frame.
        const a = [anim()];
        const dom = stubDom([{ durationMs: 2000, anims: a }]);
        dom.run(true);
        dom.post({ type: "play" });
        dom.paint();

        expect(a[0].playState).toBe("running");
    });
});
