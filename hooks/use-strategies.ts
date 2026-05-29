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
    arrayUnion,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function epochToDisplayDate(epoch: number): string {
    return new Date(epoch).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const DAY_MS = 86_400_000;

function timelineDurationDays(timeline?: IStrategy["timeline"]): number | undefined {
    if (!timeline?.startDate || !timeline?.endDate) return undefined;
    const days = Math.round((timeline.endDate - timeline.startDate) / DAY_MS);
    return days > 0 ? days : undefined;
}

function toContentStrategy(id: string, data: IStrategy): ContentStrategy {
    return {
        id,
        title: data.name,
        content: data.markdownContent ?? "",
        createdAt: epochToDisplayDate(data.createdAt),
        chatMessages: [],
        durationDays: timelineDurationDays(data.timeline),
        // Collaboration fields
        collaboratorIds: data.collaboratorIds ?? [],
        lastEditedBy: data.lastEditedBy,
        lastEditedAt: data.lastEditedAt,
        reviewStatus: data.reviewStatus ?? "draft",
        reviewRequestedBy: data.reviewRequestedBy,
        reviewRequestedAt: data.reviewRequestedAt,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt,
    };
}

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
        reviewStatus: "draft",
        createdAt: now,
        updatedAt: now,
    };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseStrategiesReturn {
    strategies: ContentStrategy[];
    loading: boolean;
    addStrategy: (title: string, markdownContent: string) => Promise<string | null>;
    /** Debounced — waits 1.5 s after the last call before writing to Firestore */
    updateStrategyContent: (strategyId: string, markdownContent: string) => Promise<void>;
    /** Add a manager (by their manager doc ID) as a collaborator on a strategy */
    addCollaborator: (strategyId: string, managerId: string) => Promise<void>;
    /** Update review status — used for Send for Review / Approve / Request Changes */
    updateReviewStatus: (
        strategyId: string,
        status: IStrategy["reviewStatus"],
        reviewedBy?: string
    ) => Promise<void>;
    /** Write (or refresh) the caller's presence heartbeat for a strategy */
    updatePresence: (strategyId: string) => Promise<void>;
}

// Presence TTL: a heartbeat older than this is considered stale
const PRESENCE_TTL_MS = 30_000;

export function useStrategies(): UseStrategiesReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [strategies, setStrategies] = useState<ContentStrategy[]>([]);
    const [loading, setLoading] = useState(true);

    // Debounce timer ref — keyed by strategyId
    const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId) {
            setStrategies([]);
            setLoading(false);
            return;
        }

        const strategiesRef = collection(FirestoreDB, "brands", brandId, "strategies");
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

    // Clean up any pending debounce timers on unmount
    useEffect(() => {
        const timers = debounceRef.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

    const addStrategy = useCallback(
        async (title: string, markdownContent: string): Promise<string | null> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            if (!brandId || !managerId) return null;

            const data = toIStrategy(title, markdownContent, managerId);
            const strategiesRef = collection(FirestoreDB, "brands", brandId, "strategies");
            const docRef = await addDoc(strategiesRef, data);
            return docRef.id;
        },
        [selectedBrand?.id, manager?.id]
    );

    /**
     * Debounced content save — waits 1.5 s after the last keystroke before
     * writing to Firestore. Also records `lastEditedBy` / `lastEditedAt` so
     * collaborators can see who made the most recent change.
     */
    const updateStrategyContent = useCallback(
        async (strategyId: string, markdownContent: string): Promise<void> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            if (!brandId) return;

            // Clear any pending debounce for this strategy
            if (debounceRef.current[strategyId]) {
                clearTimeout(debounceRef.current[strategyId]);
            }

            debounceRef.current[strategyId] = setTimeout(async () => {
                const docRef = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);
                await updateDoc(docRef, {
                    markdownContent,
                    updatedAt: Date.now(),
                    lastEditedBy: managerId ?? null,
                    lastEditedAt: Date.now(),
                });
                delete debounceRef.current[strategyId];
            }, 1500);
        },
        [selectedBrand?.id, manager?.id]
    );

    const addCollaborator = useCallback(
        async (strategyId: string, collaboratorManagerId: string): Promise<void> => {
            const brandId = selectedBrand?.id;
            if (!brandId) return;

            const docRef = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);
            await updateDoc(docRef, {
                collaboratorIds: arrayUnion(collaboratorManagerId),
                updatedAt: Date.now(),
            });
        },
        [selectedBrand?.id]
    );

    const updateReviewStatus = useCallback(
        async (
            strategyId: string,
            status: IStrategy["reviewStatus"],
            reviewedBy?: string
        ): Promise<void> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            if (!brandId || !managerId) return;

            const now = Date.now();
            const docRef = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);

            const updates: Partial<IStrategy> & { updatedAt: number } = {
                reviewStatus: status,
                updatedAt: now,
            };

            if (status === "in_review") {
                updates.reviewRequestedBy = managerId;
                updates.reviewRequestedAt = now;
            } else if (status === "approved" || status === "changes_requested") {
                updates.reviewedBy = reviewedBy ?? managerId;
                updates.reviewedAt = now;
            }

            await updateDoc(docRef, updates);
        },
        [selectedBrand?.id, manager?.id]
    );

    /**
     * Write a presence heartbeat for the current manager on a given strategy.
     * Call this when the strategy is opened and then every ~20 s while it stays open.
     * The Firestore rule ensures a manager can only write their own presence doc.
     */
    const updatePresence = useCallback(
        async (strategyId: string): Promise<void> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            const managerName = manager?.name ?? "Unknown";
            if (!brandId || !managerId) return;

            const presenceRef = doc(
                FirestoreDB,
                "brands",
                brandId,
                "strategies",
                strategyId,
                "presence",
                managerId
            );
            await setDoc(presenceRef, {
                managerId,
                name: managerName,
                lastSeen: Date.now(),
            });
        },
        [selectedBrand?.id, manager?.id, manager?.name]
    );

    return {
        strategies,
        loading,
        addStrategy,
        updateStrategyContent,
        addCollaborator,
        updateReviewStatus,
        updatePresence,
    };
}

export { PRESENCE_TTL_MS };
