import { createTour } from "@edwardloopez/react-native-coachmark";

const WEB_STEPS = [
    {
        id: "guide-tour-influencer-card",
        title: "Influencer Card",
        description:
            "This is an influencer card. Tap to view their profile and invite them to your campaign.",
        placement: "bottom" as const,
        shape: "rect" as const,
        autoFocus: "ifNeeded" as const,
    },
    {
        id: "guide-tour-filter",
        title: "Filters",
        description:
            "Use the Filters button to refine your search by followers, engagement, location, and more.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
];

const MOBILE_STEPS = [
    {
        id: "guide-tour-influencer-card",
        title: "Influencer Card",
        description:
            "This is an influencer card. Tap to view their profile and invite them to your campaign.",
        placement: "bottom" as const,
        shape: "rect" as const,
        autoFocus: "ifNeeded" as const,
    },
    {
        id: "guide-tour-filter",
        title: "Filters",
        description:
            "Use the Filters button to refine your search by followers, engagement, location, and more.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
];

export const GUIDE_TOUR_WEB = createTour("guide-tour-web", WEB_STEPS, {
    showOnce: true,
    delay: 1200,
});

export const GUIDE_TOUR_MOBILE = createTour("guide-tour-mobile", MOBILE_STEPS, {
    showOnce: true,
    delay: 1200,
});

// ─── Content-planning feature tours ─────────────────────────────────────────
// One short tour per screen (Strategy / Calendar / Content), fired the first
// time the screen is genuinely usable. Web and mobile have separate step lists
// because the controls live in different places (toolbar vs overflow/FAB).

const STRATEGY_EDITOR_STEP = {
    id: "gt-strategy-editor",
    title: "Your strategy plan",
    description:
        "This is your strategy plan, written out in full. Edit it directly, or use AI to rewrite any part of it.",
    placement: "bottom" as const,
    shape: "rect" as const,
    autoFocus: "ifNeeded" as const,
};

const STRATEGY_WEB_STEPS = [
    STRATEGY_EDITOR_STEP,
    {
        id: "gt-strategy-push-to-calendar",
        title: "Push to Calendar",
        description:
            "Happy with this plan? Push it straight to your content calendar.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
    {
        id: "gt-strategy-ai-chat",
        title: "AI Chat",
        description: "Refine your strategy by chatting with AI right here.",
        placement: "left" as const,
        shape: "rect" as const,
    },
    {
        id: "gt-strategy-share",
        title: "Share & collaborate",
        description:
            "Invite teammates and leave comments to collaborate on the plan.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
];

const STRATEGY_MOBILE_STEPS = [
    STRATEGY_EDITOR_STEP,
    {
        id: "gt-strategy-overflow",
        title: "More actions",
        description:
            "Tap here to push this plan to your calendar or share it with your team.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
    {
        id: "gt-strategy-fab",
        title: "AI Chat & Comments",
        description: "Chat with AI and leave comments from here.",
        placement: "top" as const,
        shape: "pill" as const,
    },
];

export const GUIDE_TOUR_STRATEGY_WEB = createTour(
    "guide-tour-strategy-web",
    STRATEGY_WEB_STEPS,
    { showOnce: true, delay: 600 }
);

export const GUIDE_TOUR_STRATEGY_MOBILE = createTour(
    "guide-tour-strategy-mobile",
    STRATEGY_MOBILE_STEPS,
    { showOnce: true, delay: 600 }
);

const CALENDAR_WEB_STEPS = [
    {
        id: "gt-calendar-view-toggle",
        title: "Week / Month",
        description:
            "Switch between Week and Month views to plan at any zoom level.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
    {
        id: "gt-calendar-ai-chat",
        title: "AI Chat",
        description: "Ask AI to fill gaps or suggest posts for your calendar.",
        placement: "left" as const,
        shape: "rect" as const,
    },
    {
        id: "gt-calendar-comments",
        title: "Comments",
        description: "Leave comments on the month or on individual posts.",
        placement: "left" as const,
        shape: "rect" as const,
    },
];

const CALENDAR_MOBILE_STEPS = [
    {
        id: "gt-calendar-view-toggle",
        title: "Week / Month",
        description: "Switch between Week and Month views here.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
    {
        id: "gt-calendar-fab",
        title: "AI Chat & Comments",
        description: "Tap here for AI chat and comments on your calendar.",
        placement: "top" as const,
        shape: "pill" as const,
    },
];

export const GUIDE_TOUR_CALENDAR_WEB = createTour(
    "guide-tour-calendar-web",
    CALENDAR_WEB_STEPS,
    { showOnce: true, delay: 600 }
);

export const GUIDE_TOUR_CALENDAR_MOBILE = createTour(
    "guide-tour-calendar-mobile",
    CALENDAR_MOBILE_STEPS,
    { showOnce: true, delay: 600 }
);

const CONTENT_WEB_STEPS = [
    {
        id: "gt-content-view-switcher",
        title: "Board or Gallery",
        description:
            "View your content as a gallery or a Kanban board — switch anytime.",
        placement: "bottom" as const,
        shape: "rect" as const,
    },
];

// Content listing has no mobile tour — the Board/Gallery switcher is web-only.
export const GUIDE_TOUR_CONTENT_WEB = createTour(
    "guide-tour-content-web",
    CONTENT_WEB_STEPS,
    { showOnce: true, delay: 600 }
);
