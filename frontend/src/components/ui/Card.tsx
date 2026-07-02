import Link from "next/link";
import { cn } from "@/src/lib/ui/cn";

type CardVariant = "default" | "hero" | "flat";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: CardVariant;
  /** Applique le padding interne standard (désactiver pour un contrôle manuel). */
  padded?: boolean;
}

const variants: Record<CardVariant, string> = {
  default: "bento-card",
  hero: "bento-card glow-border",
  flat: "rounded-[var(--radius-card)] border border-white/5 bg-white/[0.02]",
};

export function Card({
  children,
  className,
  href,
  onClick,
  variant = "default",
  padded = true,
}: CardProps) {
  const interactive = Boolean(href || onClick);
  const classes = cn(
    variants[variant],
    padded && "p-5 md:p-6",
    "transition-all duration-300",
    interactive &&
      "cursor-pointer group hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-[var(--shadow-glow)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, "text-left w-full")}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}
