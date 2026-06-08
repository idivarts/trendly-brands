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
    addDoc,
    collection,
    collectionGroup,
    doc,
    DocumentData,
    documentId,
    DocumentReference,
    getDocs,
    onSnapshot,
    query,
    setDoc,
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
    brands: Brand[];
    createBrand: (
        brand: Partial<IBrands>
    ) => Promise<DocumentReference<DocumentData, DocumentData> | null>;
    /**
     * Creates a DRAFT brand (Firestore-only, no backend provisioning) and its
     * member doc, returning the new ref. Used to start AI onboarding: it yields
     * a brandId the chat can scope to before the brand is fully set up.
     */
    createDraftBrand: (
        brand?: Partial<IBrands>
    ) => Promise<DocumentReference<DocumentData, DocumentData> | null>;
    /**
     * Finalizes a draft brand: runs backend provisioning (billing/credits/team)
     * and flips onboardingComplete. Safe to call once onboarding completes.
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
            return;
        }
        const teamRef = doc(FirestoreDB, "brands", brandId, "teams", teamId);
        const unsubscribe = onSnapshot(teamRef, (snapshot) => {
            const data = snapshot.exists() ? snapshot.data() : undefined;
            setTeamPrivileges((data?.privileges as TeamPrivileges) ?? undefined);
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
            where("managerId", "==", manager.id)
            // where("status", "not-in", [0, 2])
        );
        Console.log("Brand ID from member Query:", manager.id);

        const unsubscribe = onSnapshot(membersQuery, async (membersSnapshot) => {
            if (!hasHydratedFromCache) {
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
                    if (member.status === 0 || member.status > 1) {
                        return;
                    }

                    const brandId = doc.ref.parent.parent?.id; // Get the brand ID from the member's document reference
                    Console.log("Brand ID from member:", brandId);
                    if (brandId) {
                        brandIds.add(brandId);
                    }
                });

                if (brandIds.size === 0) {
                    Console.log("No brands associated with this manager");
                    setBrands([]);
                    await setSelectedBrandHandler(undefined, false);
                    return;
                }

                const brandsCollection = collection(FirestoreDB, "brands");
                const brandsQuery = query(
                    brandsCollection,
                    where(documentId(), "in", Array.from(brandIds))
                );

                await getDocs(brandsQuery).then(async (brandsSnapshot) => {
                    const fetchedBrands: Brand[] = [];
                    brandsSnapshot.docs.forEach((brandDoc) => {
                        fetchedBrands.push({
                            ...(brandDoc.data() as Brand),
                            id: brandDoc.id,
                        });
                    });

                    setBrands(fetchedBrands);

                    let finalSelectedBrand: Brand | undefined = selectedBrandRef.current;

                    if (fetchedBrands.length > 0) {
                        const persistedSelectedBrandId =
                            (await PersistentStorage.get("selectedBrandId")) || undefined;
                        Console.log(
                            "Selected Brand ID from storage:",
                            persistedSelectedBrandId
                        );

                        const isFinalized = (b?: Brand) =>
                            !!b && b.onboardingComplete !== false;
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

                        finalSelectedBrand = resolvedSelectedBrand;

                        if (resolvedSelectedBrand.id !== selectedBrandRef.current?.id) {
                            await setSelectedBrandHandler(resolvedSelectedBrand, false);
                        }
                    } else {
                        finalSelectedBrand = undefined;
                        if (selectedBrandRef.current) {
                            await setSelectedBrandHandler(undefined, false);
                        }
                    }
                });
            } finally {
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
        const cacheKey = getManagerBrandsCacheKey(manager.id);

        const persistBrandsCache = async () => {
            try {
                for (let i = 0; i < brands.length; i++) {
                    if (brands[i].id === selectedBrand?.id) {
                        brands[i] = selectedBrand;
                        break;
                    }
                }
                await PersistentStorage.set(
                    cacheKey,
                    JSON.stringify({
                        brands,
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
    const isPermissiveMember = !currentMember || !currentMember.teamId;

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

    const createBrand = async (brand: Partial<IBrands>) => {
        if (!manager) return null;

        const brandRef = collection(FirestoreDB, "brands");
        // Capture the brand's country silently (no UI). Source of truth for
        // India-only gating. Don't overwrite an explicitly provided value.
        const brandDoc = await addDoc(brandRef, {
            country: detectCountryCode(),
            ...brand,
        });

        const managerRef = doc(
            FirestoreDB,
            "brands",
            brandDoc.id,
            "members",
            manager.id
        );
        await setDoc(managerRef, {
            managerId: manager.id,
            role: "Manager",
        });

        HttpWrapper.fetch(`/api/v2/brands/create`, {
            method: "POST",
            body: JSON.stringify({
                brandId: brandDoc.id,
            }),
            headers: {
                "content-type": "application/json",
            },
        });

        return brandDoc;
    };

    const createDraftBrand = async (brand: Partial<IBrands> = {}) => {
        if (!manager) return null;

        const brandRef = collection(FirestoreDB, "brands");
        const brandDoc = await addDoc(brandRef, {
            name: "",
            creationTime: Date.now(),
            // Capture the brand's country silently (no UI) at draft creation so
            // it survives the later finalize step. Source of truth for gating.
            country: detectCountryCode(),
            ...brand,
            // A draft is intentionally NOT provisioned on the backend yet.
            onboardingComplete: false,
        });

        const managerRef = doc(
            FirestoreDB,
            "brands",
            brandDoc.id,
            "members",
            manager.id
        );
        await setDoc(managerRef, {
            managerId: manager.id,
            role: "Manager",
        });

        return brandDoc;
    };

    const finalizeBrand = async (brandId: string) => {
        await HttpWrapper.fetch(`/api/v2/brands/create`, {
            method: "POST",
            body: JSON.stringify({ brandId }),
            headers: {
                "content-type": "application/json",
            },
        });
    };

    const updateBrand = async (
        id: string,
        brand: Partial<IBrands>
    ): Promise<void> => {
        const brandRef = doc(FirestoreDB, "brands", id);

        await updateDoc(brandRef, brand);
    };

    // Resume onboarding: if the active brand is still a draft, keep the user in
    // the AI onboarding chat until it's finalized.
    useEffect(() => {
        if (selectedBrand?.onboardingComplete !== false) return;
        // If the user already has a finalized brand, never bounce them to
        // onboarding — selection prefers the finalized brand, so this draft is
        // transient (e.g. a stray/abandoned draft) and must not hijack routing.
        if (brands.some((b) => b.onboardingComplete !== false)) return;
        // Don't redirect while already anywhere in the onboarding flow (chat or
        // the fallback form), only when a draft is open from elsewhere.
        if (pathName?.includes("onboarding")) return;
        router.resetAndNavigate("/onboarding-chat");
    }, [selectedBrand?.id, selectedBrand?.onboardingComplete, pathName, brands]);

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
