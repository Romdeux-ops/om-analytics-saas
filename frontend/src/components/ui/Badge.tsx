import { cn } from "@/src/lib/ui/cn";

type BadgeVariant = "default" | "om" | "gold" | "live" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "border-ink text-ink",
  om: "border-ink bg-accent text-on-accent",
  gold: "border-ink bg-ink text-paper",
  live: "border-live bg-live text-on-accent",
  muted: "border-ink/25 text-ink/60",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "label inline-flex items-center gap-1.5 border px-2 py-[3px] leading-none",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
