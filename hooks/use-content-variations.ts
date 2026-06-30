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
    deleteField,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

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
    /** Create a variation per platform (no-op for platforms that already exist). */
    createVariations: (platforms: Platform[], seed?: VariationSeed) => Promise<void>;
    /** Override a shared field (caption/hashtags/attachments) on a platform. */
    setOverride: (
        platform: Platform,
        field: VariationOverridableField,
        value: string | Attachment[]
    ) => Promise<void>;
    /** Clear an override so the field inherits from generic again. */
    resetField: (platform: Platform, field: VariationOverridableField) => Promise<void>;
    /** Merge platform-specific options on a variation. */
    setPlatformOptions: (platform: Platform, patch: Partial<IPlatformOptions>) => Promise<void>;
    /** Permanently remove a platform's variation. */
    deleteVariation: (platform: Platform) => Promise<void>;
}

export function useContentVariations(contentId: string | null): UseContentVariationsReturn {
    const { selectedBrand } = useBrandContext();
    const [variations, setVariations] = useState<ContentVariation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId || !contentId) {
            setVariations([]);
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
                setVariations(
                    snap.docs.map((d) => ({ id: d.id, ...(d.data() as IContentVariation) }))
                );
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsubscribe();
    }, [selectedBrand?.id, contentId]);

    const byPlatform = useMemo(() => {
        const map: Record<string, ContentVariation> = {};
        for (const v of variations) map[v.platform] = v;
        return map;
    }, [variations]);

    const variationDoc = (platform: Platform) => {
        const brandId = selectedBrand?.id;
        if (!brandId || !contentId) return null;
        return doc(FirestoreDB, "brands", brandId, "contents", contentId, "variations", platform);
    };

    const createVariations = async (platforms: Platform[], seed: VariationSeed = {}) => {
        await Promise.all(
            platforms.map(async (platform) => {
                if (byPlatform[platform]) return; // already exists — don't clobber
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
    };

    const setOverride = async (
        platform: Platform,
        field: VariationOverridableField,
        value: string | Attachment[]
    ) => {
        const ref = variationDoc(platform);
        if (!ref) return;
        const current = byPlatform[platform];
        const overriddenFields = current?.overriddenFields?.includes(field)
            ? current.overriddenFields
            : [...(current?.overriddenFields ?? []), field];
        await updateDoc(ref, {
            [field]: value as any,
            overriddenFields,
            updatedAt: Date.now(),
        });
    };

    const resetField = async (platform: Platform, field: VariationOverridableField) => {
        const ref = variationDoc(platform);
        if (!ref) return;
        const current = byPlatform[platform];
        const overriddenFields = (current?.overriddenFields ?? []).filter((f) => f !== field);
        await updateDoc(ref, {
            [field]: deleteField(),
            overriddenFields,
            updatedAt: Date.now(),
        });
    };

    const setPlatformOptions = async (platform: Platform, patch: Partial<IPlatformOptions>) => {
        const ref = variationDoc(platform);
        if (!ref) return;
        const merged = { ...(byPlatform[platform]?.platformOptions ?? {}), ...patch };
        await updateDoc(ref, { platformOptions: merged, updatedAt: Date.now() });
    };

    const deleteVariation = async (platform: Platform) => {
        const ref = variationDoc(platform);
        if (!ref) return;
        await deleteDoc(ref);
    };

    return {
        variations,
        byPlatform,
        loading,
        createVariations,
        setOverride,
        resetField,
        setPlatformOptions,
        deleteVariation,
    };
}
