import { FixtureRow } from "@/src/components/calendrier/FixtureRow";
import type { CalendarFixture } from "@/src/lib/types/fixture";

const PARIS_TZ = "Europe/Paris";

function monthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: PARIS_TZ,
  }).format(date);
}

function groupByMonth(fixtures: readonly CalendarFixture[]): Map<string, CalendarFixture[]> {
  const groups = new Map<string, CalendarFixture[]>();
  for (const fixture of fixtures) {
    const key = monthKey(fixture.date);
    const list = groups.get(key) ?? [];
    list.push(fixture);
    groups.set(key, list);
  }
  return groups;
}

interface FixtureListProps {
  fixtures: readonly CalendarFixture[];
  /** Titre affiché en tête (ex. "Ligue 1", "Calendrier général") */
  title?: string;
  season?: string;
  /** Affiche le badge de compétition sur chaque ligne */
  showCompetition?: boolean;
  /** Note d'information optionnelle (ex. tirages à venir) */
  note?: string;
}

export function FixtureList({
  fixtures,
  title = "Ligue 1",
  season = "2026-2027",
  showCompetition = false,
  note,
}: FixtureListProps) {
  const groups = groupByMonth(fixtures);

  return (
    <section className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-4xl text-ink md:text-6xl">
          {title} <span className="text-accent-text">{season}</span>
        </h2>
        <span className="label border border-ink bg-ink px-2 py-1 text-paper">{fixtures.length} matchs</span>
      </div>

      {note && <p className="editorial mb-8 max-w-2xl text-xl leading-snug text-ink/70">{note}</p>}

      <div className="space-y-10">
        {Array.from(groups.entries()).map(([month, monthFixtures]) => (
          <section
            key={month}
            aria-labelledby={`month-${month}`}
            className="grid gap-3 md:grid-cols-[9rem_1fr] md:gap-6"
          >
            <h3
              id={`month-${month}`}
              className="display border-t-[6px] border-ink pt-2 text-3xl capitalize text-ink md:sticky md:top-4 md:self-start"
            >
              {month}
            </h3>
            <ul className="space-y-2">
              {monthFixtures.map((fixture) => (
                <li key={`${fixture.competition}-${fixture.matchday}-${fixture.date}`}>
                  <FixtureRow fixture={fixture} showCompetition={showCompetition} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="label mt-10 border-t border-ink pt-3 text-ink/50">
        {fixtures.length} rencontres · Données officielles
      </p>
    </section>
  );
}
