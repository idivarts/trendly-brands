/**
 * Per-post basic analytics — the shape returned by
 * GET /api/v2/brands/:brandId/analytics/media/:mediaId?socialId=&channel=
 * (backend: internal/trendlyapis/analytics/media.go → PostAnalytics).
 */

export interface IPostMetric {
    key: string; // "likes" | "comments" | "reach" | "views" | "saves" | "shares" | "engagement"
    label: string;
    value: number;
    available: boolean; // false when the platform/scope doesn't expose this metric
}

export interface IPostAnalytics {
    mediaId: string;
    channel: "instagram" | "facebook" | string;
    mediaType?: string;
    caption?: string;
    permalink?: string;
    thumbnailUrl?: string;
    timestamp?: number; // Unix seconds
    metrics: IPostMetric[];
    fetchedAt: number; // Unix seconds
    error?: string;
}
