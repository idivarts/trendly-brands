import type { FollowerBucket } from "@/shared-constants/analytics-events";

/**
 * Bucket a follower count for analytics.
 *
 * Bucketed rather than reported raw: the exact number is the brand's own data
 * and tells us nothing the bucket does not, while the bucket answers the
 * question worth asking of a new connection — whether real brands are
 * connecting accounts, or whether what we are counting is empty test
 * profiles.
 *
 * Returns undefined for a missing count so it is distinguishable from a
 * genuine zero-follower account, which is itself a meaningful bucket.
 */
export const followerBucket = (count?: number): FollowerBucket | undefined => {
    if (typeof count !== "number" || Number.isNaN(count)) return undefined;
    if (count <= 0) return "0";
    if (count < 1_000) return "1-1k";
    if (count < 10_000) return "1k-10k";
    if (count < 100_000) return "10k-100k";
    return "100k+";
};
