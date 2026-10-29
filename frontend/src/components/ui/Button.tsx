import Link from "next/link";
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
  primary: "stamp border border-ink bg-accent text-on-accent",
  gold: "stamp border border-ink bg-ink text-paper",
  ghost: "border border-ink text-ink hover:bg-ink hover:text-paper",
  outline: "border border-ink text-ink hover:bg-accent hover:text-on-accent",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2.5 text-xs",
  lg: "px-6 py-3.5 text-sm",
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
    "pressable inline-flex cursor-pointer items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-40",
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
      {loading && (
        <span className="inline-block h-3 w-3 animate-spin border-2 border-current border-r-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
