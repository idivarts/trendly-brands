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
    {
        id: "guide-tour-campaigns-web",
        title: "Campaigns",
        description:
            "The Campaigns tab shows all your active and past campaigns. Manage collaborations here.",
        placement: "right" as const,
        shape: "rect" as const,
    },
    {
        id: "guide-tour-brand-switcher-web",
        title: "Brand Switcher",
        description:
            "Use the brand switcher here to switch between your brands and manage your account.",
        placement: "right" as const,
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
    {
        id: "guide-tour-campaigns-mobile",
        title: "Campaigns",
        description:
            "The Campaigns tab shows all your active and past campaigns. Manage collaborations here.",
        placement: "top" as const,
        shape: "pill" as const,
    },
    {
        id: "guide-tour-menu-mobile",
        title: "My Brand",
        description:
            "The My Brand tab lets you manage your brand, check usage, and access billing.",
        placement: "top" as const,
        shape: "pill" as const,
    },
    {
        id: "guide-tour-header",
        title: "Brand Switcher",
        description:
            "Use the brand switcher here to switch between your brands and manage your account.",
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

/** Tour without the first step (influencer card). Used when there are no results so the first card never mounts. */
export const GUIDE_TOUR_WEB_SKIP_FIRST = createTour(
    "guide-tour-web-skip-first",
    WEB_STEPS.slice(1),
    { showOnce: true, delay: 1200 }
);

export const GUIDE_TOUR_MOBILE_SKIP_FIRST = createTour(
    "guide-tour-mobile-skip-first",
    MOBILE_STEPS.slice(1),
    { showOnce: true, delay: 1200 }
);
