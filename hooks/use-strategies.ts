import { ContentStrategy } from "@/components/content-strategy/types";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    IStrategy,
    StrategyStatus,
} from "@/shared-libs/firestore/trendly-pro/models/strategies";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Format an epoch timestamp as a localised date string for display in the UI.
 * e.g. "15 Apr 2026"
 */
function epochToDisplayDate(epoch: number): string {
    return new Date(epoch).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/**
 * Firestore `IStrategy` → local `ContentStrategy` used by the UI layer.
 */
function toContentStrategy(id: string, data: IStrategy): ContentStrategy {
    return {
        id,
        title: data.name,
        content: data.markdownContent ?? "",
        createdAt: epochToDisplayDate(data.createdAt),
        chatMessages: [], // Chat history is session-only; not persisted to Firestore
    };
}

/**
 * Build an `IStrategy` document from the title and AI-generated markdown content.
 */
function toIStrategy(
    title: string,
    markdownContent: string,
    managerId: string
): IStrategy {
    const now = Date.now();
    return {
        name: title,
        managerId,
        status: StrategyStatus.Active,
        markdownContent,
        createdAt: now,
        updatedAt: now,
    };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseStrategiesReturn {
    /** All strategies for the current brand, mapped to the UI type */
    strategies: ContentStrategy[];
    loading: boolean;
    /**
     * Create a new strategy document under `brands/{brandId}/strategies`.
     * Returns the new Firestore document ID, or null if the brand isn't ready.
     */
    addStrategy: (
        title: string,
        markdownContent: string
    ) => Promise<string | null>;
    /**
     * Persist an updated markdown body back to Firestore for the given strategy.
     */
    updateStrategyContent: (
        strategyId: string,
        markdownContent: string
    ) => Promise<void>;
}

/**
 * Subscribes to `brands/{brandId}/strategies` (ordered by `createdAt` desc)
 * and provides write helpers.
 */
export function useStrategies(): UseStrategiesReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [strategies, setStrategies] = useState<ContentStrategy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId) {
            setStrategies([]);
            setLoading(false);
            return;
        }

        const strategiesRef = collection(
            FirestoreDB,
            "brands",
            brandId,
            "strategies"
        );
        const q = query(strategiesRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const mapped = snapshot.docs.map((d) =>
                    toContentStrategy(d.id, d.data() as IStrategy)
                );
                setStrategies(mapped);
                setLoading(false);
            },
            () => {
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedBrand?.id]);

    const addStrategy = async (
        title: string,
        markdownContent: string
    ): Promise<string | null> => {
        const brandId = selectedBrand?.id;
        const managerId = manager?.id;
        if (!brandId || !managerId) return null;

        const data = toIStrategy(title, markdownContent, managerId);
        const strategiesRef = collection(
            FirestoreDB,
            "brands",
            brandId,
            "strategies"
        );
        const docRef = await addDoc(strategiesRef, data);
        return docRef.id;
    };

    const updateStrategyContent = async (
        strategyId: string,
        markdownContent: string
    ): Promise<void> => {
        const brandId = selectedBrand?.id;
        if (!brandId) return;

        const docRef = doc(
            FirestoreDB,
            "brands",
            brandId,
            "strategies",
            strategyId
        );
        await updateDoc(docRef, { markdownContent, updatedAt: Date.now() });
    };

    return { strategies, loading, addStrategy, updateStrategyContent };
}
