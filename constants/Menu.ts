import {
  faGears,
  faPrescription,
  faUsersBetweenLines,
} from "@fortawesome/free-solid-svg-icons";

export const MENU_ITEMS = [
  {
    id: "1",
    icon: faPrescription,
    title: "Brand Preferences",
    href: "/preferences",
  },
  {
    id: "2",
    icon: faUsersBetweenLines,
    title: "Manage Brand Members",
    href: "/members",
  },
  {
    id: "2",
    title: "Settings",
    href: "/settings",
    icon: faGears,
  },
];
