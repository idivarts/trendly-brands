import { DrawerIcon, Tab } from "@/components/drawer-layout/DrawerMenuItem";
import { faAddressCard, faEye } from "@fortawesome/free-regular-svg-icons";
import {
    faDiagramProject,
    faTriangleExclamation,
    faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { Theme } from "@react-navigation/native";
import React from "react";

export const OPERATIONS_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/admin-invites",
        icon: ({ focused }) => (
            <DrawerIcon href="/admin-invites" icon={faUserShield} focused={focused} />
        ),
        label: "Invites Management",
    },
    {
        href: "/brand-crm",
        icon: ({ focused }) => (
            <DrawerIcon href="/brand-crm" icon={faAddressCard} focused={focused} />
        ),
        label: "Brands CRM",
    },
];

export const CONTENT_OPS_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/collaboration-cms",
        icon: ({ focused }) => (
            <DrawerIcon href="/collaboration-cms" icon={faDiagramProject} focused={focused} />
        ),
        label: "Collaboration CMS",
    },
    {
        href: "/applications",
        icon: ({ focused }) => (
            <DrawerIcon href="/applications" icon={faEye} focused={focused} />
        ),
        label: "All Applications",
    },
    {
        href: "/admin-escalations",
        icon: ({ focused }) => (
            <DrawerIcon
                href="/admin-escalations"
                icon={faTriangleExclamation}
                focused={focused}
            />
        ),
        label: "Escalations",
    },
];

export interface SubDrawerSegment {
    title: string;
    items: Tab[];
}

export const ADMIN_PORTAL_SEGMENTS = (theme: Theme): SubDrawerSegment[] => [
    { title: "Operations", items: OPERATIONS_ITEMS(theme) },
    { title: "Content & Support", items: CONTENT_OPS_ITEMS(theme) },
];
