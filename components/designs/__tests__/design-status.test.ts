import {
    designAspect,
    designFormatLabel,
    designStatus,
    hasBeenSeen,
    isAuthoring,
    isRendering,
    resolveDesignGate,
} from "../design-status";

const vertical = { width: 1080, height: 1920, fps: 30 };

describe("designStatus", () => {
    it("reports writing while the project is being authored", () => {
        expect(designStatus({ authorStatus: "writing" }).busy).toBe(true);
        expect(designStatus({ authorStatus: "queued" }).busy).toBe(true);
    });

    it("surfaces the author's own error rather than a generic one", () => {
        const s = designStatus({
            authorStatus: "failed",
            authorError: "index.html is missing a root composition.",
        });
        expect(s.bad).toBe(true);
        expect(s.detail).toBe("index.html is missing a root composition.");
    });

    /**
     * The case that made this a module. A design that was rendered, then
     * rewritten unsuccessfully, carries renderStatus "done" AND authorStatus
     * "failed". Ranking the render first would show "Ready" over a write the
     * user just watched fail, and they would render the OLD project believing
     * it was their new one.
     */
    it("ranks a failed rewrite above a stale successful render", () => {
        const s = designStatus({
            authorStatus: "failed",
            authorError: "The model returned no files.",
            renderStatus: "done",
            renderUrl: "https://cdn.example/old.mp4",
        });
        expect(s.text).toBe("Writing failed");
        expect(s.bad).toBe(true);
    });

    it("ranks writing above rendering, since a design being written has nothing to render", () => {
        const s = designStatus({ authorStatus: "writing", renderStatus: "rendering" });
        expect(s.text).toBe("Writing…");
    });

    // The backend writes a refused film again rather than handing the user an
    // error. Two identical "Writing…" lines in a row read as a stall, and then
    // a version the user never asked for appears.
    it("says a rewrite is a fix, not a slow first pass", () => {
        const first = designStatus({ authorStatus: "writing", authorAttempt: 1 });
        expect(first.text).toBe("Writing…");

        const rewrite = designStatus({ authorStatus: "writing", authorAttempt: 2 });
        expect(rewrite.text).toBe("Fixing…");
        expect(rewrite.busy).toBe(true);
        // Being fixed is not being broken: a red row would have the user
        // abandon a design that is on its way to working.
        expect(rewrite.bad).toBe(false);
    });

    // Every design written before the rewrite existed has no attempt at all.
    it("reads a missing attempt as the first pass", () => {
        expect(designStatus({ authorStatus: "writing" }).text).toBe("Writing…");
        expect(designStatus({ authorStatus: "queued", authorAttempt: 3 }).text).toBe("Fixing…");
    });

    it("distinguishes an empty design from a written, unrendered one", () => {
        expect(designStatus({}).text).toBe("Empty");
        expect(designStatus({ projectPrefix: "design-projects/b/d" }).text).toBe("Not rendered");
    });

    it("says nothing at all for a design that has not loaded", () => {
        expect(designStatus(null).text).toBe("");
        expect(designStatus(undefined).busy).toBe(false);
    });

    it("falls back to a sentence when a failure carries no reason", () => {
        expect(designStatus({ renderStatus: "failed" }).detail).toBe("The render failed.");
    });
});

describe("isAuthoring / isRendering", () => {
    it("treat queued as in flight, because the user is already waiting", () => {
        expect(isAuthoring({ authorStatus: "queued" })).toBe(true);
        expect(isRendering({ renderStatus: "queued" })).toBe(true);
    });

    it("treat done and failed as settled", () => {
        expect(isAuthoring({ authorStatus: "done" })).toBe(false);
        expect(isRendering({ renderStatus: "failed" })).toBe(false);
    });

    it("tolerate a missing design", () => {
        expect(isAuthoring(null)).toBe(false);
        expect(isRendering(undefined)).toBe(false);
    });
});

describe("designFormatLabel", () => {
    it("includes the duration once it is known", () => {
        expect(designFormatLabel({ format: vertical, durationMs: 10000 })).toBe("10s · 1080×1920");
    });

    it("omits the duration before the project has been written", () => {
        expect(designFormatLabel({ format: vertical })).toBe("1080×1920");
    });

    it("says nothing when the canvas is unknown", () => {
        expect(designFormatLabel({})).toBe("");
        expect(designFormatLabel(null)).toBe("");
    });
});

