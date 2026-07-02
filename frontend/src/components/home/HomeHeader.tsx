import Link from "next/link";
import { CalendarDays, Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";

const navLinks = [
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/classement", label: "Classement", icon: Trophy },
];

export function HomeHeader() {
  return (
    <header className="mb-8 md:mb-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-4" aria-label="OM Analytics — accueil">
          <div className="relative">
            <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-cyan-500/40 to-blue-600/40 blur-md opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 font-black font-tech text-lg text-slate-950 shadow-lg shadow-cyan-500/30 ring-1 ring-white/20">
              OM
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-tech tracking-tight">
              <span className="text-gradient">OM</span>{" "}
              <span className="text-white">ANALYTICS</span>
            </h1>
            <p className="mt-0.5 text-[10px] md:text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
              Simulation &amp; data intelligence
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
            >
              <Icon size={15} className="text-cyan-400" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="om" className="hidden sm:inline-flex">
            <Sparkles size={10} />
            Saison 2025/26
          </Badge>
          <ThemeToggle />
        </div>
      </div>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
    </header>
  );
}
