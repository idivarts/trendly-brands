import type { IUsers } from "@/shared-libs/firestore/trendly-pro/models/users";

/** KYC-verified shipping address from the Users app (`kyc.currentAddress`). */
export type InfluencerKycShippingAddress = NonNullable<
    NonNullable<IUsers["kyc"]>["currentAddress"]
>;

/** Returns KYC shipping address when street and city are present (usable for shipment). */
export function getInfluencerKycShippingAddress(
    user: IUsers | null | undefined
): InfluencerKycShippingAddress | undefined {
    const a = user?.kyc?.currentAddress;
    if (!a) return undefined;
    if (!String(a.street ?? "").trim() || !String(a.city ?? "").trim()) return undefined;
    return a;
}
