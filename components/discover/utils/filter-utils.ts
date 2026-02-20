import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

/**
 * Returns true if filters has at least one meaningful value (non-null, non-undefined,
 * and if array, non-empty). Used to decide survey visibility and default filter usage.
 */
export function hasMeaningfulFilters(
    filters: IAdvanceFilters | undefined | null
): boolean {
    if (filters == null || typeof filters !== "object") return false;
    return Object.values(filters).some(
        (v) =>
            v !== undefined &&
            v !== null &&
            v !== "" &&
            !(Array.isArray(v) && v.length === 0)
    );
}
