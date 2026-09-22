/**
 * use-content-variations
 *
 * Subscribes to `brands/{brandId}/contents/{contentId}/variations` and provides
 * helpers to create, edit, override, reset, and delete per-platform variations.
 *
 * Each variation document's ID IS its platform key, so there is at most one
 * variation per platform. A variation stores only the shared fields the user has
 * explicitly overridden (tracked in `overriddenFields`); everything else
 * inherits live from the generic content. See `models/variations.ts`.
 *
 * ── Save model (mirrors the generic content editor) ───────────────────────────
 * Field edits (caption / hashtags overrides, resets, platform options) are held
 * in a LOCAL working copy and flushed to Firestore only when `saveVariations()`
 * is called — the content detail page batches this with the generic save so one
 * "Save" persists the whole piece. `variationsDirty` reports whether any local
 * edit is pending. Creating and deleting a whole variation stay INSTANT (they add
 * or remove a tab, not a field the user is mid-editing), so those still write
 * immediately.
 *
 * The live subscription remains the server source of truth: incoming snapshots
 * reseed the local copy per-platform EXCEPT for platforms with unsaved local
 * edits, which are preserved until the next save (same "don't clobber my edits"
 * guarantee the generic editor gives).
 */
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import { IPlatformOptions } from "@/shared-libs/firestore/trendly-pro/models/contents";
import {
    IContentVariation,
    VariationOverridableField,
} from "@/shared-libs/firestore/trendly-pro/models/variations";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ContentVariation extends IContentVariation {
    id: string; // == platform
}

/** Seed values copied from the generic content when a variation is created. */
export interface VariationSeed {
    platformOptions?: IPlatformOptions;
}

interface UseContentVariationsReturn {
    variations: ContentVariation[];
    /** Quick lookup by platform. */
    byPlatform: Record<string, ContentVariation>;
    loading: boolean;
    /** True while any variation has unsaved local field edits. */
    variationsDirty: boolean;
    /** Create a variation per platform (no-op for platforms that already exist). Instant. */
    createVariations: (platforms: Platform[], seed?: VariationSeed) => Promise<void>;
    /** Override a shared field (caption/hashtags/attachments) on a platform — local only until saved. */
    setOverride: (
        platform: Platform,
        field: VariationOverridableField,
        value: string | Attachment[]
    ) => void;
    /** Clear an override so the field inherits from generic again — local only until saved. */
    resetField: (platform: Platform, field: VariationOverridableField) => void;
    /** Merge platform-specific options on a variation — local only until saved. */
    setPlatformOptions: (platform: Platform, patch: Partial<IPlatformOptions>) => void;
    /** Permanently remove a platform's variation. Instant. */
    deleteVariation: (platform: Platform) => Promise<void>;
    /** Flush all pending local variation edits to Firestore in one batch. */
    saveVariations: () => Promise<void>;
}

