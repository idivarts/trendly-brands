export type UnifiedCreditKey =
    | "discovery"
    | "invites"
    | "campaigns"
    | "campaign-creation"
    | "contracts";

export interface CreditThreshold {
    warning: number;
    critical: number;
}

const BASE_THRESHOLDS = {
    discovery: { warning: 20, critical: 10 },
    invites: { warning: 10, critical: 5 },
    campaigns: { warning: 5, critical: 2 },
    contracts: { warning: 5, critical: 2 },
} as const;

export const CREDIT_THRESHOLDS: Record<UnifiedCreditKey, CreditThreshold> = {
    ...BASE_THRESHOLDS,
    "campaign-creation": BASE_THRESHOLDS.campaigns,
};
