import type { CalendarFixture } from "@/src/lib/types/fixture";
import type { CompetitionId } from "@/src/lib/types/competition";

/**
 * Calendrier Ligue 1 2026-2027 — matchs de l'OM (34 journées).
 * Noms normalisés vers competitions.ts (Paris-SG, Lyon, Lille…).
 * Offsets Europe/Paris : CEST (+02:00) puis CET (+01:00) du 25 oct. 2026
 * au 28 mars 2027. Données 100 % statiques (scores/simulation plus tard).
 */
export const OM_LIGUE1_FIXTURES: readonly CalendarFixture[] = [
  { competition: "ligue1", matchday: 1, homeTeam: "Marseille", awayTeam: "Strasbourg", date: "2026-08-22T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 2, homeTeam: "Monaco", awayTeam: "Marseille", date: "2026-08-29T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 3, homeTeam: "Marseille", awayTeam: "Paris FC", date: "2026-09-05T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 4, homeTeam: "Rennes", awayTeam: "Marseille", date: "2026-09-12T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 5, homeTeam: "Marseille", awayTeam: "Paris-SG", date: "2026-09-19T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 6, homeTeam: "Troyes", awayTeam: "Marseille", date: "2026-10-10T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 7, homeTeam: "Angers", awayTeam: "Marseille", date: "2026-10-17T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 8, homeTeam: "Marseille", awayTeam: "Le Havre", date: "2026-10-24T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 9, homeTeam: "Marseille", awayTeam: "Toulouse", date: "2026-10-31T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 10, homeTeam: "Lens", awayTeam: "Marseille", date: "2026-11-07T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 11, homeTeam: "Marseille", awayTeam: "Le Mans", date: "2026-11-21T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 12, homeTeam: "Auxerre", awayTeam: "Marseille", date: "2026-11-28T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 13, homeTeam: "Marseille", awayTeam: "Nice", date: "2026-12-05T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 14, homeTeam: "Lyon", awayTeam: "Marseille", date: "2026-12-12T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 15, homeTeam: "Brest", awayTeam: "Marseille", date: "2027-01-02T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 16, homeTeam: "Marseille", awayTeam: "Lille", date: "2027-01-16T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 17, homeTeam: "Lorient", awayTeam: "Marseille", date: "2027-01-23T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 18, homeTeam: "Marseille", awayTeam: "Troyes", date: "2027-01-30T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 19, homeTeam: "Paris-SG", awayTeam: "Marseille", date: "2027-02-06T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 20, homeTeam: "Angers", awayTeam: "Marseille", date: "2027-02-13T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 21, homeTeam: "Strasbourg", awayTeam: "Marseille", date: "2027-02-20T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 22, homeTeam: "Rennes", awayTeam: "Marseille", date: "2027-02-27T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 23, homeTeam: "Lille", awayTeam: "Marseille", date: "2027-03-06T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 24, homeTeam: "Marseille", awayTeam: "Monaco", date: "2027-03-13T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 25, homeTeam: "Marseille", awayTeam: "Lyon", date: "2027-03-20T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 26, homeTeam: "Le Mans", awayTeam: "Marseille", date: "2027-04-03T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 27, homeTeam: "Marseille", awayTeam: "Brest", date: "2027-04-10T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 28, homeTeam: "Le Havre", awayTeam: "Marseille", date: "2027-04-17T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 29, homeTeam: "Marseille", awayTeam: "Auxerre", date: "2027-04-24T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 30, homeTeam: "Toulouse", awayTeam: "Marseille", date: "2027-05-01T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 31, homeTeam: "Nice", awayTeam: "Marseille", date: "2027-05-08T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 32, homeTeam: "Lens", awayTeam: "Marseille", date: "2027-05-16T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 33, homeTeam: "Paris FC", awayTeam: "Marseille", date: "2027-05-22T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 34, homeTeam: "Marseille", awayTeam: "Lorient", date: "2027-05-29T12:00:00+02:00", timeTbd: true, played: false },
];

/** Europa League : phase de ligue tirée le 28 août 2026 — fixtures à venir. */
export const OM_EUROPA_FIXTURES: readonly CalendarFixture[] = [];

/** Coupe de France : tirage à venir — fixtures ultérieures. */
export const OM_COUPE_FIXTURES: readonly CalendarFixture[] = [];

const FIXTURES_BY_COMPETITION: Record<CompetitionId, readonly CalendarFixture[]> = {
  ligue1: OM_LIGUE1_FIXTURES,
  europa: OM_EUROPA_FIXTURES,
  coupe: OM_COUPE_FIXTURES,
};

function byDate(a: CalendarFixture, b: CalendarFixture): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

/** Matchs d'une compétition (par défaut Ligue 1), triés par date. */
export function getOmFixtures(competition: CompetitionId = "ligue1"): readonly CalendarFixture[] {
  return [...FIXTURES_BY_COMPETITION[competition]].sort(byDate);
}

/** Calendrier général : toutes compétitions fusionnées et triées par date. */
export function getAllOmFixtures(): readonly CalendarFixture[] {
  return [
    ...OM_LIGUE1_FIXTURES,
    ...OM_EUROPA_FIXTURES,
    ...OM_COUPE_FIXTURES,
  ].sort(byDate);
}

/** Premier match non joué, toutes compétitions confondues, trié par date. */
export function getNextOmFixture(): CalendarFixture | null {
  return getAllOmFixtures().find((f) => !f.played) ?? null;
}
