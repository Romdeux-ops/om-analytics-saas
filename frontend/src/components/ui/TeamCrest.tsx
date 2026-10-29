import { cn } from "@/src/lib/ui/cn";
import { teamInitials, isOmTeam } from "@/src/lib/ui/teams";

type CrestSize = "sm" | "md" | "lg";

interface TeamCrestProps {
  name: string;
  size?: CrestSize;
  className?: string;
}

const sizes: Record<CrestSize, string> = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 md:h-20 md:w-20 text-2xl md:text-3xl",
};

/**
 * Monogramme d'un club en pochoir carré : aplat d'accent pour l'OM,
 * contour encre pour les autres clubs.
 */
export function TeamCrest({ name, size = "md", className }: TeamCrestProps) {
  const om = isOmTeam(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "display relative inline-flex shrink-0 items-center justify-center border border-ink leading-none",
        sizes[size],
        om ? "bg-accent text-on-accent" : "bg-paper text-ink",
        className,
      )}
    >
      {teamInitials(name)}
    </span>
  );
}
