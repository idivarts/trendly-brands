import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { useMemo } from "react";

/**
 * Token-wallet pressure level, derived from the org's monthly AI-token balance.
 * Drives the meter/banner/block escalation in the AI surfaces.
 *  - none       — no wallet provisioned yet (pre-rollout / legacy) → don't gate
 *  - healthy    — plenty left (or top-up headroom)
 *  - low        — ≤ 20% of the monthly allotment left
 *  - critical   — ≤ 5% left
 *  - exhausted  — 0 spendable tokens (monthly + top-up)
 */
export type TokenState = "none" | "healthy" | "low" | "critical" | "exhausted";

export interface TokenStatus {
    state: TokenState;
    balance: number;       // monthly allotment remaining
    allotment: number;     // monthly allotment
    topup: number;         // purchased top-up remaining
    total: number;         // balance + topup
    pctLeft: number;       // balance / allotment, clamped 0..1
    periodResetAt: number; // epoch ms of next reset (the 1st)
}

/** formatTokens renders large AI-token counts compactly (1.2M, 350K, 980). */
export function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return `${Math.max(0, Math.round(n))}`;
}

/**
 * useEntitlements is the single frontend read-point for org plan capabilities +
 * AI-token pressure. It wraps the org context (selectedOrgWallet /
 * selectedOrgEntitlements / isOrgLocked) and computes the token state so the
 * meter, gates, and composer don't each re-derive thresholds.
 */
export function useEntitlements() {
    const {
        selectedOrgWallet,
        selectedOrgEntitlements,
        selectedOrgBilling,
        isOrgLocked,
    } = useOrganizationContext();

    const tokens = useMemo<TokenStatus>(() => {
        const w = selectedOrgWallet;
        if (!w) {
            return { state: "none", balance: 0, allotment: 0, topup: 0, total: 0, pctLeft: 1, periodResetAt: 0 };
        }
        const allotment = Math.max(w.monthlyAllotment || 0, 0);
        const balance = Math.max(w.balance || 0, 0);
        const topup = Math.max(w.topupBalance || 0, 0);
        const total = balance + topup;
        const pctLeft = allotment > 0 ? Math.min(Math.max(balance / allotment, 0), 1) : total > 0 ? 1 : 0;

        let state: TokenState;
        if (total <= 0) state = "exhausted";
        else if (topup > 0) state = "healthy"; // bought headroom → don't nag on the monthly bar
        else if (pctLeft <= 0.05) state = "critical";
        else if (pctLeft <= 0.2) state = "low";
        else state = "healthy";

        return { state, balance, allotment, topup, total, pctLeft, periodResetAt: w.periodResetAt || 0 };
    }, [selectedOrgWallet]);

    return {
        wallet: selectedOrgWallet,
        entitlements: selectedOrgEntitlements,
        billing: selectedOrgBilling,
        isOrgLocked,
        tokens,
        // Convenience flags for capability gates (default to most-permissive when
        // entitlements haven't hydrated, so the UI never flickers a false lock).
        analyticsLocked: selectedOrgEntitlements?.analyticsTier === "locked",
        inboxReadOnly: selectedOrgEntitlements?.inboxReply === false,
        maxPostsPerMonth: selectedOrgEntitlements?.maxPostsPerMonth ?? -1,
    };
}
