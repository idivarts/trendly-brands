// Native (iOS/Android) In-App Purchase wrapper around RevenueCat. This is the
// ONLY file that imports `react-native-purchases`; Metro resolves it on native
// only, so the web bundle never sees it (web uses `purchases.ts`).
//
// The RevenueCat App User ID is the organizationId, so every purchase attaches
// to the org (billing is org-level). Granting entitlements/tokens is done
// server-side by the RevenueCat webhook → ApplyPlanToOrg / AddTopup; this client
// only initiates the purchase and reflects local state.

import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";

import {
    planKeyForProduct,
    topupTokensForProduct,
    type IapOfferings,
    type IapPackage,
    type IapPurchaseResult,
} from "./types";

export const isIapSupported = Platform.OS === "ios" || Platform.OS === "android";

const apiKey = (): string | undefined =>
    Platform.OS !== "web"
        ? process.env.EXPO_PUBLIC_REVENUECAT_KEY : undefined;

export const isIapConfigured = (): boolean => isIapSupported && !!apiKey();

let configured = false;
let currentOrgId: string | null = null;

// identifyOrg configures the SDK on first call and (re)logs-in whenever the
// selected org changes, so purchases attach to the active org.
export async function identifyOrg(orgId: string): Promise<void> {
    const key = apiKey();
    if (!isIapSupported || !key || !orgId) return;
    try {
        if (!configured) {
            Purchases.configure({ apiKey: key, appUserID: orgId });
            configured = true;
            currentOrgId = orgId;
            return;
        }
        if (orgId !== currentOrgId) {
            await Purchases.logIn(orgId);
            currentOrgId = orgId;
        }
    } catch (e) {
        console.warn("[iap] identifyOrg failed", e);
    }
}

const toIapPackage = (p: PurchasesPackage): IapPackage => {
    const productId = p.product.identifier;
    const planKey = planKeyForProduct(productId);
    const tokens = topupTokensForProduct(productId);
    return {
        id: p.identifier,
        productId,
        priceString: p.product.priceString,
        kind: tokens ? "topup" : "subscription",
        planKey,
        tokens,
        raw: p,
    };
};

// getOfferings returns the current offering split into subscription packages and
// consumable top-up packages, mapped to our platform-agnostic shape.
export async function getOfferings(): Promise<IapOfferings> {
    if (!isIapConfigured()) return { subscriptions: [], topups: [] };
    try {
        const offerings = await Purchases.getOfferings();
        const pkgs = offerings.current?.availablePackages ?? [];
        const mapped = pkgs.map(toIapPackage);
        return {
            subscriptions: mapped.filter((m) => m.kind === "subscription" && m.planKey),
            topups: mapped.filter((m) => m.kind === "topup"),
        };
    } catch (e) {
        console.warn("[iap] getOfferings failed", e);
        return { subscriptions: [], topups: [] };
    }
}

export async function purchase(pkg: IapPackage): Promise<IapPurchaseResult> {
    if (!isIapConfigured() || !pkg.raw) {
        return { success: false, error: "In-app purchase is not available" };
    }
    try {
        await Purchases.purchasePackage(pkg.raw as PurchasesPackage);
        return { success: true };
    } catch (e: any) {
        if (e?.userCancelled) return { success: false, userCancelled: true };
        console.warn("[iap] purchase failed", e);
        return { success: false, error: e?.message ?? "Purchase failed" };
    }
}

export async function restorePurchases(): Promise<IapPurchaseResult> {
    if (!isIapConfigured()) {
        return { success: false, error: "In-app purchase is not available" };
    }
    try {
        await Purchases.restorePurchases();
        return { success: true };
    } catch (e: any) {
        console.warn("[iap] restore failed", e);
        return { success: false, error: e?.message ?? "Restore failed" };
    }
}

// getManagementURL returns the store subscription-management URL (RevenueCat
// provides it on customerInfo), falling back to the platform account page.
export async function getManagementURL(): Promise<string | null> {
    const fallback =
        Platform.OS === "ios"
            ? "https://apps.apple.com/account/subscriptions"
            : "https://play.google.com/store/account/subscriptions";
    if (!isIapConfigured()) return fallback;
    try {
        const info = await Purchases.getCustomerInfo();
        return info.managementURL ?? fallback;
    } catch {
        return fallback;
    }
}
