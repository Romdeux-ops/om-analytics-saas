import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { cn } from "@/src/lib/ui/cn";

export function rankClasses(rank: number, isOm: boolean) {
  if (isOm) return "bg-cyan-500/20 text-cyan-200 border-cyan-400/40";
  if (rank === 1) return "bg-amber-400/20 text-amber-200 border-amber-300/40";
  if (rank <= 3) return "bg-white/10 text-slate-200 border-white/15";
  return "bg-white/[0.03] text-slate-400 border-white/10";
}

export function RankBadge({ rank, isOm }: { rank: number; isOm: boolean }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg border font-tech text-xs font-bold tabular-nums",
        rankClasses(rank, isOm),
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
