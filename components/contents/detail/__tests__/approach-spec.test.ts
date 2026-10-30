import {
    APPROACHES,
    approachesFor,
    defaultApproachFor,
    defaultSettings,
    settingsFor,
} from "../composer/approach-spec";
import { ContentType } from "@/components/content-calendar/types";

describe("approachesFor", () => {
    it("offers the image approaches for image types", () => {
        expect(approachesFor("post").map((a) => a.id)).toEqual([
            "graphic",
            "photoreal",
            "stock",
        ]);
        expect(approachesFor("carousel").map((a) => a.id)).toEqual([
            "graphic",
            "photoreal",
            "stock",
        ]);
    });

    it("offers the video approaches for video types", () => {
        expect(approachesFor("reel").map((a) => a.id)).toEqual([
            "motion",
            "genvideo",
            "footage",
        ]);
        expect(approachesFor("video").map((a) => a.id)).toEqual([
            "motion",
            "genvideo",
            "footage",
        ]);
    });

    it("offers nothing for the types with no media area", () => {
        expect(approachesFor("live")).toEqual([]);
        expect(approachesFor("text")).toEqual([]);
    });

    it("has every video approach live", () => {
        // Nothing on a video type is behind a coming-soon panel any more:
        // motion graphics, generated video and footage editing all ship. The
        // one thing that can still stop AI video is the model registry having
        // nothing enabled for the workspace, which the composer reports itself
        // — it is not a property of the approach.
        expect(approachesFor("reel").filter((a) => a.comingSoon)).toEqual([]);
        expect(approachesFor("video").filter((a) => a.comingSoon)).toEqual([]);
    });
});

describe("defaultApproachFor", () => {
    it("never opens on an approach that cannot be submitted", () => {
        for (const type of ["post", "carousel", "story", "reel", "video"] as const) {
            const id = defaultApproachFor(type);
            expect(id).toBeTruthy();
            expect(APPROACHES[id!].comingSoon).toBeUndefined();
        }
    });

    it("is null where there is no media to make", () => {
        expect(defaultApproachFor("live")).toBeNull();
        expect(defaultApproachFor("text")).toBeNull();
    });
});

describe("settingsFor", () => {
    // A control with one option is worse than no control: it implies a decision
    // that does not exist. The approach says what it could offer; the content
    // type says what is actually a choice.
    it("hides slides for anything that is not a carousel", () => {
        expect(settingsFor(APPROACHES.graphic, "post")).not.toContain("slides");
        expect(settingsFor(APPROACHES.graphic, "carousel")).toContain("slides");
    });

    it("hides aspect where the content type allows only one ratio", () => {
        // A reel is always 9:16; a post may be 1:1 or 4:5.
        expect(settingsFor(APPROACHES.photoreal, "story")).not.toContain("aspect");
        expect(settingsFor(APPROACHES.photoreal, "post")).toContain("aspect");
    });

    it("keeps the settings that always apply", () => {
        expect(settingsFor(APPROACHES.motion, "reel")).toEqual([
            "scenes",
            "length",
            "music",
        ]);
    });
});

describe("defaultSettings", () => {
    it("fills the content type's own answers in", () => {
        const s = defaultSettings(APPROACHES.graphic, "carousel");
        expect(s.aspect).toBe("1:1");
        expect(s.slides).toBe("4");
    });

    it("leaves out what the content type does not ask", () => {
        const s = defaultSettings(APPROACHES.graphic, "story");
        expect(s.aspect).toBeUndefined();
        expect(s.slides).toBeUndefined();
    });

    it("keeps the approach's own defaults", () => {
        expect(defaultSettings(APPROACHES.motion, "reel")).toMatchObject({
            scenes: "3",
            length: "10s",
            music: "Auto",
        });
    });

    it("gives every visible setting a value, so the strip is never blank", () => {
        for (const type of ["post", "carousel", "story", "reel", "video"] as const) {
            for (const approach of approachesFor(type)) {
                const values = defaultSettings(approach, type);
                for (const key of settingsFor(approach, type)) {
                    expect(values[key]).toBeDefined();
                }
            }
        }
    });
});

describe("which approaches are live", () => {
    // Stock photography shipped in Phase 4 and its placeholder resolution in
    // 4b, but the tab stayed behind a coming-soon panel because nothing
    // removed the flag — the feature was built and unreachable. This test is
    // the tripwire for that happening again.
    it("has the stock approach live, not coming soon", () => {
        expect(APPROACHES.stock.comingSoon).toBeUndefined();
        expect(APPROACHES.stock.briefLead).toMatch(/stock/i);
    });

    it("has generated video and footage editing live", () => {
        // Both ship: genvideo queues a clip on the timeline through the
        // generate endpoint, footage places the upload and hands the cut to
        // the AI's cut_footage tool. Neither goes through a design brief.
        expect(APPROACHES.genvideo.comingSoon).toBeUndefined();
        expect(APPROACHES.footage.comingSoon).toBeUndefined();
    });

    it("gives every live approach something to start from", () => {
        // An empty prompt box with no starters is where the coming-soon panel
        // used to be. A live approach has to suggest what to type.
        for (const approach of Object.values(APPROACHES)) {
            if (approach.comingSoon) continue;
            expect(approach.starters.length).toBeGreaterThan(0);
        }
    });

    it("offers a live image approach for every image content type", () => {
        for (const type of ["post", "carousel", "story"] as ContentType[]) {
            const live = approachesFor(type).filter((a) => !a.comingSoon);
            expect(live.length).toBeGreaterThan(0);
        }
    });
});
