import { useBrandContext } from "@/contexts/brand-context.provider";
import { IOrgBilling } from "@/shared-libs/firestore/trendly-pro/models/organizations";
import { ModelStatus } from "@/shared-libs/firestore/trendly-pro/models/status";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useMyNavigation } from "@/shared-libs/utils/router";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Organization } from "@/types/Organization";
import {
    collection,
    collectionGroup,
    doc,
    documentId,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Platform } from "react-native";
import { useAuthContext } from "./auth-context.provider";

export interface OrganizationBrandSummary {
    id: string;
    name: string;
    image?: string;
}

export interface OrganizationDetail {
    organization: Organization;
    brands: OrganizationBrandSummary[];
    maxBrands: number;
    brandCount: number;
}

interface OrganizationContextProps {
    organizations: Organization[];
    loading: boolean;
    refresh: () => Promise<void>;
    createOrganization: (name: string, image?: string) => Promise<Organization | null>;
    deleteOrganization: (orgId: string) => Promise<boolean>;
    addBrand: (orgId: string, name: string, image?: string) => Promise<string | null>;
    transferBrand: (destOrgId: string, brandId: string) => Promise<boolean>;
    deleteBrand: (brandId: string) => Promise<boolean>;
    getOrganization: (orgId: string) => Promise<OrganizationDetail | null>;
    // The parent organization of the currently selected brand, kept in sync via
    // a Firestore subscription. Undefined for legacy brands with no
    // organizationId or while the subscription is still hydrating.
    selectedOrganization: Organization | undefined;
    // Convenience: selectedOrganization.billing. Source of truth for plan key,
    // trial state, subscription URL, etc. — billing lives on the org, not on
    // the brand.
    selectedOrgBilling: IOrgBilling | undefined;
    // True when the selected brand's org has no billing record yet (org-billing
    // analogue of the old per-brand "no billing == free trial" rule).
    isOnFreeTrial: boolean;
}

const noop = async () => {
    return null as any;
};

const OrganizationContext = createContext<OrganizationContextProps>({
    organizations: [],
    loading: false,
    refresh: async () => {},
    createOrganization: noop,
    deleteOrganization: noop,
    addBrand: noop,
    transferBrand: noop,
    deleteBrand: noop,
    getOrganization: noop,
    selectedOrganization: undefined,
    selectedOrgBilling: undefined,
    isOnFreeTrial: true,
});

export const useOrganizationContext = () => useContext(OrganizationContext);

// Parse the backend's { error, message } body off a thrown Response.
const errorMessage = async (e: unknown, fallback: string): Promise<string> => {
    if (e instanceof Response) {
        try {
            const body = await e.clone().json();
            return body?.message || body?.error || fallback;
        } catch {
            /* non-JSON body */
        }
    }
    return fallback;
};

