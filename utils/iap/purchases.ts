// Web (and any non-native) stub for the In-App Purchase wrapper. IAP runs only
// on iOS/Android via RevenueCat; on web the app uses Razorpay, so every function
// here is a safe no-op. Metro resolves `purchases.native.ts` on native and this
// file everywhere else, so `react-native-purchases` is never bundled for web.

import type { IapOfferings, IapPackage, IapPurchaseResult } from "./types";

// Whether native In-App Purchase is available on this platform.
export const isIapSupported = false;

// Whether RevenueCat has API keys configured (drives the paywall fallback).
export const isIapConfigured = (): boolean => false;

// Configure the SDK + identify the org. No-op on web.
export async function identifyOrg(_orgId: string): Promise<void> {
    /* no-op on web */
}

// Fetch the current offering's packages. Empty on web.
export async function getOfferings(): Promise<IapOfferings> {
    return { subscriptions: [], topups: [] };
}

export async function purchase(_pkg: IapPackage): Promise<IapPurchaseResult> {
    return { success: false, error: "In-app purchase is not available on this platform" };
}

export async function restorePurchases(): Promise<IapPurchaseResult> {
    return { success: false, error: "In-app purchase is not available on this platform" };
}

// URL where the user manages/cancels the subscription (store account page).
export async function getManagementURL(): Promise<string | null> {
    return null;
}
