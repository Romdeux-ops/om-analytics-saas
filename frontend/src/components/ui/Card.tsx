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
  flat: "border-t border-ink",
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
    padded && (variant === "flat" ? "pt-4" : "p-5 md:p-6"),
    interactive && "bento-interactive cursor-pointer group",
    className,
  );

  if (href) {
    return (
      <Link href={href} prefetch className={classes}>
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