export const OrganizationProvider = ({ children }: { children: React.ReactNode }) => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>(
        undefined
    );
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const router = useMyNavigation();

    // Live subscription to every org the manager belongs to. Drives the
    // Organizations hub + grouped brand switcher without a backend round trip.
    // orgMembers/{managerId} is the source of truth for membership; we then
    // fetch each referenced org doc and skip soft-deleted ones.
    useEffect(() => {
        if (!manager?.id) {
            setOrganizations([]);
            return;
        }
        setLoading(true);
        const membersQuery = query(
            collectionGroup(FirestoreDB, "orgMembers"),
            where("managerId", "==", manager.id)
        );
        const unsubscribe = onSnapshot(
            membersQuery,
            async (snapshot) => {
                try {
                    const orgIds = snapshot.docs
                        .map((d) => d.ref.parent.parent?.id)
                        .filter((x): x is string => !!x);
                    if (orgIds.length === 0) {
                        setOrganizations([]);
                        return;
                    }
                    const orgs = await Promise.all(
                        orgIds.map(async (orgId) => {
                            const snap = await getDoc(doc(FirestoreDB, "organizations", orgId));
                            if (!snap.exists()) return null;
                            const data = snap.data() as Organization;
                            if (data.deletedAt) return null;
                            return { ...data, id: snap.id } as Organization;
                        })
                    );
                    setOrganizations(orgs.filter((o): o is Organization => !!o));
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [manager?.id]);

    // Subscription manages the list; refresh is kept for API compatibility.
    const refresh = useCallback(async () => {}, []);

    // Real-time subscription to the parent org of the selected brand. Source of
    // truth for billing/plan state (which moved Brand -> Org).
    useEffect(() => {
        const orgId = selectedBrand?.organizationId;
        if (!orgId) {
            setSelectedOrganization(undefined);
            return;
        }
        const orgRef = doc(FirestoreDB, "organizations", orgId);
        const unsubscribe = onSnapshot(orgRef, (snapshot) => {
            if (!snapshot.exists()) {
                setSelectedOrganization(undefined);
                return;
            }
            setSelectedOrganization({
                ...(snapshot.data() as Organization),
                id: snapshot.id,
            });
        });
        return () => unsubscribe();
    }, [selectedBrand?.organizationId]);

    const selectedOrgBilling = selectedOrganization?.billing;

    const isOnFreeTrial = useMemo(() => {
        if (!selectedBrand) return false;
        return !selectedOrgBilling;
    }, [selectedBrand, selectedOrgBilling]);

    // Paywall gate: bounce non-onboarded, non-trial, non-Accepted brands to the
    // paywall. Mirrors what brand-context used to do, but reads billing off the
    // org instead of the brand. Only mounted under (main), so landing/pre-auth
    // routes (which don't wrap OrganizationProvider) are unaffected.
    useEffect(() => {
        if (!selectedBrand) return;
        // Draft brand mid-onboarding — never bounce.
        if (selectedBrand.onboardingComplete === false) return;
        if (Platform.OS === "web" && !selectedBrand.hasPayWall) return;
        // Wait until the org has hydrated to avoid a false-positive redirect on
        // first render (when selectedOrgBilling is briefly undefined).
        if (selectedBrand.organizationId && !selectedOrganization) return;

        const trialActive =
            selectedOrgBilling?.isOnTrial &&
            (selectedOrgBilling?.trialEnds || 0) >= Date.now();

        if (selectedOrgBilling?.status !== ModelStatus.Accepted && !trialActive) {
            router.resetAndNavigate("/pay-wall");
        }
    }, [selectedBrand, selectedOrganization, selectedOrgBilling, router]);

    const createOrganization = useCallback(
        async (name: string, image?: string): Promise<Organization | null> => {
            try {
                const res = await HttpWrapper.fetch("/api/v2/organizations", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ name, image }),
                });
                const data = await res.json();
                Toaster.success("Organization created");
                return (data?.organization as Organization) ?? null;
            } catch (e) {
                Toaster.error(await errorMessage(e, "Failed to create organization"));
                return null;
            }
        },
        []
    );

    const deleteOrganization = useCallback(
        async (orgId: string): Promise<boolean> => {
            try {
                await HttpWrapper.fetch(`/api/v2/organizations/${orgId}`, { method: "DELETE" });
                Toaster.success("Organization deleted");
                return true;
            } catch (e) {
                Toaster.error(await errorMessage(e, "Failed to delete organization"));
                return false;
            }
        },
        []
    );

    const addBrand = useCallback(
        async (orgId: string, name: string, image?: string): Promise<string | null> => {
            try {
                const res = await HttpWrapper.fetch(`/api/v2/organizations/${orgId}/brands`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ name, image }),
                });
                const data = await res.json();
                Toaster.success("Brand added");
                return (data?.brandId as string) ?? null;
            } catch (e) {
                Toaster.error(await errorMessage(e, "Failed to add brand"));
                return null;
            }
        },
        []
    );

    const transferBrand = useCallback(
        async (destOrgId: string, brandId: string): Promise<boolean> => {
            try {
                await HttpWrapper.fetch(
                    `/api/v2/organizations/${destOrgId}/brands/${brandId}/transfer`,
                    { method: "POST" }
                );
                Toaster.success("Brand moved");
                return true;
            } catch (e) {
                Toaster.error(await errorMessage(e, "Failed to move brand"));
                return false;
            }
        },
        []
    );

    const deleteBrand = useCallback(
        async (brandId: string): Promise<boolean> => {
            try {
                await HttpWrapper.fetch(`/api/v2/brands/${brandId}`, { method: "DELETE" });
                Toaster.success("Brand deleted");
                return true;
            } catch (e) {
                Toaster.error(await errorMessage(e, "Failed to delete brand"));
                return false;
            }
        },
        []
    );

    // Read the org doc + each referenced brand summary directly from Firestore.
    // Membership is enforced by rules; soft-deleted orgs/brands are filtered out
    // client-side so the screen renders nothing instead of stale data.
    const getOrganization = useCallback(
        async (orgId: string): Promise<OrganizationDetail | null> => {
            try {
                const orgSnap = await getDoc(doc(FirestoreDB, "organizations", orgId));
                if (!orgSnap.exists()) return null;
                const orgData = orgSnap.data() as Organization;
                if (orgData.deletedAt) return null;
                const organization: Organization = { ...orgData, id: orgSnap.id };

                const brandIds = organization.brandIds || [];
                let brands: OrganizationBrandSummary[] = [];
                if (brandIds.length > 0) {
                    // `where(documentId, "in", ids)` is capped at 30 ids per query
                    // — chunk so orgs with bigger plans still resolve fully.
                    const chunks: string[][] = [];
                    for (let i = 0; i < brandIds.length; i += 30) {
                        chunks.push(brandIds.slice(i, i + 30));
                    }
                    const results = await Promise.all(
                        chunks.map((ids) =>
                            getDocs(
                                query(
                                    collection(FirestoreDB, "brands"),
                                    where(documentId(), "in", ids)
                                )
                            )
                        )
                    );
                    brands = results
                        .flatMap((snap) => snap.docs)
                        .map((d) => {
                            const data = d.data() as { name?: string; image?: string; deletedAt?: number };
                            if (data.deletedAt) return null;
                            const summary: OrganizationBrandSummary = { id: d.id, name: data.name || "", image: data.image };
                            return summary;
                        })
                        .filter((b): b is OrganizationBrandSummary => b !== null);
                }

                return {
                    organization,
                    brands,
                    maxBrands: organization.maxBrands ?? 0,
                    brandCount: brandIds.length,
                };
            } catch (e) {
                Toaster.error(await errorMessage(e, "Failed to load organization"));
                return null;
            }
        },
        []
    );

    return (
        <OrganizationContext.Provider
            value={{
                organizations,
                loading,
                refresh,
                createOrganization,
                deleteOrganization,
                addBrand,
                transferBrand,
                deleteBrand,
                getOrganization,
                selectedOrganization,
                selectedOrgBilling,
                isOnFreeTrial,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
};

export default OrganizationProvider;
