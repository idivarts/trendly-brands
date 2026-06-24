import { FeatureKey, resolveCapability, resolvePrivilege, TeamPrivileges } from "@/constants/Access";
import { IS_MONETIZATION_DONE } from "@/shared-constants/app";
import {
    IBrands,
    IBrandsMembers,
} from "@/shared-libs/firestore/trendly-pro/models/brands";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { useMyNavigation } from "@/shared-libs/utils/router";
import {
    ProfileModalSendMessage,
    ProfileModalUnlockRequest,
} from "@/shared-uis/components/ProfileModal/Profile-Modal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Brand } from "@/types/Brand";
import { detectCountryCode, isIndiaBrand } from "@/utils/country";
import { usePathname } from "expo-router";
import {
    collection,
    collectionGroup,
    doc,
    documentId,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useAuthContext } from "./auth-context.provider";

interface BrandContextProps {
    // Finalized brands only (drafts hidden) — used by most screens.
    brands: Brand[];
    // Every brand the user can access, INCLUDING mid-onboarding drafts. Used by
    // the brand switcher so it matches the Organizations page (which lists every
    // org regardless of brand state).
    allBrands: Brand[];
    /**
     * Creates AND finalizes a brand in one backend round-trip. Returns the new
     * brandId. Brand creation never happens client-side — the backend allocates
     * the id, writes the brand + member docs, and provisions the brand. The
     * caller should fetch the brand document from Firestore using the returned
     * id (or rely on a snapshot listener) before showing brand-scoped UI.
     */
    createBrand: (brand: Partial<IBrands>) => Promise<string | null>;
    /**
     * Creates a DRAFT brand on the backend (no provisioning) and returns the
     * new brandId. Used by the AI onboarding chat so it can scope conversation
     * messages to a brandId before the user has filled the form.
     */
    createDraftBrand: (brand?: Partial<IBrands>) => Promise<string | null>;
    /**
     * Finalizes an existing draft brand (provisions billing/credits/team and
     * flips onboardingComplete). Safe to call multiple times; the backend's
     * finalize step is idempotent.
     */
    finalizeBrand: (brandId: string) => Promise<void>;
    selectedBrand: Brand | undefined;
    setSelectedBrand: (brand: Brand | undefined, triggerToast?: boolean) => void;
    updateBrand: (id: string, brand: Partial<IBrands>) => Promise<void>;
    loading: boolean;
    isProfileLocked: (influencerId: string) => boolean;
    /** The current manager's membership record for the selected brand. */
    currentMember?: CurrentMember;
    /**
     * Whether the current member's team grants `priv` under `feature`. Permissive
     * while unknown/loading and for legacy (pre-migration) members with no team —
     * the backend and Firestore rules remain the real enforcement boundary.
     */
    hasPrivilege: (feature: FeatureKey, priv: string) => boolean;
    /**
     * Whether the current member's team grants ANY privilege under `feature`.
     * Used for navigation visibility (does this area show at all). Permissive
     * while unknown/loading and for legacy members.
     */
    hasFeature: (feature: FeatureKey) => boolean;
    /**
     * Legacy capability check, mapped onto the team-privilege model. Prefer
     * hasPrivilege() in new code.
     */
    hasCapability: (cap: string) => boolean;
    /**
     * Whether the selected brand is India-based, derived from its stored
     * country (missing => India). Source of truth for India-only gating
     * (discovery, in-app invites, Razorpay payments). The country itself is
     * never surfaced in the UI.
     */
    isIndiaBased: boolean;
}

type CurrentMember = {
    teamId?: string;
    status?: number;
};

const BrandContext = createContext<BrandContextProps>({
    brands: [],
    allBrands: [],
    createBrand: () => Promise.resolve(null),
    createDraftBrand: () => Promise.resolve(null),
    finalizeBrand: () => Promise.resolve(),
    selectedBrand: undefined,
    setSelectedBrand: () => { },
    updateBrand: () => Promise.resolve(),
    loading: true,
    isProfileLocked: (influencerId: string) => true,
    currentMember: undefined,
    hasPrivilege: () => true,
    hasFeature: () => true,
    hasCapability: () => true,
    isIndiaBased: true,
});

