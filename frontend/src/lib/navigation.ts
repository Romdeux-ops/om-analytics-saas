export interface MainNavLink {
  href: string;
  label: string;
  live?: boolean;
}

export const MAIN_NAV_LINKS: MainNavLink[] = [
  { href: "/", label: "La Une" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/classement", label: "Classement" },
  { href: "/simulation", label: "Simulation" },
  { href: "/effectif", label: "Effectif" },
  { href: "/fan-zone", label: "Fan Zone", live: true },
];
