"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Shield } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { NavProgress } from "@/src/components/layout/NavProgress";
import { MAIN_NAV_LINKS } from "@/src/lib/navigation";
import { cn } from "@/src/lib/ui/cn";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { signInAsAdminDemoAction } from "@/src/app/actions/auth";

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const { isAdmin, signOut } = useAuth();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

  const activePath = pendingHref ?? pathname;

  return (
    <header className="mb-8 md:mb-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          prefetch
          onClick={() => setPendingHref("/")}
          className="pressable group flex shrink-0 items-center gap-4"
          aria-label="OM Analytics — accueil"
        >
          <NavProgress />
          <div className="relative">
            <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-cyan-500/40 to-blue-600/40 opacity-70 blur-md transition-opacity group-hover:opacity-100" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 font-black font-tech text-lg text-slate-950 shadow-lg shadow-cyan-500/30 ring-1 ring-white/20">
              OM
            </span>
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="text-2xl font-black font-tech tracking-tight md:text-3xl">
              <span className="text-gradient">OM</span>{" "}
              <span className="text-white">ANALYTICS</span>
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500 md:text-xs">
              Simulation &amp; data intelligence
            </p>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md lg:flex"
          aria-label="Navigation principale"
        >
          {MAIN_NAV_LINKS.map(({ href, label, icon: Icon, live }) => {
            const active = isNavActive(activePath, href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                onClick={() => setPendingHref(href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
                  active
                    ? "border border-cyan-400/25 bg-cyan-500/15 text-white shadow-sm shadow-cyan-500/10"
                    : "text-slate-300 hover:bg-white/8 hover:text-white",
                )}
              >
                <NavProgress />
                <Icon size={15} className={active ? "text-cyan-300" : "text-cyan-400"} />
                {label}
                {live && (
                  <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Shield size={12} className="text-amber-400" />
              <span>Admin</span>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
                className="ml-1 text-[10px] text-slate-400 hover:text-white underline"
                title="Se déconnecter"
              >
                (Quitter)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await signInAsAdminDemoAction();
                window.location.reload();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
              title="Activer le mode Admin pour tester l'édition des compos et des textes IA"
            >
              <Shield size={12} className="text-amber-400" />
              <span>Accès Admin</span>
            </button>
          )}

          <Badge variant="om" className="hidden sm:inline-flex">
            <Sparkles size={10} />
            Saison 2025/26
          </Badge>
          <ThemeToggle />
        </div>
      </div>

      <nav
        className="mt-3 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md lg:hidden"
        aria-label="Navigation principale"
      >
        {MAIN_NAV_LINKS.map(({ href, label, icon: Icon, live }) => {
          const active = isNavActive(activePath, href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => setPendingHref(href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pressable flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm",
                active
                  ? "border border-cyan-400/25 bg-cyan-500/15 text-white"
                  : "text-slate-300 hover:bg-white/8 hover:text-white",
              )}
            >
              <NavProgress />
              <Icon size={14} className={active ? "text-cyan-300" : "text-cyan-400"} />
              {label}
              {live && (
                <span className="rounded-full bg-violet-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-violet-300">
                  Live
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
    </header>
  );
}
