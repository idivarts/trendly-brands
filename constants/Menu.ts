import {
  faGears,
  faSliders,
  faUsers
} from "@fortawesome/free-solid-svg-icons";

export const MENU_ITEMS = [
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
    id: "3",
    title: "Settings",
    href: "/settings",
    icon: faGears,
  },
];
