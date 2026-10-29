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

    it("reads a legacy generated image as an upload", () => {
        // Photoreal generation now writes a design document, so a NEW generated
        // image arrives with a designRef and resolves as "design". Content from
        // the old path kept a bare attachment and nothing to restore it from —
        // it stays previewable and publishable, just not editable.
        expect(resolveMediaLane({ attachments: [image], source: "ai-image" })).toBe("upload");
        expect(resolveMediaLane({ attachments: [image], source: "upload" })).toBe("upload");
    });

    it("ignores `source` entirely — the lane comes from the data", () => {
        // A stale or wrong source must never be able to claim a lane.
        expect(resolveMediaLane({ attachments: [], source: "ai-image" })).toBeNull();
        expect(resolveMediaLane({ designRef, attachments: [], source: "upload" })).toBe("design");
    });

    it("treats a legacy content with no source as an upload", () => {
        expect(resolveMediaLane({ attachments: [video] })).toBe("upload");
    });
});

describe("lanesFor", () => {
    // Photoreal generation used to be a lane of its own, offered only for image
    // types. It is now an approach inside "Design with AI", which is what makes
    // "a generated photo with a headline on it" expressible at all — so the
    // chooser offers the same two lanes whatever the media kind.
    it("offers the same two lanes for image types", () => {
        expect(lanesFor("post")).toEqual(["design", "upload"]);
        expect(lanesFor("carousel")).toEqual(["design", "upload"]);
        expect(lanesFor("story")).toEqual(["design", "upload"]);
    });

    it("offers the same two lanes for video types", () => {
        expect(lanesFor("reel")).toEqual(["design", "upload"]);
        expect(lanesFor("video")).toEqual(["design", "upload"]);
    });

    it("never offers generate — it is an approach now, not a lane", () => {
        const every = (["post", "carousel", "story", "reel", "video"] as const).flatMap(lanesFor);
        expect(every).not.toContain("generate");
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
