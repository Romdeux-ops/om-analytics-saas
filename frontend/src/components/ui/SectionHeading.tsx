import { cn } from "@/src/lib/ui/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  icon,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-5", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white font-tech">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
