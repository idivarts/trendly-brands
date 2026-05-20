export type CampaignType = "one-off" | "retainer";
export type BudgetType = "fixed" | "needs-based";
export type ContentFrequencyPeriod = "week" | "month";
export type CampaignStatus = "draft" | "active" | "past";

export interface ContentFrequency {
    count: number;
    period: ContentFrequencyPeriod;
}

export interface ContentCreationFeature {
    enabled: boolean;
    influencerBudget?: number;
    influencerFollowerRange?: [number, number];
    minReach?: number;
    niches?: string[];
    genderPreference?: string[];
}

export interface AdSpendFeature {
    enabled: boolean;
    totalAdSpend?: number;
}

export interface PerformanceMarketingFeature {
    enabled: boolean;
    avgSaleValue?: number;
}

export interface CampaignFeatures {
    conversionAudit: boolean;
    contentStrategy: boolean;
    contentCreation: ContentCreationFeature;
    adSpend: AdSpendFeature;
    performanceMarketing: PerformanceMarketingFeature;
}

export interface CampaignEstimatedROI {
    organicReach?: number;
    clickThrough?: number;
    conversions?: number;
    roas?: number;
}

export interface ICampaign {
    brandId: string;
    managerId: string;
    name: string;
    description?: string;
    platforms: string[];
    campaignType: CampaignType;
    budgetType: BudgetType;
    totalBudget: number;
    contentFrequency: ContentFrequency;
    features: CampaignFeatures;
    estimatedBudget: number;
    estimatedROI: CampaignEstimatedROI;
    status: CampaignStatus;
    createdAt: number;
    updatedAt: number;
}

export interface Campaign extends ICampaign {
    id: string;
}

export const DEFAULT_CAMPAIGN_FEATURES: CampaignFeatures = {
    conversionAudit: false,
    contentStrategy: false,
    contentCreation: { enabled: false },
    adSpend: { enabled: false },
    performanceMarketing: { enabled: false },
};

export const DEFAULT_CAMPAIGN: Partial<ICampaign> = {
    name: "",
    description: "",
    platforms: [],
    campaignType: "retainer",
    budgetType: "fixed",
    totalBudget: 0,
    contentFrequency: { count: 4, period: "month" },
    features: DEFAULT_CAMPAIGN_FEATURES,
    estimatedBudget: 0,
    estimatedROI: {},
    status: "draft",
};

// Minimum budget thresholds per feature (INR)
export const FEATURE_MIN_BUDGETS = {
    conversionAudit: 25000,
    contentStrategy: 15000,
    contentCreation: 10000,
    adSpend: 0,
    performanceMarketing: 35000,
} as const;

// Fixed costs per feature (INR), where applicable
export const FEATURE_COSTS = {
    conversionAudit: 20000,
    contentStrategyPerPost: { low: 15000, mid: 30000, high: 50000 },
    contentCreationPct: 0.15,
    adSpendPct: 0.10,
    performanceMarketing: 35000,
} as const;
