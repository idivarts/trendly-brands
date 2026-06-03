import { ISocialAccount } from "@/contexts/brand-social-context.provider";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faFacebook,
    faInstagram,
    faLinkedin,
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
    | "socialTwitter";

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
export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
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
        blurb: "Professional reach & engagement",
    },
    {
        key: "twitter",
        label: "X / Twitter",
        icon: faXTwitter,
        colorKey: "socialTwitter",
        blurb: "Followers & tweet performance",
    },
];

export const SOCIAL_PLATFORM_MAP: Record<SocialPlatform, SocialPlatformMeta> =
    SOCIAL_PLATFORMS.reduce(
        (acc, meta) => {
            acc[meta.key] = meta;
            return acc;
        },
        {} as Record<SocialPlatform, SocialPlatformMeta>
    );
