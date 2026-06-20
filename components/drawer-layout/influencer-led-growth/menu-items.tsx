import { DrawerIcon, IconPropFn, Tab } from "@/components/drawer-layout/DrawerMenuItem";
import {
    faComment,
    faGem,
    faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
    faBullhorn,
    faComment as faCommentSolid,
    faFileLines,
    faGem as faGemSolid,
    faHandshake,
    faStar as faStarSolid
} from "@fortawesome/free-solid-svg-icons";
import { Theme } from "@react-navigation/native";
import React from "react";

// ─── Discovery segment ──────────────────────────────────────────────────────
// For non-India brands the Discover route renders a managed-sourcing landing
// (Hire Us) rather than the in-app discovery grid, so it isn't Pro-gated there.
export const DISCOVERY_ITEMS = (theme: Theme, isIndiaBased = true): Tab[] => [
    {
        href: "/discover",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/discover" icon={faGemSolid} focused={focused} />
            ) : (
                <DrawerIcon href="/discover" icon={faGem} focused={focused} />
            ),
        label: "Discover Influencers",
    },
    {
        href: "/collaborations",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/collaborations" icon={faStarSolid} focused={focused} />
            ) : (
                <DrawerIcon href="/collaborations" icon={faStar} focused={focused} />
            ),
        label: "Collaboration Requests",
    },
];

// ─── Execution segment ────────────────────────────────────────────────────────
// Execution surfaces (Messages, Influencer Contracts) require a connected chat
// account. When chat is not connected the items render in a locked state
// ("Connect chat to unlock"), mirroring the mobile menu.

export const EXECUTION_ITEMS = (theme: Theme, isChatConnected = true): Tab[] => {
    return [
        {
            href: "/messages",
            icon: ({ focused }: IconPropFn) =>
                focused ? (
                    <DrawerIcon href="/messages" icon={faCommentSolid} focused={focused} />
                ) : (
                    <DrawerIcon href="/messages" icon={faComment} focused={focused} />
                ),
            label: "Messages",
            showUnreadCount: true,
        },
        {
            href: "/contracts",
            icon: ({ focused }) => <DrawerIcon href="/contracts" icon={faFileLines} focused={focused} />,
            label: "Influencer Contracts",
        },
    ];
};

// ─── Growth segment (partner / affiliate landing pages) ──────────────────────
export const GROWTH_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/affiliate-purchase",
        icon: ({ focused }) => <DrawerIcon href="/affiliate-purchase" icon={faHandshake} focused={focused} />,
        label: "Affiliate Purchase",
    },
    {
        href: "/partnership-ads",
        icon: ({ focused }) => <DrawerIcon href="/partnership-ads" icon={faBullhorn} focused={focused} />,
        label: "Partnership Ads",
    },
];

export interface SubDrawerSegment {
    title: string;
    items: Tab[];
}

export const INFLUENCER_LED_GROWTH_SEGMENTS = (
    theme: Theme,
    isChatConnected = true,
    isIndiaBased = true
): SubDrawerSegment[] => [
        { title: "Discovery", items: DISCOVERY_ITEMS(theme, isIndiaBased) },
        { title: "Execution", items: EXECUTION_ITEMS(theme, isChatConnected) },
        { title: "Growth", items: GROWTH_ITEMS(theme) },
    ];
