import type { ReactNode } from "react";
import { cn } from "@/src/lib/ui/cn";

type PageAccent = "cyan" | "amber" | "violet" | "gold";

interface PageSectionHeaderProps {
  title: ReactNode;
  subtitle?: string;
  /** Conservé pour compatibilité : le titrage est purement typographique. */
  icon?: ReactNode;
  accent?: PageAccent;
  className?: string;
}

export function PageSectionHeader({ title, subtitle, className }: PageSectionHeaderProps) {
  return (
    <header className={cn("mb-10 md:mb-14", className)}>
      <div className="rule-thick pt-3">
        {subtitle && <p className="label text-ink/60">{subtitle}</p>}
        <h1 className="display -ml-[0.04em] mt-2 text-[clamp(4rem,15vw,13rem)] text-ink">{title}</h1>
      </div>
      <div className="mt-4 rule-thin" />
    </header>
  );
}
