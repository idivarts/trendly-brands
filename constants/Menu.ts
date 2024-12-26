import { faGears, faUser } from "@fortawesome/free-solid-svg-icons";

export const MENU_ITEMS = [
  {
    id: "1",
    icon: faUser,
    title: "Members",
    href: "/preferences",
  },
  {
    id: "2",
    title: "Settings",
    href: "/settings",
    icon: faGears,
  },
];
