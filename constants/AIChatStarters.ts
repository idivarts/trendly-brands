import { AIModule } from "@/hooks/use-ai-chat";

/**
 * Placeholder / empty-state copy for the AI chat panels, per module.
 *
 * Shown in the hero (empty-draft) state of `AIChatPanel`:
 *  - `heading`     → the big greeting
 *  - `description` → the supporting line beneath it
 *  - `templates`   → quick-start chips that prefill the composer when tapped
 *
 * These are intentionally first-draft values — review and refine the copy here;
 * this is the single source of truth, so the panels update everywhere at once.
 * A caller can still override any of these per-mount via the AIChatPanel
 * `heroTitle` / `welcomeText` / `heroSuggestions` props.
 */
export interface AIChatStarter {
    heading: string;
    description: string;
    templates: string[];
}

export const AI_CHAT_STARTERS: Record<AIModule, AIChatStarter> = {
    // Playground — a general, cross-module assistant.
    general: {
        heading: "What can I help you create?",
        description:
            "Start a new chat, or reopen any conversation from your strategies, calendar and content.",
        templates: [
            "Plan a content calendar",
            "Write a post caption",
            "Brainstorm content ideas",
            "Draft a content strategy",
        ],
    },

    // Content strategy builder.
    strategy: {
        heading: "Let's shape your content strategy",
        description:
            "Tell me about your brand and goals, and I'll help you turn them into a content strategy you can act on.",
        templates: [
            "Build a 30-day content strategy",
            "Define my content pillars",
            "Who is my target audience?",
            "Recommend a posting cadence",
        ],
    },

    // Content calendar planning.
    calendar: {
        heading: "Let's plan your calendar",
        description:
            "Ask me to fill your calendar, balance your formats, or schedule around a campaign or launch.",
        templates: [
            "Plan next week's posts",
            "Fill the gaps this month",
            "Balance reels, carousels and stories",
            "Schedule around my product launch",
        ],
    },

    // Single piece of content (caption, visual, script, etc.).
    content: {
        heading: "Let's create this content",
        description:
            "I can write captions, generate visuals, sharpen your hook, or repurpose this into other formats.",
        templates: [
            "Write a caption for this",
            "Generate a visual",
            "Give me 5 hook ideas",
            "Suggest relevant hashtags",
        ],
    },

    // First-run brand setup (guided wizard — hero not normally shown here).
    onboarding: {
        heading: "Welcome to Trendly",
        description:
            "I'll get your brand set up in a couple of minutes — just answer a few quick questions.",
        templates: [
            "Set up my brand",
            "What details do you need?",
        ],
    },
};

/** Starter copy for a module, falling back to the general assistant. */
export function getAIChatStarter(module: AIModule): AIChatStarter {
    return AI_CHAT_STARTERS[module] ?? AI_CHAT_STARTERS.general;
}
