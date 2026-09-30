import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutGrid, MessagesSquare, Trophy, Users, Zap } from "lucide-react";

export interface MainNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  live?: boolean;
}

export const MAIN_NAV_LINKS: MainNavLink[] = [
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/simulation", label: "Simulation", icon: Zap },
  { href: "/", label: "Menu", icon: LayoutGrid },
  { href: "/effectif", label: "Effectif", icon: Users },
  { href: "/fan-zone", label: "Fan Zone", icon: MessagesSquare, live: true },
];
