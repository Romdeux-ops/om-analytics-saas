import type { ReactNode } from "react";
import { cn } from "@/src/lib/ui/cn";

type PageAccent = "cyan" | "amber" | "violet" | "gold";

interface PageSectionHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon: ReactNode;
  accent?: PageAccent;
  className?: string;
}

const accentStyles: Record<PageAccent, { icon: string; divider: string }> = {
  cyan: {
    icon: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
    divider: "bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent",
  },
  amber: {
    icon: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    divider: "bg-gradient-to-r from-transparent via-amber-400/25 to-transparent",
  },
  violet: {
    icon: "border-violet-400/20 bg-violet-500/10 text-violet-300",
    divider: "bg-gradient-to-r from-transparent via-violet-400/25 to-transparent",
  },
  gold: {
    icon: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    divider: "bg-gradient-to-r from-transparent via-amber-400/25 to-transparent",
  },
};

export function PageSectionHeader({
  title,
  subtitle,
  icon,
  accent = "cyan",
  className,
}: PageSectionHeaderProps) {
  const styles = accentStyles[accent];

  return (
    <header className={cn("mb-8 md:mb-10", className)}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            styles.icon,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h1 className="font-tech text-2xl font-black tracking-tight text-white md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className={cn("mt-6 h-px w-full", styles.divider)} />
    </header>
  );
}
