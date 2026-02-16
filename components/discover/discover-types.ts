import type { SocialsBrief } from "@/shared-libs/firestore/trendly-pro/models/bq-socials";

export type InfluencerItem = SocialsBrief & {
    // For invitation card
    invitedAt?: number; // timestamp in milliseconds
    status?: string;
    quality?: number; // Quality score (0-100)
    quality_score?: number; // Alternative property name for quality
};

export type InfluencerInviteUnit = InfluencerItem & {
    invitedAt: number;
    status: string;
};

export type DB_TYPE = "" | "trendly" | "phyllo" | "modash";
