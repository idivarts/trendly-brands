import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";
import { doc, onSnapshot } from "firebase/firestore";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AI model config — single source of truth, read once from Firestore.
//
// The model catalog + per-task allowed-model lists live in Firestore
// (ai_config/models, ai_config/tasks), seeded/edited server-side. This provider
// subscribes ONCE at mount and exposes the resolved data to every consumer with
// no per-consumer fetch or delay. Plan gating (free < pro < team < agency) is
// computed locally from the org's billing plan, so the model picker never needs
// an API round-trip.
// ─────────────────────────────────────────────────────────────────────────────

export type AIPlan = "free" | "pro" | "team" | "agency";

export interface AIModel {
    id: string;
    displayName: string;
    provider: string;
    minPlan: AIPlan;
    vision?: boolean;
    imageGen?: boolean;
    /** Computed for the current plan. */
    unlocked: boolean;
}

interface RawModel {
    id: string;
    displayName: string;
    provider: string;
    minPlan: AIPlan;
    vision?: boolean;
    imageGen?: boolean;
    enabled?: boolean;
    order?: number;
}

export interface ResolveResult {
    /** Resolved model id, or null when the plan unlocks nothing for the task. */
    modelId: string | null;
    /** True when no allowed model is available on the plan — show an upgrade CTA. */
    locked: boolean;
}

const STORAGE_KEY = "ai.selectedModel";

const PLAN_RANK: Record<AIPlan, number> = { free: 0, pro: 1, team: 2, agency: 3 };

// Mirrors backend openrouter.PlanFromKey — maps USD + legacy India plan keys.
function planFromKey(key?: string | null): AIPlan {
    switch (key) {
        case "free":
            return "free";
        case "pro":
            return "pro";
        case "team":
            return "team";
        case "agency":
            return "agency";
        // legacy India tiers
        case "starter":
            return "free";
        case "growth":
            return "team";
        case "enterprise":
            return "agency";
        default:
            return "free";
    }
}

interface AIConfigContextType {
    loading: boolean;
    plan: AIPlan;
    /** Full catalog, each model carrying an `unlocked` flag for the current plan. */
    models: AIModel[];
    /** task -> ordered allowed model ids (best -> fallbacks). */
    tasks: Record<string, string[]>;
    /** Persisted chat model selection (falls back to the chat default). */
    selectedModel: string;
    setSelectedModel: (id: string) => void;
    isUnlocked: (modelId: string) => boolean;
    /** Ordered allowed models for a task, each with its `unlocked` flag. */
    modelsForTask: (task: string) => AIModel[];
    /** First plan-unlocked model for a task (honours `requested` if allowed+unlocked). */
    resolveForTask: (task: string, requested?: string) => ResolveResult;
    /** Convenience: resolveForTask(task).modelId. */
    defaultModelForTask: (task: string) => string | null;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider = ({ children }: { children: ReactNode }) => {
    const { selectedOrgBilling } = useOrganizationContext();
    const plan = useMemo(
        () => planFromKey(selectedOrgBilling?.planKey),
        [selectedOrgBilling?.planKey]
    );

    const [rawModels, setRawModels] = useState<RawModel[]>([]);
    const [tasks, setTasks] = useState<Record<string, string[]>>({});
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [tasksLoaded, setTasksLoaded] = useState(false);
    const [persistedModel, setPersistedModel] = useState<string>("");

    // Subscribe once — the config rarely changes, but onSnapshot keeps the app in
    // sync if it's edited in the Firebase console with no redeploy/reload.
    useEffect(() => {
        const unsubModels = onSnapshot(
            doc(FirestoreDB, "ai_config", "models"),
            (snap) => {
                const data = snap.data();
                const raw = (data?.models ?? []) as RawModel[];
                const usable = raw
                    .filter((m) => m && m.id && m.enabled !== false)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setRawModels(usable);
                setModelsLoaded(true);
            },
            () => setModelsLoaded(true)
        );
        const unsubTasks = onSnapshot(
            doc(FirestoreDB, "ai_config", "tasks"),
            (snap) => {
                const data = snap.data();
                const t = (data?.tasks ?? {}) as Record<string, { allowed?: string[] }>;
                const map: Record<string, string[]> = {};
                Object.keys(t).forEach((k) => {
                    map[k] = t[k]?.allowed ?? [];
                });
                setTasks(map);
                setTasksLoaded(true);
            },
            () => setTasksLoaded(true)
        );
        return () => {
            unsubModels();
            unsubTasks();
        };
    }, []);

    useEffect(() => {
        PersistentStorage.get(STORAGE_KEY).then((v) => {
            if (v) setPersistedModel(v);
        });
    }, []);

    const models = useMemo<AIModel[]>(
        () =>
            rawModels.map((m) => ({
                id: m.id,
                displayName: m.displayName,
                provider: m.provider,
                minPlan: m.minPlan,
                vision: m.vision,
                imageGen: m.imageGen,
                unlocked: PLAN_RANK[plan] >= PLAN_RANK[m.minPlan ?? "free"],
            })),
        [rawModels, plan]
    );

    const isUnlocked = useCallback(
        (modelId: string) => models.find((m) => m.id === modelId)?.unlocked ?? false,
        [models]
    );

    const modelsForTask = useCallback(
        (task: string): AIModel[] => {
            const allowed = tasks[task] ?? [];
            return allowed
                .map((id) => models.find((m) => m.id === id))
                .filter((m): m is AIModel => !!m);
        },
        [tasks, models]
    );

    const resolveForTask = useCallback(
        (task: string, requested?: string): ResolveResult => {
            const allowed = tasks[task] ?? [];
            if (requested && allowed.includes(requested) && isUnlocked(requested)) {
                return { modelId: requested, locked: false };
            }
            for (const id of allowed) {
                if (isUnlocked(id)) return { modelId: id, locked: false };
            }
            return { modelId: null, locked: true };
        },
        [tasks, isUnlocked]
    );

    const defaultModelForTask = useCallback(
        (task: string) => resolveForTask(task).modelId,
        [resolveForTask]
    );

    // Effective chat selection: the persisted model if it's still unlocked,
    // otherwise the best chat model the plan allows.
    const selectedModel = useMemo(() => {
        if (persistedModel && isUnlocked(persistedModel)) {
            const allowed = tasks["chat"] ?? [];
            if (allowed.length === 0 || allowed.includes(persistedModel)) {
                return persistedModel;
            }
        }
        return resolveForTask("chat").modelId ?? persistedModel ?? "";
    }, [persistedModel, isUnlocked, tasks, resolveForTask]);

    const setSelectedModel = useCallback((id: string) => {
        setPersistedModel(id);
        PersistentStorage.set(STORAGE_KEY, id);
    }, []);

    const value: AIConfigContextType = {
        loading: !modelsLoaded || !tasksLoaded,
        plan,
        models,
        tasks,
        selectedModel,
        setSelectedModel,
        isUnlocked,
        modelsForTask,
        resolveForTask,
        defaultModelForTask,
    };

    return <AIConfigContext.Provider value={value}>{children}</AIConfigContext.Provider>;
};

export const useAIConfig = (): AIConfigContextType => {
    const ctx = useContext(AIConfigContext);
    if (!ctx) {
        // Safe defaults when consumed outside the provider (e.g. pre-auth screens).
        return {
            loading: false,
            plan: "free",
            models: [],
            tasks: {},
            selectedModel: "",
            setSelectedModel: () => {},
            isUnlocked: () => false,
            modelsForTask: () => [],
            resolveForTask: () => ({ modelId: null, locked: true }),
            defaultModelForTask: () => null,
        };
    }
    return ctx;
};
