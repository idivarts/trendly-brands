import { REDDIT_ENABLED } from "@/constants/features";
import { ISocialAccount } from "@/contexts/brand-social-context.provider";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faFacebook,
    faInstagram,
    faLinkedin,
    faReddit,
    faXTwitter,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";

export type SocialPlatform = ISocialAccount["platform"];

/** Color key into Colors(theme) holding the platform's brand color. */
type SocialColorKey =
    | "socialInstagram"
    | "socialFacebook"
    | "socialYoutube"
    | "socialLinkedin"
    | "socialTwitter"
    | "socialReddit";

export interface SocialPlatformMeta {
    key: SocialPlatform;
    label: string;
    icon: IconProp;
    /** Resolve via Colors(theme)[colorKey] — never hardcode the hex. */
    colorKey: SocialColorKey;
    /** Short, human-readable reason to connect this platform. */
    blurb: string;
}

/**
 * Single source of truth for the social platforms a brand can connect.
 * Mirrors the platforms supported by trendly-connect (lib/platforms.ts) and the
 * backend SocialAccount struct. The connect flow itself lives at
 * connect.trendly.now; tapping a tile deep-links straight into that platform.
 */
const ALL_SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
    {
        key: "instagram",
        label: "Instagram",
        icon: faInstagram,
        colorKey: "socialInstagram",
        blurb: "Profile, followers & post insights",
    },
    {
        key: "facebook",
        label: "Facebook",
        icon: faFacebook,
        colorKey: "socialFacebook",
        blurb: "Page metrics & linked accounts",
    },
    {
        key: "youtube",
        label: "YouTube",
        icon: faYoutube,
        colorKey: "socialYoutube",
        blurb: "Subscribers & video analytics",
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        icon: faLinkedin,
        colorKey: "socialLinkedin",
        // Personal profile — posting only (no DMs/analytics via API).
        blurb: "Personal profile & posting",
    },
    {
        key: "linkedin_page",
        label: "LinkedIn Page",
        icon: faLinkedin,
        colorKey: "socialLinkedin",
        // Company/Showcase Page via the Community Management API.
        blurb: "Company Page: post, comments & insights",
    },
    {
        key: "twitter",
        label: "X / Twitter",
        icon: faXTwitter,
        colorKey: "socialTwitter",
        blurb: "Post, reply, DMs & tweet insights",
    },
    {
        key: "reddit",
        label: "Reddit",
        icon: faReddit,
        colorKey: "socialReddit",
        blurb: "Post & engage on subreddits",
    },
];

/**
 * The platforms a brand can connect, gated by feature flags. Reddit is hidden
 * until REDDIT_ENABLED is turned on (see constants/features.ts). The MAP below is
 * built from the FULL list so display lookups (icon/label/color) still resolve
 * for any account that somehow exists.
 */
export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = ALL_SOCIAL_PLATFORMS.filter(
    (p) => p.key !== "reddit" || REDDIT_ENABLED
);

export const SOCIAL_PLATFORM_MAP: Record<SocialPlatform, SocialPlatformMeta> =
    ALL_SOCIAL_PLATFORMS.reduce(
        (acc, meta) => {
            acc[meta.key] = meta;
            return acc;
        },
        {} as Record<SocialPlatform, SocialPlatformMeta>
    );
