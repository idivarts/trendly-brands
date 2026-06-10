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
    getDocs,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    setDoc,
    updateDoc,
    writeBatch,
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
        editLock: data.editLock ?? null,
        crdtInitialized: data.crdtInitialized,
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
    /** Rename a strategy — discrete commit (on blur / Enter), not debounced */
    updateStrategyName: (strategyId: string, name: string) => Promise<void>;
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
    /**
     * Try to take the native single-writer edit lock. Resolves true if acquired
     * (lock was free, stale, or already ours), false if another active editor holds it.
     */
    acquireEditLock: (strategyId: string) => Promise<boolean>;
    /** Refresh our lock heartbeat (call on an interval while editing on native). */
    refreshEditLock: (strategyId: string) => Promise<void>;
    /**
     * Release the lock. When `resetCrdt` is true (native finished editing), also
     * reset the Yjs baseline — clears `crdtInitialized` and prunes `yupdates` —
     * so web re-bootstraps the CRDT from the native-edited `markdownContent`.
     */
    releaseEditLock: (strategyId: string, resetCrdt?: boolean) => Promise<void>;
}

// Presence TTL: a heartbeat older than this is considered stale
const PRESENCE_TTL_MS = 30_000;

// Edit-lock TTL: a lock whose heartbeat is older than this is considered
// abandoned (editor crashed / closed) and can be taken over.
const EDIT_LOCK_TTL_MS = 30_000;

