"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/src/lib/ui/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  // La classe posée sur <html> par next-themes est la source de vérité :
  // fiable même avant l'hydratation (contrairement à `resolvedTheme`).
  const toggle = () => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Basculer entre le thème clair et sombre"
      title="Changer de thème"
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-amber-300/25 to-cyan-300/25 opacity-0 blur-sm transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      {/* Les deux icônes sont rendues ; la visibilité est pilotée par la classe
          de thème sur <html> (voir globals.css), ce qui évite tout mismatch SSR. */}
      <Sun size={16} className="theme-icon-sun relative text-amber-300" aria-hidden="true" />
      <Moon size={16} className="theme-icon-moon relative text-slate-700" aria-hidden="true" />
    </button>
  );
}
