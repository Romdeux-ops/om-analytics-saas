import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/ui/cn";

type ButtonVariant = "primary" | "gold" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Conserve le libellé et affiche un indicateur, désactive le contrôle. */
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  "aria-label"?: string;
  "aria-busy"?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "text-slate-950 font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:brightness-110",
  gold:
    "text-slate-950 font-bold bg-gradient-to-r from-amber-300 to-amber-500 shadow-lg shadow-amber-500/25 hover:brightness-110",
  ghost:
    "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:text-white",
  outline:
    "bg-cyan-500/5 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/15 hover:border-cyan-300/60",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-sm rounded-xl",
};

export function Button({
  children,
  className,
  href,
  variant = "primary",
  size = "md",
  disabled,
  loading = false,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = cn(
    "pressable inline-flex cursor-pointer items-center justify-center gap-2 font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50",
    sizes[size],
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} prefetch className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
