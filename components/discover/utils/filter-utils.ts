import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

/**
 * Returns true if filters has at least one meaningful value (non-null, non-undefined,
 * and if array, non-empty). Used to decide survey visibility and default filter usage.
 */
export function hasMeaningfulFilters(
  filters: IAdvanceFilters | undefined | null,
): boolean {
  if (filters == null || typeof filters !== "object") return false;
  return Object.values(filters).some(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0),
  );
}

/**
 * Strips null/undefined values and empty arrays from a filters object.
 */
export function cleanFilters(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        const cleanedArray = value.filter((v) => v !== undefined && v !== null);
        if (cleanedArray.length > 0) cleaned[key] = cleanedArray;
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/** Keys that are API/pagination state only — not stored in discoverPreferences (Firestore). */
const PAGINATION_AND_SORT_KEYS = new Set([
  "offset",
  "limit",
  "sort",
  "sort_direction",
]);

/**
 * Like cleanFilters but removes offset, limit, sort, sort_direction so that
 * only actual filter preferences are stored in brand.discoverPreferences.
 * Use when saving to Firestore and when reading from it so we never use stored offset/limit.
 */
export function cleanFiltersForStorage(
  obj: Record<string, any>,
): Record<string, any> {
  const cleaned = cleanFilters(obj);
  for (const key of PAGINATION_AND_SORT_KEYS) {
    delete cleaned[key];
  }
  return cleaned;
}
