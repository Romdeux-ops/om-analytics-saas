import { CalendarDays, Info } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
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
    <Card className="flex flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-tech text-lg font-black uppercase tracking-tight text-white">
            {title} <span className="text-slate-500">·</span>{" "}
            <span className="text-gradient">{season}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {fixtures.length} matchs · Calendrier Olympique de Marseille
          </p>
        </div>
        <Badge variant="om">
          <CalendarDays size={10} />
          Saison en cours
        </Badge>
      </div>

      {note && (
        <p className="mb-5 flex items-start gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-400">
          <Info size={14} className="mt-0.5 shrink-0 text-cyan-400" />
          {note}
        </p>
      )}

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([month, monthFixtures]) => (
          <section key={month} aria-labelledby={`month-${month}`}>
            <h3
              id={`month-${month}`}
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 capitalize"
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

      <p className="mt-6 border-t border-white/5 pt-4 text-[10px] uppercase tracking-widest text-slate-600">
        {fixtures.length} rencontres · Données officielles
      </p>
    </Card>
  );
}