export function useStrategies(): UseStrategiesReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [strategies, setStrategies] = useState<ContentStrategy[]>([]);
    const [loading, setLoading] = useState(true);

    // Debounce timer ref — keyed by strategyId
    const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // ── Clobber guard (Roadmap ticket 37542d5f…cdd28, Phase 1) ──────────────
    // The whole strategy body is one Firestore field saved last-write-wins, and
    // `onSnapshot` fires on every version — including our own write echoed back
    // and stale intermediate snapshots. Without a guard those replace the editor
    // while the user is mid-typing, so in-flight keystrokes are lost ("save and
    // revert"). We keep the last content the LOCAL user emitted per strategy and
    // pin the strategy's content to it while an edit is in flight, so a snapshot
    // can never regress what's on screen. The override is dropped once our write
    // fully lands (server value matches) or a genuine remote edit arrives while
    // we're idle. True same-doc concurrent merge is Phase 2 (Yjs CRDT).
    const localEditsRef = useRef<Record<string, string>>({});

    // managerId read inside the snapshot listener without re-subscribing on login.
    const managerIdRef = useRef<string | undefined>(manager?.id);
    useEffect(() => {
        managerIdRef.current = manager?.id;
    }, [manager?.id]);

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
                const myId = managerIdRef.current;
                const mapped = snapshot.docs.map((d) => {
                    const data = d.data() as IStrategy;
                    const local = localEditsRef.current[d.id];

                    // No local edit in flight → trust the server value.
                    if (local === undefined) return toContentStrategy(d.id, data);

                    const serverContent = data.markdownContent ?? "";
                    const pending = !!debounceRef.current[d.id];
                    const isRemoteEdit = !!data.lastEditedBy && data.lastEditedBy !== myId;

                    // Our own write fully landed and nothing is queued → drop the override.
                    if (!pending && serverContent === local) {
                        delete localEditsRef.current[d.id];
                        return toContentStrategy(d.id, data);
                    }
                    // A genuine collaborator edit arrived while we're idle → accept it.
                    if (!pending && isRemoteEdit) {
                        delete localEditsRef.current[d.id];
                        return toContentStrategy(d.id, data);
                    }
                    // Otherwise keep the locally-typed content so in-flight
                    // keystrokes (our own echo / a stale snapshot) are never clobbered.
                    return toContentStrategy(d.id, { ...data, markdownContent: local });
                });
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

            // Record the local edit immediately (before the debounced write and
            // before our own optimistic snapshot echoes back) so the snapshot
            // listener pins this strategy's content to what the user just typed.
            localEditsRef.current[strategyId] = markdownContent;

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

    // Rename is a discrete commit (on blur / Enter), not a debounced stream
    // like content edits — so it writes straight through.
    const updateStrategyName = useCallback(
        async (strategyId: string, name: string): Promise<void> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            if (!brandId) return;

            const docRef = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);
            await updateDoc(docRef, {
                name,
                updatedAt: Date.now(),
                lastEditedBy: managerId ?? null,
                lastEditedAt: Date.now(),
            });
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
            // merge:true so the heartbeat doesn't wipe the `awareness` field that
            // FirestoreYjsProvider writes to this same presence doc for live cursors.
            await setDoc(
                presenceRef,
                {
                    managerId,
                    name: managerName,
                    lastSeen: Date.now(),
                },
                { merge: true }
            );
        },
        [selectedBrand?.id, manager?.id, manager?.name]
    );

    const acquireEditLock = useCallback(
        async (strategyId: string): Promise<boolean> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            const name = manager?.name ?? "Someone";
            if (!brandId || !managerId) return false;

            const ref = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);
            try {
                return await runTransaction(FirestoreDB, async (tx) => {
                    const snap = await tx.get(ref);
                    const lock = snap.data()?.editLock as IStrategy["editLock"] | undefined;
                    const fresh =
                        lock && Date.now() - lock.heartbeatAt < EDIT_LOCK_TTL_MS;
                    if (fresh && lock!.managerId !== managerId) return false; // held by another
                    tx.update(ref, {
                        editLock: { managerId, name, heartbeatAt: Date.now() },
                    });
                    return true;
                });
            } catch {
                return false;
            }
        },
        [selectedBrand?.id, manager?.id, manager?.name]
    );

    const refreshEditLock = useCallback(
        async (strategyId: string): Promise<void> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            const name = manager?.name ?? "Someone";
            if (!brandId || !managerId) return;
            const ref = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);
            // Only refresh if we still hold it (avoid stomping a takeover).
            try {
                await runTransaction(FirestoreDB, async (tx) => {
                    const snap = await tx.get(ref);
                    const lock = snap.data()?.editLock as IStrategy["editLock"] | undefined;
                    if (lock && lock.managerId !== managerId) return; // lost it — don't refresh
                    tx.update(ref, {
                        editLock: { managerId, name, heartbeatAt: Date.now() },
                    });
                });
            } catch {
                /* best-effort heartbeat */
            }
        },
        [selectedBrand?.id, manager?.id, manager?.name]
    );

    const releaseEditLock = useCallback(
        async (strategyId: string, resetCrdt = false): Promise<void> => {
            const brandId = selectedBrand?.id;
            const managerId = manager?.id;
            if (!brandId) return;
            const ref = doc(FirestoreDB, "brands", brandId, "strategies", strategyId);

            // Only release if we hold it; clear the lock (and optionally the CRDT).
            try {
                const updates: Record<string, unknown> = { editLock: null };
                if (resetCrdt) updates.crdtInitialized = false;
                await updateDoc(ref, updates);

                if (resetCrdt) {
                    // Prune the Yjs log so web re-bootstraps from the edited
                    // markdownContent on next open. Batched to respect the 500-op cap.
                    const yupdatesRef = collection(
                        FirestoreDB,
                        "brands",
                        brandId,
                        "strategies",
                        strategyId,
                        "yupdates"
                    );
                    const docs = await getDocs(yupdatesRef);
                    let batch = writeBatch(FirestoreDB);
                    let ops = 0;
                    for (const d of docs.docs) {
                        batch.delete(d.ref);
                        if (++ops >= 400) {
                            await batch.commit();
                            batch = writeBatch(FirestoreDB);
                            ops = 0;
                        }
                    }
                    if (ops > 0) await batch.commit();
                }
            } catch {
                /* best-effort release; a stale lock will expire via TTL */
            }
            void managerId; // reserved for future "only release if owner" rule
        },
        [selectedBrand?.id, manager?.id]
    );

    return {
        strategies,
        loading,
        addStrategy,
        updateStrategyContent,
        updateStrategyName,
        addCollaborator,
        updateReviewStatus,
        updatePresence,
        acquireEditLock,
        refreshEditLock,
        releaseEditLock,
    };
}

export { PRESENCE_TTL_MS, EDIT_LOCK_TTL_MS };
