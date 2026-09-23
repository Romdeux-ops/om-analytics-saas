import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { cn } from "@/src/lib/ui/cn";
import type { StandingZone } from "@/src/lib/types/standing";

/** Palette + libellé par zone de qualification/relégation. */
export const ZONE_META: Record<StandingZone, { badge: string; dot: string; label: string }> = {
  "champions-league": {
    badge: "bg-sky-400/20 text-sky-200 border-sky-300/40",
    dot: "bg-sky-400",
    label: "Ligue des Champions",
  },
  "europa-league": {
    badge: "bg-orange-400/20 text-orange-200 border-orange-300/40",
    dot: "bg-orange-400",
    label: "Europa League",
  },
  "conference-league": {
    badge: "bg-teal-400/20 text-teal-200 border-teal-300/40",
    dot: "bg-teal-400",
    label: "Conference League",
  },
  relegation: {
    badge: "bg-red-500/20 text-red-300 border-red-400/40",
    dot: "bg-red-400",
    label: "Relégation",
  },
  "playoffs-direct": {
    badge: "bg-emerald-400/20 text-emerald-200 border-emerald-300/40",
    dot: "bg-emerald-400",
    label: "Qualifié direct (8es)",
  },
  "playoffs-qualifiers": {
    badge: "bg-amber-400/20 text-amber-200 border-amber-300/40",
    dot: "bg-amber-400",
    label: "Barrages",
  },
};

export function rankClasses(rank: number, isOm: boolean, zone?: StandingZone) {
  if (zone) return ZONE_META[zone].badge;
  if (isOm) return "bg-cyan-500/20 text-cyan-200 border-cyan-400/40";
  if (rank === 1) return "bg-amber-400/20 text-amber-200 border-amber-300/40";
  if (rank <= 3) return "bg-white/10 text-slate-200 border-white/15";
  return "bg-white/[0.03] text-slate-400 border-white/10";
}

export function RankBadge({
  rank,
  isOm,
  zone,
}: {
  rank: number;
  isOm: boolean;
  zone?: StandingZone;
}) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg border font-tech text-xs font-bold tabular-nums",
        rankClasses(rank, isOm, zone),
      )}
    >
      {rank}
    </span>
  );
}

export function TeamCell({
  clubName,
  isOm,
  label,
}: {
  clubName: string;
  isOm: boolean;
  label: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <TeamCrest name={clubName} size="sm" />
      <span
        className={cn(
          "truncate text-sm",
          isOm ? "font-bold text-white" : "font-medium text-slate-300",
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function DiffCell({ diff, className }: { diff: number; className?: string }) {
  return (
    <span
      className={cn(
        "text-center text-xs font-medium tabular-nums",
        diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-500",
        className,
      )}
    >
      {diff > 0 ? `+${diff}` : diff}
    </span>
  );
}

export function PointsCell({
  points,
  isOm,
  className,
}: {
  points: number;
  isOm: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-lg px-2 py-1 text-right font-tech text-base font-black tabular-nums",
        isOm ? "bg-cyan-500/15 text-cyan-200" : "text-white",
        className,
      )}
    >
      {points}
    </span>
  );
}