describe("designAspect", () => {
    it("defaults to vertical video rather than zero, which would collapse the stage", () => {
        expect(designAspect(null)).toBeCloseTo(9 / 16);
        expect(designAspect({ format: { width: 0, height: 0, fps: 30 } })).toBeCloseTo(9 / 16);
    });

    it("uses the real canvas when it has one", () => {
        expect(designAspect({ format: { width: 1920, height: 1080, fps: 30 } })).toBeCloseTo(16 / 9);
    });
});

describe("resolveDesignGate", () => {
    it("pre-empts a press when the wallet is already empty", () => {
        expect(resolveDesignGate(null, "exhausted")).toBe("tokens_exhausted");
    });

    it("lets a healthy wallet through", () => {
        expect(resolveDesignGate(null, "healthy")).toBeNull();
        expect(resolveDesignGate(null, "low")).toBeNull();
        expect(resolveDesignGate(null, "critical")).toBeNull();
    });

    /**
     * The backend knows things the wallet read does not: a plan that never
     * allowed rendering reports a reason while the wallet looks fine. Reading
     * only the wallet would show a working button that always 402s.
     */
    it("takes the backend's reason over a healthy local wallet", () => {
        expect(resolveDesignGate("plan_locked", "healthy")).toBe("plan_locked");
        expect(resolveDesignGate("some_future_reason", "healthy")).toBe("plan_locked");
    });

    it("keeps tokens_exhausted distinct, since a top-up fixes it and an upgrade need not", () => {
        expect(resolveDesignGate("tokens_exhausted", "healthy")).toBe("tokens_exhausted");
    });
});

describe("preview state", () => {
    const written = { projectPrefix: "design-projects/b/d" };

    it("reports previewing while frames are being captured", () => {
        expect(designStatus({ ...written, previewStatus: "running" }).busy).toBe(true);
        expect(designStatus({ ...written, previewStatus: "queued" }).busy).toBe(true);
    });

    it("surfaces the preview's own error", () => {
        const s = designStatus({ ...written, previewStatus: "failed", previewError: "No root composition." });
        expect(s.bad).toBe(true);
        expect(s.detail).toBe("No root composition.");
    });

    /**
     * Preview ranks BELOW the render, unlike authoring. A design that has
     * already rendered does not become more interesting for having a
     * filmstrip, and showing "Previewed" over a finished film would read as
     * a step backwards.
     */
    it("a finished render outranks a finished preview", () => {
        const s = designStatus({
            ...written,
            previewStatus: "done",
            previewFrames: [{ url: "a.png", timeMs: 0 }],
            renderStatus: "done",
            renderUrl: "https://cdn/x.mp4",
        });
        expect(s.text).toBe("Ready");
    });

    it("but it outranks written-but-unrendered, which is what the user is waiting on", () => {
        expect(designStatus({ ...written, previewStatus: "running" }).text).toBe("Previewing…");
        expect(
            designStatus({ ...written, previewFrames: [{ url: "a.png", timeMs: 0 }] }).text
        ).toBe("Previewed");
    });

    it("a failed write still outranks everything, since there is nothing to preview", () => {
        const s = designStatus({
            ...written,
            authorStatus: "failed",
            authorError: "The model returned no files.",
            previewFrames: [{ url: "a.png", timeMs: 0 }],
        });
        expect(s.text).toBe("Writing failed");
    });
});

describe("hasBeenSeen", () => {
    /**
     * The question Phase 3 exists to answer: approving something you have not
     * looked at is not approval, so the Render button leads with the preview
     * until this is true.
     */
    it("is false for a written design nobody has looked at", () => {
        expect(hasBeenSeen({ projectPrefix: "p" })).toBe(false);
        expect(hasBeenSeen({ projectPrefix: "p", previewFrames: [] })).toBe(false);
    });

    it("is true once there are frames", () => {
        expect(hasBeenSeen({ projectPrefix: "p", previewFrames: [{ url: "a.png", timeMs: 0 }] })).toBe(true);
    });

    // A rendered film on screen is a better look than any filmstrip, so a
    // re-render is not forced back through the preview.
    it("is true for an already-rendered design, filmstrip or not", () => {
        expect(hasBeenSeen({ projectPrefix: "p", renderUrl: "https://cdn/x.mp4" })).toBe(true);
    });

    it("tolerates a missing design", () => {
        expect(hasBeenSeen(null)).toBe(false);
    });
});
