import { useBrandContext } from "@/contexts/brand-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Reports whether the given brand currently has an ACTIVE agency-hire.
 * Used to gate inviting discover-only (off-platform) influencers — those invites
 * are only allowed when the brand has hired our agency.
 *
 * Falls back to the brand from context when no brandId is supplied.
 */
export const useActiveAgencyHire = (brandId?: string) => {
    const { selectedBrand } = useBrandContext();
    const effectiveBrandId = brandId ?? selectedBrand?.id;

    const [hasActiveAgencyHire, setHasActiveAgencyHire] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!effectiveBrandId) {
            setHasActiveAgencyHire(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(FirestoreDB, "agency-hires"),
            where("brandId", "==", effectiveBrandId),
            where("status", "==", "active")
        );

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                setHasActiveAgencyHire(!snap.empty);
                setLoading(false);
            },
            () => {
                setHasActiveAgencyHire(false);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [effectiveBrandId]);

    return { hasActiveAgencyHire, loading };
};

export default useActiveAgencyHire;
