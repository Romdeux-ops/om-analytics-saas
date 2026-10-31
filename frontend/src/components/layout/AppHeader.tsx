"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { NavProgress } from "@/src/components/layout/NavProgress";
import { MAIN_NAV_LINKS } from "@/src/lib/navigation";
import { cn } from "@/src/lib/ui/cn";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { signInAsAdminDemoAction } from "@/src/app/actions/auth";
import { isAdminDemoEnabled } from "@/src/lib/admin/demo";

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const { user, profile, isAdmin, isLoading, openAuthModal, signOut } = useAuth();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

  const activePath = pendingHref ?? pathname;

  return (
    <header className="mb-10 md:mb-14">
      {/* Manchette */}
      <div className="flex items-end justify-between gap-4">
        <Link
          href="/"
          prefetch
          onClick={() => setPendingHref("/")}
          className="group flex min-w-0 items-end gap-3"
          aria-label="OM Analytics — la Une"
        >
          <NavProgress />
          <span className="display flex h-14 w-14 shrink-0 items-center justify-center border border-ink bg-accent text-4xl text-on-accent transition-transform duration-150 group-hover:-rotate-3 md:h-16 md:w-16 md:text-5xl">
            OM
          </span>
          <span className="min-w-0">
            <span className="display block text-5xl text-ink md:text-7xl">Analytics</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 pb-1">
          {user ? (
            <div className="label flex items-center gap-2 border border-ink bg-ink px-2.5 py-2 text-paper">
              <span className="max-w-[10rem] truncate">{isAdmin ? "Admin" : (profile?.display_name ?? "Supporter")}</span>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
                className="text-paper/60 underline underline-offset-2 hover:text-accent"
                title="Se déconnecter"
              >
                Quitter
              </button>
            </div>
          ) : (
            !isLoading && (
              <>
                {isAdminDemoEnabled() && (
                  <button
                    type="button"
                    onClick={async () => {
                      await signInAsAdminDemoAction();
                      window.location.reload();
                    }}
                    className="pressable label hidden h-9 items-center border border-dashed border-ink px-3 text-ink/60 hover:bg-ink hover:text-paper sm:inline-flex"
                    title="Activer le mode Admin pour tester l'édition des compos et des textes IA"
                  >
                    Accès admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="pressable label inline-flex h-9 items-center border border-ink px-3 text-ink hover:bg-ink hover:text-paper"
                >
                  Se connecter
                </button>
              </>
            )
          )}
          <ThemeToggle />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 border-t-[6px] border-ink pt-1.5">
        <p className="label text-ink/60">Simulation · Données · Virage</p>
        <p className="label hidden text-ink/60 sm:block">Marseille — Droit au but</p>
      </div>

      {/* Sommaire */}
      <nav
        className="no-scrollbar mt-1.5 flex overflow-x-auto border-y border-ink"
        aria-label="Navigation principale"
      >
        {MAIN_NAV_LINKS.map(({ href, label, live }, i) => {
          const active = isNavActive(activePath, href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => setPendingHref(href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex shrink-0 items-baseline gap-2 border-r border-ink px-4 py-3 transition-colors duration-100 last:border-r-0 lg:flex-1",
                active ? "bg-accent text-on-accent" : "text-ink hover:bg-ink hover:text-paper",
              )}
            >
              <NavProgress />
              <span className={cn("text-[10px] font-bold tabular", active ? "text-on-accent" : "text-accent-text group-hover:text-accent")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="display text-xl md:text-2xl">{label}</span>
              {live && <span className="pulse-dot ml-0.5 self-center text-live" aria-label="en direct" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