export const useBrandContext = () => useContext(BrandContext);

const BRANDS_CACHE_KEY_PREFIX = "brandsCache";

type BrandsCachePayload = {
    brands: Brand[];
    selectedBrandId?: string;
};

const getManagerBrandsCacheKey = (managerId: string) =>
    `${BRANDS_CACHE_KEY_PREFIX}:${managerId}`;

export const BrandContextProvider: React.FC<
    PropsWithChildren & { restrictForPayment?: boolean }
> = ({ children }) => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
    const [currentMember, setCurrentMember] = useState<CurrentMember | undefined>(undefined);
    const [teamPrivileges, setTeamPrivileges] = useState<TeamPrivileges | undefined>(undefined);
    // The teamId the currently-loaded `teamPrivileges` belong to. Used to tell
    // "privileges loaded for this team" apart from "still loading", so gating
    // stays permissive during the load instead of hiding everything.
    const [privilegesTeamId, setPrivilegesTeamId] = useState<string | undefined>(undefined);
    const { manager } = useAuthContext();
    const router = useMyNavigation();
    const pathName = usePathname();
    const brandsRef = useRef<Brand[]>([]);
    const selectedBrandRef = useRef<Brand | undefined>(undefined);

    useEffect(() => {
        brandsRef.current = brands;
    }, [brands]);

    useEffect(() => {
        selectedBrandRef.current = selectedBrand;
    }, [selectedBrand]);

    const setSelectedBrandHandler = async (
        brand: Brand | undefined,
        triggerToast = true
    ) => {
        if (brand) {
            Console.log("Setting Brand ID to storage:", brand.id);
            await PersistentStorage.set("selectedBrandId", brand.id);
            if (triggerToast) {
                Toaster.success("Brand changed to " + brand.name);
            }
            setSelectedBrand(brand);
        } else {
            setSelectedBrand(undefined);
        }
    };

    useEffect(() => {
        if (!selectedBrand?.id) return;

        const sBrandRef = doc(collection(FirestoreDB, "brands"), selectedBrand.id);
        const unsubscribe = onSnapshot(sBrandRef, (snapshot) => {
            const bData = snapshot.data() as IBrands;
            setSelectedBrandHandler({ ...bData, id: selectedBrand.id }, false);
        });
        return () => {
            unsubscribe();
        };
    }, [selectedBrand?.id]);

    // Track the current manager's membership (the team they belong to) for the
    // selected brand so the UI can gate affordances by feature privilege.
    useEffect(() => {
        if (!selectedBrand?.id || !manager?.id) {
            setCurrentMember(undefined);
            return;
        }
        const memberRef = doc(FirestoreDB, "brands", selectedBrand.id, "members", manager.id);
        const unsubscribe = onSnapshot(memberRef, (snapshot) => {
            setCurrentMember(snapshot.exists() ? (snapshot.data() as CurrentMember) : undefined);
        });
        return () => unsubscribe();
    }, [selectedBrand?.id, manager?.id]);

    // Track the privileges of the team the current member belongs to. These are
    // what gate the UI; a member with no team (pre-migration) is treated as
    // permissive (privileges undefined → checks fall back to allow).
    useEffect(() => {
        const brandId = selectedBrand?.id;
        const teamId = currentMember?.teamId;
        if (!brandId || !teamId) {
            setTeamPrivileges(undefined);
            setPrivilegesTeamId(undefined);
            return;
        }
        const teamRef = doc(FirestoreDB, "brands", brandId, "teams", teamId);
        const unsubscribe = onSnapshot(teamRef, (snapshot) => {
            const data = snapshot.exists() ? snapshot.data() : undefined;
            setTeamPrivileges((data?.privileges as TeamPrivileges) ?? undefined);
            // Mark which team these privileges belong to, so gating knows the
            // resolution is for the CURRENT team (and not stale/loading).
            setPrivilegesTeamId(teamId);
        });
        return () => unsubscribe();
    }, [selectedBrand?.id, currentMember?.teamId]);

    useEffect(() => {
        if (!manager?.id) return;
        const cacheKey = getManagerBrandsCacheKey(manager.id);
        let hasHydratedFromCache = false;
        let isMounted = true;

        const hydrateFromCache = async () => {
            try {
                const cachedRaw = await PersistentStorage.get(cacheKey);
                if (!cachedRaw) return;

                const cachedPayload = JSON.parse(cachedRaw) as BrandsCachePayload;
                if (!Array.isArray(cachedPayload?.brands)) return;

                const cachedBrands = cachedPayload.brands;
                if (cachedBrands.length === 0) return;

                setBrands(cachedBrands);

                const desiredSelectedBrand = cachedPayload.selectedBrandId
                    ? cachedBrands.find((brand) => brand.id === cachedPayload.selectedBrandId)
                    : undefined;

                if (desiredSelectedBrand) {
                    await setSelectedBrandHandler(desiredSelectedBrand, false);
                } else if (cachedBrands.length > 0) {
                    const persistedSelectedBrandId =
                        (await PersistentStorage.get("selectedBrandId")) || undefined;
                    const fallbackBrand = persistedSelectedBrandId
                        ? cachedBrands.find((brand) => brand.id === persistedSelectedBrandId)
                        : cachedBrands[0];
                    await setSelectedBrandHandler(fallbackBrand || cachedBrands[0], false);
                } else {
                    await setSelectedBrandHandler(undefined, false);
                }

                hasHydratedFromCache = true;
                if (isMounted) {
                    setLoading(false);
                }
            } catch (e) {
                Console.log("Failed to parse brands cache", e);
            }
        };

        void hydrateFromCache();

        const membersCollection = collectionGroup(FirestoreDB, "members");
        const membersQuery = query(
            membersCollection,
            where("managerId", "==", manager.id),
            // where("status", "==", 1)
        );
        Console.log("Brand ID from member Query:", manager.id);

        const unsubscribe = onSnapshot(membersQuery, async (membersSnapshot) => {
            // Only show the blocking loader when there is nothing to display
            // yet. Once cache hydration (or a prior emission) has populated
            // brands, refresh silently in the background instead of flashing
            // the full-screen loader for the 3-5s the getDocs fan-out takes.
            if (!hasHydratedFromCache && brandsRef.current.length === 0) {
                setLoading(true);
            }
            try {
                Console.log("Brand ID from member Inside:", manager.id);
                if (membersSnapshot.empty) {
                    Console.log("No members found for this manager");
                    setBrands([]);
                    await setSelectedBrandHandler(undefined, false);
                    return;
                }

                const brandIds = new Set<string>();
                membersSnapshot.docs.forEach((doc) => {
                    const member = doc.data() as IBrandsMembers;
                    if (member.status !== 1) {
                        return;
                    }

                    const brandId = doc.ref.parent.parent?.id; // Get the brand ID from the member's document reference
                    Console.log("Brand ID from member:", brandId);
                    if (brandId) {
                        brandIds.add(brandId);
                    }
                });

                // Union in brands from organizations the manager belongs to, so
                // the brand switcher matches the Organizations page (org
                // membership grants access to the org's brands). Without this, a
                // brand that exists in an org but lacks a per-brand member doc is
                // invisible in the switcher while still showing on the org page.
                try {
                    const orgMembersSnap = await getDocs(
                        query(
                            collectionGroup(FirestoreDB, "orgMembers"),
                            where("managerId", "==", manager.id)
                        )
                    );
                    const orgIds = Array.from(
                        new Set(
                            orgMembersSnap.docs
                                .map((d) => d.ref.parent.parent?.id)
                                .filter((x): x is string => !!x)
                        )
                    );
                    for (let i = 0; i < orgIds.length; i += 10) {
                        const chunk = orgIds.slice(i, i + 10);
                        const orgsSnap = await getDocs(
                            query(
                                collection(FirestoreDB, "organizations"),
                                where(documentId(), "in", chunk)
                            )
                        );
                        orgsSnap.docs.forEach((o) => {
                            const data = o.data() as any;
                            if (data?.deletedAt) return;
                            (data?.brandIds as string[] | undefined)?.forEach((bid) =>
                                brandIds.add(bid)
                            );
                        });
                    }
                } catch (e) {
                    Console.log("Failed to union organization brands", e);
                }

                if (brandIds.size === 0) {
                    Console.log("No brands associated with this manager");
                    setBrands([]);
                    await setSelectedBrandHandler(undefined, false);
                    return;
                }

                // Fetch all brand docs, chunked by 10 to respect Firestore's
                // `in` query limit (membership + org brands can exceed it).
                const idList = Array.from(brandIds);
                const fetchedBrands: Brand[] = [];
                for (let i = 0; i < idList.length; i += 10) {
                    const chunk = idList.slice(i, i + 10);
                    const snap = await getDocs(
                        query(collection(FirestoreDB, "brands"), where(documentId(), "in", chunk))
                    );
                    snap.docs.forEach((brandDoc) => {
                        fetchedBrands.push({ ...(brandDoc.data() as Brand), id: brandDoc.id });
                    });
                }

                setBrands(fetchedBrands);

                if (fetchedBrands.length > 0) {
                    const persistedSelectedBrandId =
                        (await PersistentStorage.get("selectedBrandId")) || undefined;

                    const isFinalized = (b?: Brand) => !!b && b.onboardingComplete !== false;
                    const refBrand = fetchedBrands.find(
                        (brand) => brand.id === selectedBrandRef.current?.id
                    );
                    const persistedBrand = fetchedBrands.find(
                        (brand) => brand.id === persistedSelectedBrandId
                    );
                    const firstFinalized = fetchedBrands.find(
                        (brand) => brand.onboardingComplete !== false
                    );

                    // Always prefer a FINALIZED brand (ref → persisted → any).
                    // A draft is only selected when the user has no finalized
                    // brand at all (so first-time onboarding can resume) —
                    // otherwise a stray draft id in ref/storage would wrongly
                    // bounce an onboarded user back to the onboarding chat.
                    const resolvedSelectedBrand =
                        (isFinalized(refBrand) ? refBrand : undefined) ||
                        (isFinalized(persistedBrand) ? persistedBrand : undefined) ||
                        firstFinalized ||
                        refBrand ||
                        persistedBrand ||
                        fetchedBrands[0];

                    if (resolvedSelectedBrand.id !== selectedBrandRef.current?.id) {
                        await setSelectedBrandHandler(resolvedSelectedBrand, false);
                    }
                } else if (selectedBrandRef.current) {
                    await setSelectedBrandHandler(undefined, false);
                }
            } finally {
                setLoading(false);
            }
        }, (error) => {
            // Without this handler a transient listener error (seen when the
            // brands subscription re-attaches during client-side navigation,
            // e.g. opening a brand from the Organizations page) left `loading`
            // stuck true forever — BrandProtectedScreen then showed an infinite
            // spinner until a full refresh re-attached the listener. Mirror the
            // error-resilient pattern used by the organization + contents
            // subscriptions: log and release the loading gate.
            Console.log("Brands member subscription error", error);
            if (isMounted) {
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [manager?.id]);

    useEffect(() => {
        if (!manager?.id) return;
        // Never clobber a good cache with an empty list. On every fresh mount
        // `brands` starts as [] before hydration/snapshot fills it; persisting
        // that empty array races the cache READ in the hydrate effect above and
        // can wipe the previously cached brands — which is exactly what made the
        // app intermittently miss the cache and sit on the loading screen while
        // the snapshot fan-out refetched everything.
        if (brands.length === 0) return;
        const cacheKey = getManagerBrandsCacheKey(manager.id);

        const persistBrandsCache = async () => {
            try {
                // Merge the freshest selectedBrand snapshot into the list to be
                // persisted, without mutating the React state array in place.
                const brandsToPersist = brands.map((b) =>
                    selectedBrand && b.id === selectedBrand.id ? selectedBrand : b
                );
                await PersistentStorage.set(
                    cacheKey,
                    JSON.stringify({
                        brands: brandsToPersist,
                        selectedBrandId: selectedBrand?.id,
                    } as BrandsCachePayload)
                );
            } catch (e) {
                Console.log("Failed to persist brands cache", e);
            }
        };

        void persistBrandsCache();
    }, [manager?.id, brands, selectedBrand]);

    useEffect(() => {
        const subscription1 = ProfileModalUnlockRequest.subscribe(
            async ({ influencerId, callback }) => {
                try {
                    Console.log("Unlocking Influencer on brand", selectedBrand);
                    if (!selectedBrand) return;
                    Console.log("Unlocking Influencer", influencerId);

                    const influencerSet = new Set([
                        ...(selectedBrand.unlockedInfluencers || []),
                        influencerId,
                    ]);
                    await updateBrand(selectedBrand.id, {
                        unlockedInfluencers: [...influencerSet],
                    });
                    Console.log("Unlocked Influencer", [...influencerSet]);

                    IS_MONETIZATION_DONE &&
                        HttpWrapper.fetch(
                            `/api/collabs/influencers/${influencerId}/unlock`,
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    brandId: selectedBrand?.id,
                                }),
                                headers: {
                                    "content-type": "application/json",
                                },
                            }
                        );
                } finally {
                    callback(true);
                }
            }
        );

        const subscription2 = ProfileModalSendMessage.subscribe(
            async ({ influencerId, callback }) => {
                try {
                    IS_MONETIZATION_DONE &&
                        (await HttpWrapper.fetch(
                            `/api/collabs/influencers/${influencerId}/message`,
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    brandId: selectedBrand?.id,
                                }),
                                headers: {
                                    "content-type": "application/json",
                                },
                            }
                        ).then((r) => {
                            Toaster.success("Message thread is created");
                            router.push("/messages");
                            callback(true);
                        }));
                } catch (e) {
                    callback(false);
                }
            }
        );
        return () => {
            subscription1.unsubscribe();
            subscription2.unsubscribe();
        };
    }, [selectedBrand?.id]);

    const isProfileLocked = useCallback(
        (influencerId: string) => {
            if (!selectedBrand) return true;
            const unlockedProfiles = selectedBrand.unlockedInfluencers || [];
            return !unlockedProfiles.includes(influencerId);
        },
        [selectedBrand, manager?.id]
    );

    // Permissive while unknown/loading and for legacy (pre-migration) members
    // with no team — backend + Firestore rules enforce. Mirrors the server-side
    // transition shim.
    const isPermissiveMember =
        !currentMember ||
        !currentMember.teamId ||
        // The member has a team, but its privileges haven't loaded yet (the team
        // snapshot resolves after the member snapshot). Stay permissive until the
        // loaded privileges match the current team — otherwise every gated UI
        // element (e.g. sidebar nav items) briefly disappears then reappears.
        privilegesTeamId !== currentMember.teamId;

    const hasPrivilege = useCallback(
        (feature: FeatureKey, priv: string) => {
            if (isPermissiveMember) return true;
            return resolvePrivilege(teamPrivileges, feature, priv);
        },
        [isPermissiveMember, teamPrivileges]
    );

    const hasFeature = useCallback(
        (feature: FeatureKey) => {
            if (isPermissiveMember) return true;
            return (teamPrivileges?.[feature]?.length ?? 0) > 0;
        },
        [isPermissiveMember, teamPrivileges]
    );

    const hasCapability = useCallback(
        (cap: string) => {
            if (isPermissiveMember) return true;
            return resolveCapability(teamPrivileges, cap);
        },
        [isPermissiveMember, teamPrivileges]
    );

    // Single backend call that powers create / create-draft / finalize. The
    // server allocates the brand id, writes the docs, and provisions when
    // requested. Returns the brandId on success, null on failure.
    const callBrandCreateAPI = async (body: {
        brandId?: string;
        brand?: Partial<IBrands>;
        draft?: boolean;
    }): Promise<string | null> => {
        try {
            const res = await HttpWrapper.fetch(`/api/v2/brands/create`, {
                method: "POST",
                body: JSON.stringify(body),
                headers: { "content-type": "application/json" },
            });
            if (!res.ok) {
                Console.log("Brand create API failed", res.status);
                return null;
            }
            const data = await res.json();
            return data?.brandId ?? null;
        } catch (e) {
            Console.log("Brand create API errored", e);
            return null;
        }
    };

    const createBrand = async (brand: Partial<IBrands>): Promise<string | null> => {
        if (!manager) return null;
        // Capture the brand's country silently (no UI). Source of truth for
        // India-only gating. Don't overwrite an explicitly provided value.
        // creationTime is stamped here as a safety net so every create flow
        // (incl. ones that don't set it themselves) sends a value; the backend
        // also stamps it if absent. An explicit value on `brand` wins.
        return callBrandCreateAPI({
            brand: { country: detectCountryCode(), creationTime: Date.now(), ...brand },
        });
    };

    const createDraftBrand = async (
        brand: Partial<IBrands> = {}
    ): Promise<string | null> => {
        if (!manager) return null;
        return callBrandCreateAPI({
            brand: {
                name: "",
                creationTime: Date.now(),
                country: detectCountryCode(),
                ...brand,
            },
            draft: true,
        });
    };

    const finalizeBrand = async (brandId: string): Promise<void> => {
        await callBrandCreateAPI({ brandId });
    };

    const updateBrand = async (
        id: string,
        brand: Partial<IBrands>
    ): Promise<void> => {
        const brandRef = doc(FirestoreDB, "brands", id);

        await updateDoc(brandRef, brand);
    };

    // Send the manager to onboarding ONLY when they belong to no brand at all.
    // Membership is the sole trigger — onboarding status is irrelevant: a user
    // with any brand (even a not-yet-finalized draft) is never bounced here.
    useEffect(() => {
        // Wait until the brand list has finished loading, so we never redirect
        // on a transient/partial list (before the snapshot resolves or while the
        // cache is still hydrating).
        if (loading) return;
        // `brands` is the raw list including drafts → length 0 means the user is
        // genuinely part of no brand.
        if (brands.length > 0) return;
        // Don't redirect if we're already in the onboarding flow.
        if (pathName?.includes("onboarding")) return;
        router.resetAndNavigate("/onboarding");
    }, [loading, brands, pathName]);

    // Draft brands (mid-onboarding) are hidden from brand lists/switchers. The
    // active draft can still be the selectedBrand during onboarding.
    const visibleBrands = useMemo(
        () => brands.filter((b) => b.onboardingComplete !== false),
        [brands]
    );

    // India-only gating derives from the selected brand's stored country.
    // Missing country (all legacy brands) => treated as India.
    const isIndiaBased = useMemo(
        () => isIndiaBrand(selectedBrand),
        [selectedBrand]
    );

    const ctxValue = useMemo(
        () => ({
            brands: visibleBrands,
            allBrands: brands,
            createBrand,
            createDraftBrand,
            finalizeBrand,
            selectedBrand,
            setSelectedBrand: setSelectedBrandHandler,
            updateBrand,
            loading,
            isProfileLocked,
            currentMember,
            hasPrivilege,
            hasFeature,
            hasCapability,
            isIndiaBased,
        }),
        [
            visibleBrands,
            brands,
            createBrand,
            createDraftBrand,
            finalizeBrand,
            selectedBrand,
            updateBrand,
            loading,
            isProfileLocked,
            setSelectedBrandHandler,
            currentMember,
            hasPrivilege,
            hasFeature,
            hasCapability,
            isIndiaBased,
        ]
    );

    return (
        <BrandContext.Provider value={ctxValue}>{children}</BrandContext.Provider>
    );
};
