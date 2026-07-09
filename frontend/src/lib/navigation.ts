import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutGrid, MessagesSquare, Trophy, Users } from "lucide-react";

export interface MainNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  live?: boolean;
}

export const MAIN_NAV_LINKS: MainNavLink[] = [
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/", label: "Menu", icon: LayoutGrid },
  { href: "/effectif", label: "Effectif", icon: Users },
  { href: "/fan-zone", label: "Fan Zone", icon: MessagesSquare, live: true },
];
