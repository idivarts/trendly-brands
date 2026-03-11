import { IAdvanceFilters } from "@/shared-libs/firestore/trendly-pro/models/collaborations";

/**
 * Recursively removes undefined values and empty objects from a payload.
 * Matches TrendlyAdvancedFilter's prune() so API payloads are identical.
 */
function prunePayload(obj: any): any {
  if (obj == null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const pv = prunePayload(v);
    const isEmptyObject =
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      Object.keys(pv).length === 0;
    if (pv !== undefined && !isEmptyObject) out[k] = pv;
  }
  return out;
}

/**
 * Builds the discovery API request body from IAdvanceFilters.
 * Matches the shape and pruning that TrendlyAdvancedFilter's getFormData() produces
 * so that the same filters return the same results (e.g. Send Invitations tab vs main Discover).
 * Clamps quality to 0-10 (API expects 0-10; UI uses 0-5 stars stored as 0-10).
 */
export function buildDiscoveryPayload(
  filters: IAdvanceFilters | undefined | null,
  options: {
    sort?: string;
    sort_direction?: "asc" | "desc";
    offset?: number;
    limit?: number;
  } = {}
): Record<string, any> {
  const cleaned = cleanFilters((filters || {}) as Record<string, any>);
  const clampQuality = (v: number | undefined) =>
    v === undefined ? undefined : Math.min(10, Math.max(0, Number(v)));
  const normalized = { ...cleaned } as Record<string, any>;
  if (cleaned.qualityMin !== undefined) normalized.qualityMin = clampQuality(cleaned.qualityMin as number);
  if (cleaned.qualityMax !== undefined) normalized.qualityMax = clampQuality(cleaned.qualityMax as number);
  return prunePayload({
    ...normalized,
    sort: options.sort ?? cleaned.sort ?? "engagement",
    sort_direction: options.sort_direction ?? "desc",
    offset: options.offset ?? 0,
    limit: options.limit ?? 16,
  });
}

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
  "sort_direction",
]);

/**
 * Like cleanFilters but removes offset, limit, sort_direction so that
 * only actual filter preferences (including sort) are stored in brand.discoverPreferences.
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
