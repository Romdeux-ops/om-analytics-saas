"use client";

import { useRef } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/src/lib/ui/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const switchTimer = useRef<number | null>(null);

  // La classe posée sur <html> par next-themes est la source de vérité :
  // fiable même avant l'hydratation (contrairement à `resolvedTheme`).
  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
    switchTimer.current = window.setTimeout(() => {
      root.classList.remove("theme-switching");
      switchTimer.current = null;
    }, 400);
    const isDark = root.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Basculer entre le mode jour et le mode nocturne"
      title="Jour / Nocturne"
      className={cn(
        "pressable label inline-flex h-9 cursor-pointer items-center border border-ink px-3 hover:bg-ink hover:text-paper",
        className,
      )}
    >
      {/* Les deux libellés sont rendus ; la visibilité est pilotée par la classe
          de thème sur <html> (voir globals.css), ce qui évite tout mismatch SSR. */}
      <span className="theme-icon-moon">Nocturne</span>
      <span className="theme-icon-sun">Jour</span>
    </button>
  );
}
