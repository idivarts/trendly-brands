/**
 * The inspector's tab logic.
 *
 * This app has jest but no react-native renderer, so the panel itself cannot be
 * rendered in a test. Everything here was therefore deliberately pulled OUT of
 * the panel — not for tidiness, but because logic inside it is logic nothing
 * can check, and "which tab can I be on" is exactly the kind of rule that is
 * quietly wrong in one branch for months.
 */
import { IStudioScene } from "@/shared-libs/firestore/trendly-pro/models/studio";
import { WORKER_CEILING_MS } from "../scene-progress";
import {
    INSPECTOR_TABS,
    InspectorTab,
    resolveTab,
    tabAvailable,
    tabFlag,
} from "../inspector-tabs";

const scene = (over: Partial<IStudioScene> = {}): IStudioScene =>
    ({
        id: "s1",
        durationMs: 4000,
        primaryKind: "motion",
        layers: [{ id: "l1", kind: "html", slot: "full" }],
        ...over,
    }) as IStudioScene;

describe("the split itself", () => {
    it("has exactly one document-scoped tab", () => {
        // The whole point of the rework. If a second one appears, or this one
        // is re-scoped to the scene, the panel is back to mixing "this shot"
        // with "the whole film" and the user cannot tell which they changed.
        const doc = INSPECTOR_TABS.filter((t) => t.scope === "document");
        expect(doc.map((t) => t.key)).toEqual(["video"]);
    });

    it("gives every tab a distinct key and label", () => {
        expect(new Set(INSPECTOR_TABS.map((t) => t.key)).size).toBe(INSPECTOR_TABS.length);
        expect(new Set(INSPECTOR_TABS.map((t) => t.label)).size).toBe(INSPECTOR_TABS.length);
    });
});

describe("tabAvailable", () => {
    it("opens every tab once a scene is selected", () => {
        for (const t of INSPECTOR_TABS) expect(tabAvailable(t.key, scene())).toBe(true);
    });

    it("keeps the document tab reachable with nothing selected", () => {
        // The voice and the music bed belong to the video. Hiding them because
        // no scene happens to be selected was a bug of its own.
        expect(tabAvailable("video", null)).toBe(true);
    });

    it("closes the scene tabs with nothing selected", () => {
        for (const key of ["scene", "create", "narration"] as InspectorTab[]) {
            expect(tabAvailable(key, null)).toBe(false);
        }
    });
});

describe("resolveTab", () => {
    it("keeps the user's choice across a selection change", () => {
        // Comparing scene 3's narration with scene 4's is a real thing people
        // do; being thrown back to the first tab on every click would make it
        // impossible.
        expect(resolveTab("narration", scene({ id: "s9" }))).toBe("narration");
    });

    it("falls back to the document tab when the selection goes away", () => {
        expect(resolveTab("narration", null)).toBe("video");
        expect(resolveTab("scene", null)).toBe("video");
    });

    it("leaves the document tab alone either way", () => {
        expect(resolveTab("video", null)).toBe("video");
        expect(resolveTab("video", scene())).toBe("video");
    });
});

describe("tabFlag", () => {
    it("marks nothing at all on an ordinary scene", () => {
        // A strip where every tab is dotted marks nothing.
        for (const t of INSPECTOR_TABS) expect(tabFlag(t.key, scene())).toBe("none");
    });

    it("alerts on Create when the last generation failed", () => {
        expect(tabFlag("create", scene({ gen: { status: "failed" } as any }))).toBe("alert");
    });

    it("only whispers on Create while a job is actually running", () => {
        expect(
            tabFlag("create", scene({ pending: true, gen: { status: "queued", queuedAt: Date.now() } as any }))
        ).toBe("quiet");
    });

    it("alerts on Scene when the scene is empty and nothing is making it", () => {
        expect(tabFlag("scene", scene({ layers: [], primaryKind: "empty" }))).toBe("alert");
    });

    it("also alerts on Create for an empty scene", () => {
        // The way forward for an empty scene lives in Create (pick a lane, give
        // a prompt). Marking only Scene would point at the tab whose sole offer
        // is picking a file by hand.
        expect(tabFlag("create", scene({ layers: [], primaryKind: "empty" }))).toBe("alert");
    });

    it("prefers the failure over the emptiness on Create", () => {
        // Both are true after a generation that failed before writing a layer.
        // "alert" either way, but via the branch that has an error to show.
        expect(
            tabFlag("create", scene({ layers: [], primaryKind: "empty", gen: { status: "failed" } as any }))
        ).toBe("alert");
    });

    it("does NOT alert on an empty scene a worker is on", () => {
        // Still empty, but not the user's problem yet.
        expect(
            tabFlag(
                "scene",
                scene({
                    layers: [],
                    primaryKind: "empty",
                    pending: true,
                    gen: { status: "queued", queuedAt: Date.now() } as any,
                })
            )
        ).toBe("none");
    });

    it("DOES alert on an empty scene whose job was abandoned", () => {
        // The stranded case: queued long enough ago that the worker is gone.
        // This is the state six of the user's scenes sat in for an hour.
        const old = Date.now() - WORKER_CEILING_MS - 1000;
        expect(
            tabFlag(
                "scene",
                scene({
                    layers: [],
                    primaryKind: "empty",
                    pending: true,
                    gen: { status: "queued", queuedAt: old } as any,
                })
            )
        ).toBe("alert");
    });

    it("whispers on Narration only when there is a line", () => {
        expect(tabFlag("narration", scene({ narration: { line: "Here we go" } as any }))).toBe("quiet");
        expect(tabFlag("narration", scene({ narration: { line: "   " } as any }))).toBe("none");
        expect(tabFlag("narration", scene())).toBe("none");
    });

    it("says nothing anywhere with no scene selected", () => {
        for (const t of INSPECTOR_TABS) expect(tabFlag(t.key, null)).toBe("none");
    });
});
