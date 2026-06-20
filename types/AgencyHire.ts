export type HireType = "one-off" | "retainer";
export type BudgetType = "fixed" | "needs-based";
export type ContentFrequencyPeriod = "week" | "month";
export type AgencyHireStatus = "draft" | "active" | "past";

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

// Trendly in-house content production — designers & team create images,
// videos and motion graphics. Priced per content piece (count × period).
export interface InHouseContentFeature {
    enabled: boolean;
    count?: number;
    period?: ContentFrequencyPeriod;
}

export interface AdSpendFeature {
    enabled: boolean;
    totalAdSpend?: number;
}

export interface PerformanceMarketingFeature {
    enabled: boolean;
    avgSaleValue?: number;
}

export interface AgencyHireFeatures {
    conversionAudit: boolean;
    contentStrategy: boolean;
    inHouseContent: InHouseContentFeature;
    contentCreation: ContentCreationFeature;
    adSpend: AdSpendFeature;
    performanceMarketing: PerformanceMarketingFeature;
}

export interface AgencyHireEstimatedROI {
    organicReach?: number;
    clickThrough?: number;
    conversions?: number;
    roas?: number;
}

export interface IAgencyHire {
    brandId: string;
    managerId: string;
    name: string;
    description?: string;
    platforms: string[];
    hireType: HireType;
    budgetType: BudgetType;
    totalBudget: number;
    contentFrequency: ContentFrequency;
    features: AgencyHireFeatures;
    estimatedBudget: number;
    estimatedROI: AgencyHireEstimatedROI;
    status: AgencyHireStatus;
    createdAt: number;
    updatedAt: number;
}

export interface AgencyHire extends IAgencyHire {
    id: string;
}

export const DEFAULT_AGENCY_HIRE_FEATURES: AgencyHireFeatures = {
    conversionAudit: false,
    contentStrategy: false,
    inHouseContent: { enabled: false, count: 4, period: "month" },
    contentCreation: { enabled: false },
    adSpend: { enabled: false },
    performanceMarketing: { enabled: false },
};

export const DEFAULT_AGENCY_HIRE: Partial<IAgencyHire> = {
    name: "",
    description: "",
    platforms: [],
    hireType: "retainer",
    budgetType: "needs-based",
    totalBudget: 0,
    contentFrequency: { count: 4, period: "month" },
    features: DEFAULT_AGENCY_HIRE_FEATURES,
    estimatedBudget: 0,
    estimatedROI: {},
    status: "draft",
};

// Minimum budget thresholds per feature (INR)
export const FEATURE_MIN_BUDGETS = {
    conversionAudit: 25000,
    contentStrategy: 15000,
    inHouseContent: 10000,
    contentCreation: 10000,
    adSpend: 0,
    performanceMarketing: 35000,
} as const;

// Fixed costs per feature (INR), where applicable
export const FEATURE_COSTS = {
    conversionAudit: 20000,
    contentStrategyPerPost: { low: 15000, mid: 30000, high: 50000 },
    // In-house production fee charged per content piece (image / video /
    // motion graphic) produced by Trendly's design team.
    inHouseContentPerPiece: 2500,
    contentCreationPct: 0.15,
    adSpendPct: 0.10,
    performanceMarketing: 35000,
} as const;
