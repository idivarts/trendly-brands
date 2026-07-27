// Shared, platform-agnostic types + product constants for the native In-App
// Purchase (RevenueCat) flow. Kept free of any `react-native-purchases` import
// so web code (which uses Razorpay, not IAP) can import from here safely.
//
// The product identifiers MUST match those configured in App Store Connect,
// Google Play Console, RevenueCat, AND the backend map in
// backend-sls/internal/trendlyapis/revenuecat/products.go.

export const IAP_PRODUCTS = {
    PRO_MONTHLY: "trendly_pro_monthly",
    TEAM_MONTHLY: "trendly_team_monthly",
    TOPUP_1M: "trendly_topup_1m",
} as const;

export type IapPlanKey = "pro" | "team";

// Tokens granted by each consumable top-up pack (mirrors the backend map). Only
// used for display; the real credit is applied server-side by the webhook.
export const IAP_TOPUP_TOKENS: Record<string, number> = {
    [IAP_PRODUCTS.TOPUP_1M]: 1_000_000,
};

// A store product normalized for the UI. `raw` carries the underlying
// RevenueCat PurchasesPackage on native (never touched on web).
export interface IapPackage {
    id: string;            // RevenueCat package identifier
    productId: string;     // store product identifier
    priceString: string;   // localized, store-set price (e.g. "$34.00")
    kind: "subscription" | "topup";
    planKey?: IapPlanKey;  // set when kind === "subscription"
    tokens?: number;       // set when kind === "topup"
    raw?: unknown;         // underlying PurchasesPackage (native only)
}

export interface IapOfferings {
    subscriptions: IapPackage[];
    topups: IapPackage[];
}

export interface IapPurchaseResult {
    success: boolean;
    userCancelled?: boolean;
    error?: string;
}

// Resolve a store product id → our plan key (subscriptions only).
export const planKeyForProduct = (productId: string): IapPlanKey | undefined => {
    if (productId.startsWith(IAP_PRODUCTS.PRO_MONTHLY)) return "pro";
    if (productId.startsWith(IAP_PRODUCTS.TEAM_MONTHLY)) return "team";
    return undefined;
};

export const topupTokensForProduct = (productId: string): number | undefined =>
    IAP_TOPUP_TOKENS[productId];
