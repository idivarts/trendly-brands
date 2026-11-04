/**
 * Declared here rather than imported from PlanWrapper so this module has no
 * dependency back on the component that consumes it — the type is erased at
 * runtime either way, but a constants file importing a screen reads as a cycle
 * and invites someone to "fix" it the wrong way round.
 */
export type PlanKey = "free" | "pro" | "team" | "agency";

/**
 * List price per plan, in USD per month.
 *
 * Extracted so the pricing table and the conversion event read ONE number.
 * `subscription_started` declares `value` / `currency` and was passing
 * neither, which left the primary conversion event with no revenue on it — so
 * nothing downstream could optimise or report on value. A second hardcoded
 * copy next to the watcher would have fixed the event and created a drift bug,
 * hence this.
 *
 * Still the wrong long-term home. The authoritative amount is what the
 * provider actually charged — after proration, a coupon, tax, or a custom
 * Agency contract — and only the Razorpay / RevenueCat webhook sees it. When
 * `subscription_started` moves server-side, the value should come from the
 * webhook payload and this map goes back to being display copy.
 *
 * Agency is 0 because it is custom-priced and sold by conversation; treat a
 * zero here as "unknown", not as free.
 */
export const PLAN_MONTHLY_USD: Record<PlanKey, number> = {
    free: 0,
    pro: 29,
    team: 79,
    agency: 0,
};

export const PLAN_CURRENCY = "USD";

/**
 * The amount to report on a conversion, or undefined when we genuinely do not
 * know it. Returning undefined rather than 0 matters: a zero would be read as
 * a real sale worth nothing and would drag any average down.
 */
export const planValueUSD = (planKey?: string): number | undefined => {
    if (!planKey) return undefined;
    const value = PLAN_MONTHLY_USD[planKey as PlanKey];
    return value ? value : undefined;
};

/**
 * Monthly AI-token allotment per plan, for display on the pricing/paywall
 * cards only.
 *
 * The authority is the backend `PlanLimitsMap` (`internal/models/
 * trendlymodels/organization.go`), and the org you are actually on reads its
 * real number off `org.tokenWallet.monthlyAllotment` — never this map. But a
 * comparison table has to name the allowance of plans you are NOT on, which
 * no org doc can supply, so those figures live here and nowhere else.
 *
 * Render them with `formatTokens` (hooks/use-entitlements) so a card says
 * exactly what the wallet meter says: "5M", not "600".
 *
 * ⚠️ Keep in step with PlanLimitsMap whenever the allotments are re-tuned
 * (Phase-1 values are still provisional).
 *
 * Agency is contract-sized; 20M is the floor the backend resolves it to, and
 * the card sells it as "custom" rather than printing the number.
 */
export const PLAN_MONTHLY_TOKENS: Record<PlanKey, number> = {
    free: 200_000,
    pro: 2_000_000,
    team: 5_000_000,
    agency: 20_000_000,
};
