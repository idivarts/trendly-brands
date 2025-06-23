import {
  faGears,
  faUsersBetweenLines,
} from "@fortawesome/free-solid-svg-icons";

export const MENU_ITEMS = [
  {
    id: "1",
    icon: faUsersBetweenLines,
    title: "Preferences",
    href: "/preferences",
  },
  {
    id: "2",
    icon: faUsersBetweenLines,
    title: "Members",
    href: "/members",
  },
  {
    id: "2",
    title: "Settings",
    href: "/settings",
    icon: faGears,
  },
];
