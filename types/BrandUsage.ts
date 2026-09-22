/**
 * Payload types for the admin Brand CRM usage endpoints
 * (`/api/v2/admin/brands/usage` and `/api/v2/admin/brands/:brandId/usage`).
 *
 * Mirrors backend-sls/internal/trendlyapis/admin/brand_usage.go — keep the two
 * in sync when either changes.
 */

export type ClientPlatform = "ios" | "android" | "web-desktop" | "web-mobile";

/** How the owner was resolved, for when the org owner is unavailable. */
export type BrandOwnerSource = "organization" | "brand_creator";

export interface IBrandOwner {
    managerId?: string;
    name?: string;
    email?: string;
    lastSeenPlatform?: ClientPlatform;
    lastSeenAt?: number;
    source?: BrandOwnerSource;
}

/**
 * The org's AI token wallet. Wallets are org-level, so when
 * `sharedAcrossBrands > 1` these numbers cover every brand in that org — the UI
 * must say so rather than implying the usage is this brand's alone.
 *
 * `consumed` is only what has been drawn from the CURRENT monthly allotment
 * (there is no consumption ledger); it resets monthly and excludes top-ups.
 */
export interface ITokenUsage {
    organizationId?: string;
    planKey?: string;
    monthlyAllotment: number;
    balance: number;
    consumed: number;
    topupBalance: number;
    periodResetAt?: number;
    sharedAcrossBrands: number;
}

/** Card-level metrics, keyed by brand id on the list endpoint. */
export interface IBrandUsageSummary {
    brandId: string;
    aiConversations: number;
    contentTotal: number;
    owner?: IBrandOwner;
    tokens?: ITokenUsage;
}

export interface IContentUsage {
    total: number;
    /** Counts per lifecycle status; content with no status is bucketed "draft". */
    byStatus: Record<string, number>;
    /**
     * Content carrying a strategyId — i.e. created by a strategy's
     * push-to-calendar. A proxy for how often that flow is used, since
     * push-to-calendar keeps no event log of its own.
     */
    fromStrategy: number;
}

export interface IBrandMemberUsage {
    managerId: string;
    name?: string;
    email?: string;
    profileImage?: string;
    lastSeenPlatform?: ClientPlatform;
    lastSeenAt?: number;
}

/** Full breakdown for the bottom sheet. */
export interface IBrandUsageDetail extends IBrandUsageSummary {
    strategiesTotal: number;
    content?: IContentUsage;
    members: IBrandMemberUsage[];
}

export type BrandUsageMap = Record<string, IBrandUsageSummary>;
