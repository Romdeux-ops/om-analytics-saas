import { Badge } from "@/src/components/ui/Badge";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { getCompetition } from "@/src/lib/data/competitions";
import type { CalendarFixture } from "@/src/lib/types/fixture";
import { cn } from "@/src/lib/ui/cn";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function formatFixtureDate(fixture: CalendarFixture): string {
  const date = new Date(fixture.date);
  if (fixture.timeTbd) {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: PARIS_TZ,
    }).format(date);
  }
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

type OmResult = "win" | "draw" | "loss";

/** Résultat du match du point de vue de l'OM, ou null si non joué / OM absent. */
function getOmResult(fixture: CalendarFixture): OmResult | null {
  if (!fixture.played || fixture.homeScore == null || fixture.awayScore == null) return null;
  const homeOm = isOmTeam(fixture.homeTeam);
  const awayOm = isOmTeam(fixture.awayTeam);
  if (!homeOm && !awayOm) return null;
  if (fixture.homeScore === fixture.awayScore) return "draw";
  const omWon = homeOm
    ? fixture.homeScore > fixture.awayScore
    : fixture.awayScore > fixture.homeScore;
  return omWon ? "win" : "loss";
}

const RESULT_STYLES: Record<
  OmResult,
  { row: string; bar: string; score: string; badge: string; label: string }
> = {
  win: {
    row: "border-emerald-400/15 bg-emerald-500/[0.06] hover:border-emerald-400/25 hover:bg-emerald-500/[0.09]",
    bar: "from-emerald-400/0 via-emerald-400/70 to-emerald-400/0",
    score: "text-emerald-300",
    badge: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    label: "Victoire",
  },
  draw: {
    row: "border-slate-400/15 bg-slate-400/[0.05] hover:border-slate-400/25 hover:bg-slate-400/[0.08]",
    bar: "from-slate-400/0 via-slate-400/60 to-slate-400/0",
    score: "text-slate-300",
    badge: "border-slate-400/30 bg-slate-500/15 text-slate-300",
    label: "Nul",
  },
  loss: {
    row: "border-red-400/15 bg-red-500/[0.06] hover:border-red-400/25 hover:bg-red-500/[0.09]",
    bar: "from-red-400/0 via-red-400/70 to-red-400/0",
    score: "text-red-300",
    badge: "border-red-400/30 bg-red-500/15 text-red-300",
    label: "Défaite",
  },
};

interface FixtureRowProps {
  fixture: CalendarFixture;
  /** Affiche un badge de compétition (utile dans le calendrier général) */
  showCompetition?: boolean;
}

export function FixtureRow({ fixture, showCompetition = false }: FixtureRowProps) {
  const homeOm = isOmTeam(fixture.homeTeam);
  const awayOm = isOmTeam(fixture.awayTeam);
  const involvesOm = homeOm || awayOm;
  const result = getOmResult(fixture);
  const style = result ? RESULT_STYLES[result] : null;

  return (
    <div
      className={cn(
        "group/row relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all sm:flex-row sm:items-center sm:gap-4",
        style ? style.row : involvesOm && "om-highlight",
        !involvesOm && !style && "hover:border-white/10 hover:bg-white/[0.04]",
      )}
    >
      {(style || involvesOm) && (
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b",
            style ? style.bar : "from-cyan-400/0 via-cyan-400/60 to-cyan-400/0",
          )}
        />
      )}

      <div className="flex shrink-0 items-center gap-2">
        {showCompetition ? (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-1.5 font-tech text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {getCompetition(fixture.competition).shortLabel}
          </span>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-tech text-xs font-bold tabular-nums text-slate-400">
            J{fixture.matchday}
          </span>
        )}
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 tabular-nums">
          {formatFixtureDate(fixture)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:justify-start">
        <TeamSide name={fixture.homeTeam} isOm={homeOm} align="right" />
        {fixture.played ? (
          <ScoreBlock
            homeScore={fixture.homeScore ?? 0}
            awayScore={fixture.awayScore ?? 0}
            className={style?.score}
          />
        ) : (
          <span className="shrink-0 px-2 font-tech text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            vs
          </span>
        )}
        <TeamSide name={fixture.awayTeam} isOm={awayOm} align="left" />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
        {style && <Badge className={style.badge}>{style.label}</Badge>}
        {fixture.played && fixture.isSimulated ? (
          <Badge variant="muted">Simulé</Badge>
        ) : !fixture.played ? (
          <Badge variant={involvesOm ? "om" : "muted"}>À venir</Badge>
        ) : null}
        {fixture.timeTbd && !fixture.played && (
          <span className="text-[10px] uppercase tracking-wider text-slate-600">Horaire TBD</span>
        )}
      </div>
    </div>
  );
}

function TeamSide({
  name,
  isOm,
  align,
}: {
  name: string;
  isOm: boolean;
  align: "left" | "right";
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" ? "flex-row-reverse text-right sm:flex-1" : "sm:flex-1",
      )}
    >
      <TeamCrest name={name} size="sm" className="shrink-0" />
      <span
        className={cn(
          "truncate text-sm",
          isOm ? "font-bold text-white" : "font-medium text-slate-300",
        )}
      >
        {shortTeamName(name)}
      </span>
    </span>
  );
}

function ScoreBlock({
  homeScore,
  awayScore,
  className,
}: {
  homeScore: number;
  awayScore: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 font-tech text-lg font-black tabular-nums text-white",
        className,
      )}
    >
      <span>{homeScore}</span>
      <span className="text-slate-500">-</span>
      <span>{awayScore}</span>
    </span>
  );
}
