import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { contentPublishGates, destinationBlockMap } from "../publish-readiness";

const img: Attachment = { type: "image", imageUrl: "https://x/a.jpg" };
const vid: Attachment = { type: "video", playUrl: "https://x/a.mp4" };
const base = { caption: "Hello", title: "T", hashtags: "", attachments: [] as Attachment[] };

describe("contentPublishGates", () => {
    it("requires an image for a post", () => {
        const g = contentPublishGates({ ...base, contentFormat: "post" });
        expect(g.map((x) => x.section)).toContain("media");
        expect(contentPublishGates({ ...base, contentFormat: "post", attachments: [img] })).toEqual([]);
    });

    it("requires 2+ images for a carousel", () => {
        expect(contentPublishGates({ ...base, contentFormat: "carousel", attachments: [img] })[0].message)
            .toMatch(/add one more/i);
        expect(
            contentPublishGates({ ...base, contentFormat: "carousel", attachments: [img, img] })
        ).toEqual([]);
    });

    it("requires a video for reel and video", () => {
        (["reel", "video"] as const).forEach((f) => {
            expect(contentPublishGates({ ...base, contentFormat: f, attachments: [img] })).toHaveLength(1);
            expect(contentPublishGates({ ...base, contentFormat: f, attachments: [vid] })).toEqual([]);
        });
    });

    it("requires text for a text post, and a caption for everything else", () => {
        expect(contentPublishGates({ ...base, caption: "", contentFormat: "text" })[0].section).toBe("caption");
        expect(contentPublishGates({ ...base, caption: "", contentFormat: "post", attachments: [img] })[0].section)
            .toBe("caption");
        // Hashtags alone satisfy it — buildCaption() joins both.
        expect(
            contentPublishGates({ ...base, caption: "", hashtags: "#hi", contentFormat: "text" })
        ).toEqual([]);
    });

    it("does not gate a live content", () => {
        expect(contentPublishGates({ ...base, contentFormat: "live" })).toEqual([]);
    });
});

describe("destinationBlockMap", () => {
    const dest = (platform: any, id = platform) => ({ socialAccountId: id, platform });

    it("blocks YouTube without a video or title", () => {
        const noVid = destinationBlockMap([dest("youtube")], {}, { ...base, contentFormat: "video" });
        expect(noVid.get("youtube")).toMatch(/video/i);
        const noTitle = destinationBlockMap(
            [dest("youtube")], {},
            { ...base, title: "", contentFormat: "video", attachments: [vid] }
        );
        expect(noTitle.get("youtube")).toMatch(/title/i);
        // Title from platformOptions satisfies it.
        expect(
            destinationBlockMap(
                [dest("youtube")], { youtubeTitle: "My video" },
                { ...base, title: "", contentFormat: "video", attachments: [vid] }
            ).size
        ).toBe(0);
    });

    it("blocks Reddit without a subreddit, then without a title", () => {
        const i = { ...base, contentFormat: "text" as const };
        expect(destinationBlockMap([dest("reddit")], {}, i).get("reddit")).toMatch(/subreddit/i);
        expect(
            destinationBlockMap([dest("reddit")], { redditSubreddit: "startups" }, i).get("reddit")
        ).toMatch(/title/i);
        expect(
            destinationBlockMap(
                [dest("reddit")], { redditSubreddit: "startups", redditTitle: "Hi" }, i
            ).size
        ).toBe(0);
    });

    it("blocks an incompatible format/platform pair", () => {
        // Instagram has no text-post format.
        expect(
            destinationBlockMap([dest("instagram")], {}, { ...base, contentFormat: "text" }).get("instagram")
        ).toMatch(/can't post/i);
    });

    it("does NOT block X for a long caption (it auto-threads)", () => {
        expect(
            destinationBlockMap(
                [dest("twitter")], {},
                { ...base, caption: "x".repeat(900), contentFormat: "text" }
            ).size
        ).toBe(0);
    });

    it("blocks only the offending destination, leaving the rest publishable", () => {
        const m = destinationBlockMap(
            [dest("instagram"), dest("twitter"), dest("reddit")], {},
            { ...base, contentFormat: "post", attachments: [img] }
        );
        expect(m.has("reddit")).toBe(true);
        expect(m.has("instagram")).toBe(false);
        expect(m.has("twitter")).toBe(false);
    });
});
