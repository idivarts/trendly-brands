import { IDesignSystem } from "@/shared-libs/firestore/trendly-pro/models/design-system";

/**
 * DesignSystem — the app-facing shape of a brand's Design System document,
 * adding the Firestore document id (always "main") to the shared IDesignSystem
 * model. Mirrors the `Brand extends IBrands { id }` convention.
 */
export interface DesignSystem extends IDesignSystem {
    id: string;
}
