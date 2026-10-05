/**
 * The media lane model is what makes the Media Stage's three creation surfaces
 * mutually exclusive, so these cases pin down the rules that the UI relies on:
 * a lane always needs evidence, a design pointer outranks attachments, and
 * legacy contents (no `source`) still resolve.
 */
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { IContentDesignRef } from "@/shared-libs/firestore/trendly-pro/models/design";
import { clearLabelFor, lanesFor, resolveMediaLane } from "../media-lane";
import { previewAspect } from "../media-spec";

const image: Attachment = { type: "image", imageUrl: "https://example.test/a.png" };
const video: Attachment = { type: "video", playUrl: "https://example.test/a.mp4" };

const designRef: IContentDesignRef = {
    revisionId: "rev1",
    docType: "image",
    width: 1080,
    height: 1350,
    slideCount: 1,
    updatedAt: 0,
};

describe("resolveMediaLane", () => {
    it("has no lane when there is no media at all", () => {
        expect(resolveMediaLane({ attachments: [] })).toBeNull();
    });

    it("ignores a stale source when no media backs it", () => {
        // A content that was cleared can keep a source value in flight; without
        // evidence it must still read as empty, or the chooser never comes back.
        expect(resolveMediaLane({ attachments: [], source: "ai-image" })).toBeNull();
        expect(resolveMediaLane({ attachments: [], source: "upload" })).toBeNull();
    });

    it("is the design lane as soon as a design pointer exists, before any render", () => {
        // The state the Media Stage used to render as "no media".
        expect(resolveMediaLane({ designRef, attachments: [] })).toBe("design");
    });

    it("keeps the design lane once the design has been rendered", () => {
        // The render IS the attachment, so the design must still win — otherwise
        // a rendered design would read as an upload and lose its Edit path.
        expect(resolveMediaLane({ designRef, attachments: [image], source: "ai" })).toBe("design");
    });

    it("separates a generated image from an uploaded one", () => {
        // Both are a plain image attachment with no designRef — only `source`
        // tells them apart, which is why it has to be stamped.
        expect(resolveMediaLane({ attachments: [image], source: "ai-image" })).toBe("generate");
        expect(resolveMediaLane({ attachments: [image], source: "upload" })).toBe("upload");
    });

    it("treats a legacy content with no source as an upload", () => {
        expect(resolveMediaLane({ attachments: [video] })).toBe("upload");
    });
});

describe("lanesFor", () => {
    it("offers photoreal generation only for image types", () => {
        expect(lanesFor("post")).toEqual(["design", "generate", "upload"]);
        expect(lanesFor("carousel")).toEqual(["design", "generate", "upload"]);
        expect(lanesFor("story")).toEqual(["design", "generate", "upload"]);
    });

    it("offers design and upload for video types — there is no video generation", () => {
        expect(lanesFor("reel")).toEqual(["design", "upload"]);
        expect(lanesFor("video")).toEqual(["design", "upload"]);
    });

    it("offers nothing for the types that have no media area", () => {
        expect(lanesFor("live")).toEqual([]);
        expect(lanesFor("text")).toEqual([]);
    });
});

describe("clearLabelFor", () => {
    it("names the thing being cleared, per lane and content type", () => {
        expect(clearLabelFor("design", "reel")).toBe("Clear canvas");
        expect(clearLabelFor("upload", "reel")).toBe("Remove video");
        expect(clearLabelFor("upload", "post")).toBe("Remove image");
        expect(clearLabelFor("upload", "carousel")).toBe("Remove all slides");
        expect(clearLabelFor("generate", "post")).toBe("Discard generated image");
        expect(clearLabelFor("generate", "carousel")).toBe("Discard generated slides");
    });
});

describe("previewAspect", () => {
    it("is portrait for the 9:16 formats", () => {
        // The bug this fixes: a reel previewed in a landscape box.
        expect(previewAspect("reel")).toBeCloseTo(9 / 16);
        expect(previewAspect("story")).toBeCloseTo(9 / 16);
    });

    it("is landscape for long-form video", () => {
        expect(previewAspect("video")).toBeCloseTo(16 / 9);
    });

    it("is square for feed images, using the canonical ratio", () => {
        expect(previewAspect("post")).toBe(1);
        expect(previewAspect("carousel")).toBe(1);
    });

    it("falls back to square for the types with no ratio", () => {
        expect(previewAspect("text")).toBe(1);
        expect(previewAspect("live")).toBe(1);
    });
});
