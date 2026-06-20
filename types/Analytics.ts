// Mirrors the backend analytics payloads (internal/trendlyapis/analytics).

export type AnalyticsRange = "7d" | "28d" | "90d";

export interface IMetricPoint {
    date: string; // YYYY-MM-DD
    value: number;
}

export interface IMetric {
    key: string;
    label: string;
    total: number;
    series?: IMetricPoint[];
    available: boolean;
}

export interface IDemographicEntry {
    label: string;
    value: number;
}

export interface IDemographicBucket {
    dimension: string; // age | gender | country | city
    entries: IDemographicEntry[];
}

export interface ITopMedia {
    id: string;
    caption?: string;
    mediaType?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    permalink?: string;
    timestamp?: number;
    likes: number;
    comments: number;
    engagement: number;
}

export interface IAccountAnalytics {
    socialId: string;
    platform: "instagram" | "facebook" | "youtube" | "linkedin" | "twitter" | string;
    username: string;
    displayName: string;
    profileImageUrl: string;
    followerCount: number;
    metrics: Record<string, IMetric>;
    topMedia: ITopMedia[];
    demographics?: IDemographicBucket[];
    range: string;
    fetchedAt: number;
    supported: boolean;
    stale?: boolean;
    error?: string;
}

export interface IAnalyticsOverview {
    brandId: string;
    range: string;
    generatedAt: number;
    totals: Record<string, number>;
    accounts: IAccountAnalytics[];
}
