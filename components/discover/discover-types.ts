import type { SocialsBrief } from "@/shared-libs/firestore/trendly-pro/models/bq-socials";

export type InfluencerItem = SocialsBrief & {
    // For invitation card
    invitedAt?: number; // timestamp in milliseconds
    status?: string;
};

export type InfluencerInviteUnit = InfluencerItem & {
    invitedAt: number;
    status: string;
};

export type DB_TYPE = "" | "trendly" | "phyllo" | "modash";
