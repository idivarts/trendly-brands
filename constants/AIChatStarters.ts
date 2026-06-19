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
        heading: "Hey, what are we thinking about?",
        description: "Anything goes — bounce ideas off me, ask me anything, or just chat.",
        templates: [
            "Let's brainstorm",
            "Ask me anything",
            "Help me decide",
            "Surprise me with an idea",
        ],
    },

    // Content strategy builder.
    strategy: {
        heading: "Your strategy, sharper",
        description: "Get a second pair of eyes — critique, edits, and rewrites on whatever's on the page.",
        templates: [
            "Critique this strategy",
            "Rewrite this section",
            "Find weak claims and fix them",
            "Resolve the open comments",
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
            "Catch me up on what's scheduled",
        ],
    },

    // Single piece of content (caption, visual, script, etc.).
    content: {
        heading: "Let's bring this content to life",
        description:
            "Brainstorm the idea, craft a visual prompt, sharpen the hook, or write the caption and hashtags — whatever this piece needs next.",
        templates: [
            "Brainstorm this content idea with me",
            "Write a detailed prompt for the visual",
            "Give me 5 hook options",
            "Write the caption and hashtags",
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
