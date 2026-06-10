import { AIModel, useAIConfig } from "@/contexts/ai-config-context.provider";

// Re-export the model type for existing consumers (AIModelSelector, quick-edit).
export type { AIModel };

/**
 * Backward-compatible chat-model hook. Reads from the app-wide AIConfigProvider
 * (single Firestore subscription — no per-consumer fetch), returning the models
 * allowed for the `chat` task with their unlock flags, plus the persisted
 * selection. For other tasks/screens use `useAIConfig()` directly.
 */
export function useAIModels() {
    const { modelsForTask, selectedModel, setSelectedModel, plan, loading } = useAIConfig();
    return {
        models: modelsForTask("chat"),
        plan,
        loading,
        selectedModel,
        setSelectedModel,
    };
}
