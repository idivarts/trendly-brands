import { faCreditCard } from "@fortawesome/free-regular-svg-icons";
import {
    faFileLines,
    faGears,
    faSliders,
    faUsers
} from "@fortawesome/free-solid-svg-icons";
import { Href } from "expo-router";
import { Platform } from "react-native";

export const MENU_ITEMS: { id: string, icon: any, title: string, href: Href }[] = [
    {
        id: "1",
        icon: faSliders,
        title: "Brand Preferences",
        href: "/preferences",
    },
    {
        id: "2",
        icon: faUsers,
        title: "Manage Brand Members",
        href: "/members",
    },
    {
        id: "5",
        icon: faFileLines,
        title: "Contracts",
        href: "/contracts",
    },
    ...(Platform.OS == "web" ? [{
        id: "3",
        icon: faCreditCard,
        title: "Billing",
        href: "/billing" as Href,
    }] : []),
    ...(Platform.OS != "web" ? [{
        id: "4",
        icon: faGears,
        title: "Settings",
        href: "/settings" as Href,
    }] : []),
];
