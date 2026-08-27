// Proactive "subscribe nudge" config — Notion ticket "Prompting to Subscribe
// to In-app Purchase". Central place for trigger keys, priority, copy, and
// default threshold values so the engine (contexts/subscribe-nudge-context.provider.tsx)
// and UI (components/billing/SubscribeNudgeSheet.tsx) don't hardcode strings.

// GrowthBook flag keys (web only today — see NATIVE_DEFAULTS below).
export const SUBSCRIBE_NUDGE_FLAGS = {
    enabled: "subscribe-nudge-enabled",
    openCountTrigger: "subscribe-nudge-open-count-trigger",
    sessionMinutes: "subscribe-nudge-session-minutes",
    consumptionPct: "subscribe-nudge-consumption-pct",
    cooldownHours: "subscribe-nudge-cooldown-hours",
} as const;

// growthbook-context-provider.native.tsx is currently a stub with no GrowthBook
// client instantiated (no flags of any kind are readable on native today — not
// just these). Building a real native GrowthBook client is separate, larger
// scope; until then native reads these hardcoded constants instead of a flag.
// Keep values identical to the web GrowthBook defaults below so behavior
// matches until native gets real remote config.
export const NATIVE_DEFAULTS = {
    enabled: true,
    openCountTrigger: 2,
    sessionMinutes: 3,
    consumptionPct: 50,
    cooldownHours: 24,
} as const;

// Same values, used as the `useFeatureValue` fallback on web so behavior is
// identical before GrowthBook has loaded / if a flag is unset.
export const WEB_DEFAULTS = NATIVE_DEFAULTS;

export type NudgeTriggerKey =
    // Automatic (Phase 2)
    | "open_count"
    | "session_time"
    | "aha_moment"
    | "consumption_threshold"
    // Action-triggered (Phase 2b), ranked by conversion strength
    | "generate_low_tokens"
    | "publish_over_cap"
    | "create_brand_at_cap"
    | "add_member_at_cap"
    | "connect_account_locked"
    | "analytics_locked"
    | "inbox_read_only";

// Only one trigger fires per session. Lower index = higher priority, matching
// the ticket's "activity-completion > consumption-threshold > open-count >
// session-time" rule for automatic triggers, with action-triggers (fired at
// an explicit high-intent tap) ranked above all automatic ones since they
// carry the strongest intent signal.
export const NUDGE_TRIGGER_PRIORITY: NudgeTriggerKey[] = [
    "generate_low_tokens",
    "publish_over_cap",
    "create_brand_at_cap",
    "add_member_at_cap",
    "connect_account_locked",
    "analytics_locked",
    "inbox_read_only",
    "aha_moment",
    "consumption_threshold",
    "open_count",
    "session_time",
];

export interface NudgeCopy {
    headline: string;
    body: string;
}

// Benefits-led copy per trigger — same on native and web. Kept short: this is
// a bottom-sheet/modal, not a landing page.
export const NUDGE_COPY: Record<NudgeTriggerKey, NudgeCopy> = {
    open_count: {
        headline: "Plan your whole month in minutes",
        body: "Upgrade to unlock unlimited AI content, full analytics, and more brands — all in one place.",
    },
    session_time: {
        headline: "Getting the hang of it?",
        body: "Pro unlocks unlimited AI generations, team seats, and full posting — no caps to plan around.",
    },
    aha_moment: {
        headline: "Nice — your first post is in motion",
        body: "Keep the momentum going: Pro gives you unlimited AI content and posting, so nothing slows you down.",
    },
    consumption_threshold: {
        headline: "You're halfway through this month's AI tokens",
        body: "Upgrade now to avoid running out before your next reset — Pro plans include a much larger allowance.",
    },
    generate_low_tokens: {
        headline: "Running low on AI tokens",
        body: "Don't lose this idea to a token limit — upgrade for a bigger monthly allowance and keep generating.",
    },
    publish_over_cap: {
        headline: "Almost at your monthly posting limit",
        body: "Upgrade for unlimited scheduling so your content calendar is never blocked.",
    },
    create_brand_at_cap: {
        headline: "Managing more than one brand?",
        body: "Upgrade to add more brand workspaces under one organization.",
    },
    add_member_at_cap: {
        headline: "Bring your team in",
        body: "Upgrade for more seats so your whole team can collaborate on content.",
    },
    connect_account_locked: {
        headline: "Connect more accounts",
        body: "Upgrade to link more social accounts to this brand.",
    },
    analytics_locked: {
        headline: "See what's actually working",
        body: "Unlock follower, reach, engagement & audience insights across all your connected socials.",
    },
    inbox_read_only: {
        headline: "Reply right from your inbox",
        body: "Upgrade to reply to comments & DMs without leaving Trendly.",
    },
};

export const NUDGE_ANALYTICS_EVENT = "subscribe_nudge";
export type NudgeAnalyticsAction = "shown" | "dismissed" | "converted";
