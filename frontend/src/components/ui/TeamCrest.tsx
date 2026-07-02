import { cn } from "@/src/lib/ui/cn";
import { teamInitials, isOmTeam } from "@/src/lib/ui/teams";

type CrestSize = "sm" | "md" | "lg";

interface TeamCrestProps {
  name: string;
  size?: CrestSize;
  className?: string;
}

const sizes: Record<CrestSize, string> = {
  sm: "h-9 w-9 text-[11px] rounded-lg",
  md: "h-12 w-12 text-sm rounded-xl",
  lg: "h-16 w-16 md:h-20 md:w-20 text-lg md:text-xl rounded-2xl",
};

/**
 * Écusson monogramme d'un club. L'OM reçoit un traitement bleu ciel / or,
 * les autres clubs un traitement ardoise neutre.
 */
export function TeamCrest({ name, size = "md", className }: TeamCrestProps) {
  const om = isOmTeam(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex items-center justify-center border font-black font-tech tracking-tight shadow-lg",
        sizes[size],
        om
          ? "border-cyan-300/40 bg-gradient-to-br from-sky-400/25 to-blue-600/25 text-cyan-100 shadow-cyan-500/20"
          : "border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-slate-200 shadow-black/40",
        className,
      )}
    >
      {om && (
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.28),transparent_60%)]" />
      )}
      <span className="relative">{teamInitials(name)}</span>
    </span>
  );
}
