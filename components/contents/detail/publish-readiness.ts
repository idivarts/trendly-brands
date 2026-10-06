import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import {
    ContentFormat,
    isFormatPlatformCompatible,
} from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import { Platform, PlatformEnum } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { PlatformOptions, SocialDestination } from "@/components/contents/types";

// ─── publish-readiness ────────────────────────────────────────────────────────
// Can this content actually be published, and if not, what's missing?
//
// ⚠️ These checks MIRROR the backend's publish-time validation in
// `backend-sls/internal/trendlyapis/publishing/publish.go` (publishToInstagram,
// publishToYouTube, publishToReddit, publishToTwitter, …). The backend remains
// the real enforcement — it's the only side that sees the final content. This
// module exists because those backend errors surface *asynchronously*: the
// publish is queued, the worker fails minutes later, and the user learns about
// it from a `partially_failed` status long after they could have fixed it.
//
// Keep the two in sync. If you add a requirement to a publishTo* function,
// add the matching rule here (and vice versa).
//
// Two tiers, because they're knowable at different moments:
//
//   • CONTENT tier — depends only on the content + its format. Knowable before
//     the publish modal opens, so it GATES the modal: the user is sent back to
//     the field that needs filling.
//
//   • DESTINATION tier — depends on which accounts were picked, so it's only
//     knowable inside the modal. It does NOT gate publishing; it disables the
//     one offending destination chip so a user publishing to three platforms
//     isn't blocked by the third.

/** Which editor section a content-tier gap belongs to — drives scroll + highlight. */
export type PublishGateSection = "media" | "caption" | "title";

/** A content-level gap that must be filled before the publish modal can open. */
export interface PublishGate {
    section: PublishGateSection;
    /** Shown in the toast. Imperative, names the fix — not the failure. */
    message: string;
}

/** A per-destination gap. The chip is disabled and shows `reason` inline. */
export interface DestinationBlock {
    socialAccountId: string;
    platform: Platform;
    /** Terse, fits under a chip. e.g. "Needs a subreddit". */
    reason: string;
}

const hasImage = (atts: Attachment[]) => atts.some((a) => !!a.imageUrl);
const imageCount = (atts: Attachment[]) => atts.filter((a) => !!a.imageUrl).length;
const hasVideo = (atts: Attachment[]) => atts.some((a) => !!a.playUrl || !!a.appleUrl);

const platformLabel = (p: Platform) => SOCIAL_PLATFORM_MAP[p]?.label ?? p;

export interface PublishReadinessInput {
    contentFormat: ContentFormat;
    attachments: Attachment[];
    caption: string;
    title: string;
    hashtags: string;
}

/**
 * Content-tier gaps, in the order the user should fix them (which is also the
 * order the sections appear on the page, so the scroll-to always moves down).
 *
 * Mirrors the format→media requirements the backend enforces per platform. We
 * check them against the content's FORMAT rather than per-destination because
 * the format is what the user chose up front, and every platform that supports
 * a given format needs the same media for it.
 */
export function contentPublishGates({
    contentFormat,
    attachments,
    caption,
    hashtags,
}: PublishReadinessInput): PublishGate[] {
    const gates: PublishGate[] = [];
    const atts = attachments ?? [];

    switch (contentFormat) {
        case "post":
            // publishToInstagram default branch: "post has no image attachment".
            if (!hasImage(atts)) {
                gates.push({ section: "media", message: "Add an image before publishing." });
            }
            break;
        case "story":
            // publishToInstagram "story": "story has no image attachment".
            if (!hasImage(atts)) {
                gates.push({ section: "media", message: "A story needs an image." });
            }
            break;
        case "carousel": {
            // publishToInstagram "carousel": "carousel needs at least 2 images".
            const n = imageCount(atts);
            if (n < 2) {
                gates.push({
                    section: "media",
                    message:
                        n === 0
                            ? "A carousel needs at least 2 images."
                            : "A carousel needs at least 2 images — add one more.",
                });
            }
            break;
        }
        case "reel":
        case "video":
            // publishToInstagram "reel"/"video" + publishToYouTube both require one.
            if (!hasVideo(atts)) {
                gates.push({
                    section: "media",
                    message: `A ${contentFormat} needs a video.`,
                });
            }
            break;
        case "text":
            // A text post is nothing but its text — buildCaption() would be empty.
            if (!caption.trim() && !hashtags.trim()) {
                gates.push({ section: "caption", message: "Write your post before publishing." });
            }
            break;
        case "live":
            // Not publishable through the API — scheduled as a reminder only.
            break;
    }

    // Every non-text format still needs *something* to say. The backend will
    // happily post a bare image, but an empty caption is almost always an
    // oversight rather than an intent, and it's unrecoverable once live.
    if (contentFormat !== "text" && !caption.trim() && !hashtags.trim()) {
        gates.push({ section: "caption", message: "Add a caption before publishing." });
    }

    return gates;
}

/**
 * Destination-tier blocks for the currently-picked accounts. Each entry means
 * "this one account can't go out yet" — not "publishing is impossible".
 */
export function destinationBlocks(
    destinations: SocialDestination[],
    platformOptions: PlatformOptions,
    input: PublishReadinessInput
): DestinationBlock[] {
    const { contentFormat, attachments, caption, title, hashtags } = input;
    const atts = attachments ?? [];
    const out: DestinationBlock[] = [];

    for (const d of destinations) {
        const block = (reason: string) =>
            out.push({ socialAccountId: d.socialAccountId, platform: d.platform, reason });

        // The format↔platform matrix is the first gate — e.g. Instagram has no
        // text-post format ("instagram does not support text-only posts").
        if (!isFormatPlatformCompatible(contentFormat, d.platform)) {
            block(`${platformLabel(d.platform)} can't post a ${contentFormat}`);
            continue;
        }

        switch (d.platform) {
            case PlatformEnum.YouTube: {
                // publishToYouTube: "youtube requires a video attachment".
                if (!hasVideo(atts)) {
                    block("Needs a video");
                    break;
                }
                // Title falls back to ct.Title, then to "Untitled" — which is a
                // bad public title, so require a real one here.
                const ytTitle = (platformOptions.youtubeTitle ?? "").trim() || title.trim();
                if (!ytTitle) block("Needs a video title");
                break;
            }
            case PlatformEnum.Reddit: {
                // publishToReddit: subreddit + title are both required.
                if (!(platformOptions.redditSubreddit ?? "").trim()) {
                    block("Needs a subreddit");
                    break;
                }
                if (!(platformOptions.redditTitle ?? "").trim()) block("Needs a post title");
                break;
            }
            case PlatformEnum.Twitter: {
                // publishToTwitter: "twitter: post has no text". A caption over
                // 280 is NOT a block — tweetSegments() auto-splits it into a
                // thread, same as utils/twitter-thread.ts does here.
                const thread = platformOptions.twitterThread ?? [];
                const hasThread = thread.some((t) => t.trim());
                if (!hasThread && !caption.trim() && !hashtags.trim()) block("Needs text");
                break;
            }
            default:
                break;
        }
    }

    return out;
}

/** Fast lookup for the modal: socialAccountId → reason it can't publish. */
export function destinationBlockMap(
    destinations: SocialDestination[],
    platformOptions: PlatformOptions,
    input: PublishReadinessInput
): Map<string, string> {
    const m = new Map<string, string>();
    for (const b of destinationBlocks(destinations, platformOptions, input)) {
        m.set(b.socialAccountId, b.reason);
    }
    return m;
}
