import { ResultMark, type ResultLetter } from "@/src/components/ui/ResultMark";
import { getCompetition } from "@/src/lib/data/competitions";
import type { CalendarFixture } from "@/src/lib/types/fixture";
import { cn } from "@/src/lib/ui/cn";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function dateParts(fixture: CalendarFixture) {
  const date = new Date(fixture.date);
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: PARIS_TZ }).format(date);
  return {
    day: part({ day: "2-digit" }),
    month: part({ month: "short" }).replace(".", ""),
    weekday: part({ weekday: "short" }).replace(".", ""),
    time: fixture.timeTbd ? "--:--" : part({ hour: "2-digit", minute: "2-digit" }),
  };
}

/** Résultat du match du point de vue de l'OM, ou null si non joué / OM absent. */
function getOmResult(fixture: CalendarFixture): ResultLetter | null {
  if (!fixture.played || fixture.homeScore == null || fixture.awayScore == null) return null;
  const homeOm = isOmTeam(fixture.homeTeam);
  const awayOm = isOmTeam(fixture.awayTeam);
  if (!homeOm && !awayOm) return null;
  if (fixture.homeScore === fixture.awayScore) return "N";
  const omWon = homeOm
    ? fixture.homeScore > fixture.awayScore
    : fixture.awayScore > fixture.homeScore;
  return omWon ? "V" : "D";
}

interface FixtureRowProps {
  fixture: CalendarFixture;
  /** Affiche un badge de compétition (utile dans le calendrier général) */
  showCompetition?: boolean;
}

/** Une rencontre = un billet : talon daté, affiche, contremarque du résultat. */
export function FixtureRow({ fixture, showCompetition = false }: FixtureRowProps) {
  const homeOm = isOmTeam(fixture.homeTeam);
  const awayOm = isOmTeam(fixture.awayTeam);
  const result = getOmResult(fixture);
  const { day, month, weekday, time } = dateParts(fixture);

  return (
    <div
      className={cn(
        "grid grid-cols-[4.5rem_1fr] border border-ink transition-colors duration-100 hover:bg-paper-2 sm:grid-cols-[5.5rem_1fr_8.5rem]",
        fixture.played && "text-ink/80",
      )}
    >
      {/* Talon daté */}
      <div className="flex flex-col justify-center border-r border-dashed border-ink px-2 py-3 text-center">
        <span className="display text-4xl leading-none tabular">{day}</span>
        <span className="label mt-1">{month}</span>
        <span className="mt-0.5 text-[10px] uppercase tabular text-ink/60">
          {weekday} {time}
        </span>
      </div>

      {/* Affiche */}
      <div className="flex min-w-0 flex-col justify-center gap-1 px-3 py-3 sm:px-5">
        <p className="label text-ink/50">
          {showCompetition
            ? `${getCompetition(fixture.competition).label}${fixture.matchday ? ` · J${fixture.matchday}` : ""}`
            : `Journée ${fixture.matchday}`}
          {homeOm ? " · Vélodrome" : " · Déplacement"}
        </p>
        <p className="display flex min-w-0 items-baseline gap-3 text-3xl md:text-4xl">
          <TeamName name={fixture.homeTeam} isOm={homeOm} />
          {fixture.played ? (
            <span className="shrink-0 tabular">
              {fixture.homeScore ?? 0}
              <span className="text-ink/35">–</span>
              {fixture.awayScore ?? 0}
            </span>
          ) : (
            <span className="editorial shrink-0 text-lg normal-case text-ink/50">contre</span>
          )}
          <TeamName name={fixture.awayTeam} isOm={awayOm} />
        </p>
      </div>

      {/* Contremarque */}
      <div className="col-span-2 flex items-center justify-between gap-2 border-t border-dashed border-ink px-3 py-2 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:py-3">
        {result ? (
          <ResultMark result={result} />
        ) : (
          <span className="label border border-ink px-1.5 py-0.5">À venir</span>
        )}
        <span className="flex items-center gap-2">
          {fixture.played && fixture.isSimulated && <span className="label text-accent-text">Simulé</span>}
          {fixture.timeTbd && !fixture.played && <span className="label text-ink/50">Horaire TBD</span>}
        </span>
      </div>
    </div>
  );
}

function TeamName({ name, isOm }: { name: string; isOm: boolean }) {
  return (
    <span className={cn("truncate", isOm ? "text-accent-text" : "text-current")}>
      {shortTeamName(name)}
    </span>
  );
}
