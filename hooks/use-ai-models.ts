import { AIModel, useAIConfig } from "@/contexts/ai-config-context.provider";

// Re-export the model type for existing consumers (AIModelSelector, quick-edit).
export type { AIModel };

/**
 * The models a chat surface may offer, for the task that actually backs it.
 *
 * `task` is required and used to be hardcoded to "chat", which was fine while
 * every chat ran on the chat task. It stopped being true when the content
 * surface moved to `design`: the picker went on offering the chat list, so a
 * model `design` does not allow (Claude Sonnet 4.6) could be chosen, silently
 * resolved to the first allowed one, and still shown as selected. Pass the
 * surface's own task — `taskForModule` in use-ai-chat maps it.
 *
 * `selectedModel` is the EFFECTIVE model for this task, not the raw stored
 * preference. The preference is one value shared across every surface, so a
 * model chosen in another chat may not be allowed here; resolving it through
 * the task means the picker always shows what the backend will really run,
 * which is the whole point. This matches how FloatingPromptInput and
 * ScriptEditorBody already resolve theirs.
 *
 * It resolves from `rawSelectedModel`, not the context's `selectedModel` —
 * that one is already resolved against the chat task, so starting from it
 * would drop a choice that this task allows and chat does not, and the user's
 * pick would not stick.
 */
export function useAIModels(task: string) {
    const { modelsForTask, resolveForTask, rawSelectedModel, setSelectedModel, plan, loading } =
        useAIConfig();
    return {
        models: modelsForTask(task),
        plan,
        loading,
        selectedModel: resolveForTask(task, rawSelectedModel).modelId ?? "",
        setSelectedModel,
    };
}
