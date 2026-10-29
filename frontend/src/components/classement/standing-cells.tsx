import { cn } from "@/src/lib/ui/cn";
import type { StandingZone } from "@/src/lib/types/standing";

const HATCH = "bg-[repeating-linear-gradient(135deg,var(--ink)_0_2px,transparent_2px_5px)]";

/**
 * Les zones ne sont pas codées par couleur : une barre verticale en marge
 * (pleine, grisée, hachurée) et un libellé en toutes lettres.
 */
export const ZONE_META: Record<StandingZone, { bar: string; label: string }> = {
  "champions-league": { bar: "bg-ink", label: "Ligue des Champions" },
  "europa-league": { bar: "bg-ink/55", label: "Europa League" },
  "conference-league": { bar: "bg-ink/25", label: "Conference League" },
  relegation: { bar: HATCH, label: "Relégation" },
  "playoffs-direct": { bar: "bg-ink", label: "Qualifié direct (8es)" },
  "playoffs-qualifiers": { bar: "bg-ink/40", label: "Barrages" },
};

export function ZoneBar({ zone, className }: { zone?: StandingZone; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block w-1.5 self-stretch", zone ? ZONE_META[zone].bar : "bg-transparent", className)}
    />
  );
}

export function RankBadge({ rank }: { rank: number; isOm?: boolean; zone?: StandingZone }) {
  return (
    <span className="display text-right text-2xl leading-none tabular">{rank}</span>
  );
}

export function TeamCell({
  isOm,
  label,
}: {
  clubName: string;
  isOm: boolean;
  label: string;
}) {
  return (
    <span className={cn("truncate text-[13px] uppercase", isOm ? "font-bold" : "font-medium")}>
      {label}
    </span>
  );
}

export function DiffCell({ diff, className }: { diff: number; className?: string }) {
  return (
    <span className={cn("text-center text-xs tabular", diff < 0 && "opacity-60", className)}>
      {diff > 0 ? `+${diff}` : diff}
    </span>
  );
}

export function PointsCell({
  points,
  className,
}: {
  points: number;
  isOm?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("display text-right text-2xl leading-none tabular", className)}>
      {points}
    </span>
  );
}