export function useContentVariations(contentId: string | null): UseContentVariationsReturn {
    const { selectedBrand } = useBrandContext();
    // Local working copy the editor mutates, keyed by platform. Seeded from the
    // live subscription; per-platform edits survive snapshot replays until saved.
    const [localById, setLocalById] = useState<Record<string, ContentVariation>>({});
    // Platforms with unsaved local field edits — their snapshot reseed is skipped.
    const [dirtyPlatforms, setDirtyPlatforms] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Refs so the snapshot handler and the batch save read the latest state
    // without re-subscribing / re-creating the commit closure on every edit.
    const dirtyRef = useRef(dirtyPlatforms);
    dirtyRef.current = dirtyPlatforms;
    const localRef = useRef(localById);
    localRef.current = localById;

    const brandId = selectedBrand?.id;

    useEffect(() => {
        if (!brandId || !contentId) {
            setLocalById({});
            setDirtyPlatforms(new Set());
            setLoading(false);
            return;
        }
        const ref = collection(
            FirestoreDB,
            "brands",
            brandId,
            "contents",
            contentId,
            "variations"
        );
        const unsubscribe = onSnapshot(
            ref,
            (snap) => {
                const docs = snap.docs.map(
                    (d) => ({ id: d.id, ...(d.data() as IContentVariation) }) as ContentVariation
                );
                const present = new Set<string>(docs.map((d) => d.platform));
                // Merge server docs into the local copy: take the server version
                // for every platform EXCEPT those the user is mid-editing (dirty),
                // which keep their unsaved local copy. Platforms deleted on the
                // server drop out entirely.
                setLocalById((prev) => {
                    const next: Record<string, ContentVariation> = {};
                    for (const d of docs) {
                        next[d.platform] =
                            dirtyRef.current.has(d.platform) && prev[d.platform]
                                ? prev[d.platform]
                                : d;
                    }
                    return next;
                });
                // Drop dirty flags for platforms that no longer exist on the server
                // (deleted elsewhere / by this client) so they don't block saves.
                setDirtyPlatforms((prev) => {
                    if (prev.size === 0) return prev;
                    let changed = false;
                    const n = new Set<string>();
                    prev.forEach((p) => {
                        if (present.has(p)) n.add(p);
                        else changed = true;
                    });
                    return changed ? n : prev;
                });
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsubscribe();
    }, [brandId, contentId]);

    const variations = useMemo(() => Object.values(localById), [localById]);
    const byPlatform = localById;

    const variationDoc = useCallback(
        (platform: Platform) => {
            if (!brandId || !contentId) return null;
            return doc(
                FirestoreDB,
                "brands",
                brandId,
                "contents",
                contentId,
                "variations",
                platform
            );
        },
        [brandId, contentId]
    );

    const markDirty = useCallback((platform: Platform) => {
        setDirtyPlatforms((prev) => {
            if (prev.has(platform)) return prev;
            const n = new Set(prev);
            n.add(platform);
            return n;
        });
    }, []);

    const createVariations = useCallback(
        async (platforms: Platform[], seed: VariationSeed = {}) => {
            await Promise.all(
                platforms.map(async (platform) => {
                    if (localRef.current[platform]) return; // already exists — don't clobber
                    const ref = variationDoc(platform);
                    if (!ref) return;
                    const now = Date.now();
                    const base: IContentVariation = {
                        platform,
                        overriddenFields: [],
                        createdAt: now,
                        updatedAt: now,
                    };
                    // Carry over any generic platform options as the variation's
                    // starting point (e.g. an existing YouTube title / Reddit subreddit).
                    if (seed.platformOptions && Object.keys(seed.platformOptions).length > 0) {
                        base.platformOptions = seed.platformOptions;
                    }
                    await setDoc(ref, base);
                })
            );
        },
        [variationDoc]
    );

    const setOverride = useCallback(
        (platform: Platform, field: VariationOverridableField, value: string | Attachment[]) => {
            setLocalById((prev) => {
                const cur = prev[platform];
                if (!cur) return prev; // variation must exist first (created instantly)
                const overriddenFields = cur.overriddenFields?.includes(field)
                    ? cur.overriddenFields
                    : [...(cur.overriddenFields ?? []), field];
                return {
                    ...prev,
                    [platform]: { ...cur, [field]: value, overriddenFields } as ContentVariation,
                };
            });
            markDirty(platform);
        },
        [markDirty]
    );

    const resetField = useCallback(
        (platform: Platform, field: VariationOverridableField) => {
            setLocalById((prev) => {
                const cur = prev[platform];
                if (!cur) return prev;
                // Drop the overridden value entirely so a full-doc save (below)
                // removes it from Firestore — the field then inherits from generic.
                const { [field]: _drop, ...rest } = cur as any;
                return {
                    ...prev,
                    [platform]: {
                        ...(rest as ContentVariation),
                        overriddenFields: (cur.overriddenFields ?? []).filter((f) => f !== field),
                    },
                };
            });
            markDirty(platform);
        },
        [markDirty]
    );

    const setPlatformOptions = useCallback(
        (platform: Platform, patch: Partial<IPlatformOptions>) => {
            setLocalById((prev) => {
                const cur = prev[platform];
                if (!cur) return prev;
                return {
                    ...prev,
                    [platform]: {
                        ...cur,
                        platformOptions: { ...(cur.platformOptions ?? {}), ...patch },
                    },
                };
            });
            markDirty(platform);
        },
        [markDirty]
    );

    const deleteVariation = useCallback(
        async (platform: Platform) => {
            // Optimistically drop it locally so the tab disappears at once; the
            // snapshot confirms. Also clear any pending dirty flag for it.
            setLocalById((prev) => {
                if (!prev[platform]) return prev;
                const { [platform]: _drop, ...rest } = prev;
                return rest;
            });
            setDirtyPlatforms((prev) => {
                if (!prev.has(platform)) return prev;
                const n = new Set(prev);
                n.delete(platform);
                return n;
            });
            const ref = variationDoc(platform);
            if (!ref) return;
            await deleteDoc(ref);
        },
        [variationDoc]
    );

    const saveVariations = useCallback(async () => {
        const dirty = dirtyRef.current;
        if (dirty.size === 0) return;
        if (!brandId || !contentId) return;
        const batch = writeBatch(FirestoreDB);
        const now = Date.now();
        dirty.forEach((platform) => {
            const v = localRef.current[platform];
            const ref = variationDoc(platform as Platform);
            if (!v || !ref) return;
            const { id: _id, ...docData } = v;
            // Full overwrite (not merge): fields cleared by resetField are absent
            // from docData, so writing the whole doc drops them from Firestore.
            batch.set(ref, { ...docData, updatedAt: now });
        });
        await batch.commit();
        setDirtyPlatforms(new Set());
    }, [brandId, contentId, variationDoc]);

    return {
        variations,
        byPlatform,
        loading,
        variationsDirty: dirtyPlatforms.size > 0,
        createVariations,
        setOverride,
        resetField,
        setPlatformOptions,
        deleteVariation,
        saveVariations,
    };
}
