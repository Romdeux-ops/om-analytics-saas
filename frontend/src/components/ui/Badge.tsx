import { cn } from "@/src/lib/ui/cn";

type BadgeVariant = "default" | "om" | "gold" | "live" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/8 text-slate-200 border-white/10",
  om: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30 shadow-[0_0_18px_-6px_rgba(34,211,238,0.6)]",
  gold: "bg-amber-500/15 text-amber-200 border-amber-400/30 shadow-[0_0_18px_-6px_rgba(251,191,36,0.55)]",
  live: "bg-red-500/15 text-red-200 border-red-400/30",
  muted: "bg-white/[0.04] text-slate-400 border-white/10",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
