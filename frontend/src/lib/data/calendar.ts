import type { CalendarFixture } from "@/src/lib/types/fixture";
import type { CompetitionId } from "@/src/lib/types/competition";
import { getFootballSnapshot } from "@/src/lib/data/football";

/**
 * Calendrier Ligue 1 2026-2027 — matchs de l'OM (34 journées).
 * Noms normalisés vers competitions.ts (Paris-SG, Lyon, Lille…).
 * Offsets Europe/Paris : CEST (+02:00) puis CET (+01:00) du 25 oct. 2026
 * au 28 mars 2027. Les données synchronisées (table football_snapshots,
 * `bun run football:sync`) priment ; ces tableaux servent de repli.
 */
export const OM_LIGUE1_FIXTURES: readonly CalendarFixture[] = [
  { competition: "ligue1", matchday: 1, homeTeam: "Marseille", awayTeam: "Strasbourg", date: "2026-08-21T20:45:00+02:00", timeTbd: false, played: true, homeScore: 4, awayScore: 0 },
  { competition: "ligue1", matchday: 2, homeTeam: "Monaco", awayTeam: "Marseille", date: "2026-08-30T20:45:00+02:00", timeTbd: false, played: true, homeScore: 2, awayScore: 0 },
  { competition: "ligue1", matchday: 3, homeTeam: "Marseille", awayTeam: "Paris FC", date: "2026-09-06T20:45:00+02:00", timeTbd: false, played: true, homeScore: 2, awayScore: 3 },
  { competition: "ligue1", matchday: 4, homeTeam: "Rennes", awayTeam: "Marseille", date: "2026-09-11T20:45:00+02:00", timeTbd: false, played: true, homeScore: 1, awayScore: 0 },
  { competition: "ligue1", matchday: 5, homeTeam: "Marseille", awayTeam: "Paris-SG", date: "2026-09-20T20:45:00+02:00", timeTbd: false, played: true, homeScore: 1, awayScore: 2 },
  { competition: "ligue1", matchday: 6, homeTeam: "Troyes", awayTeam: "Marseille", date: "2026-10-11T20:45:00+02:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 7, homeTeam: "Angers", awayTeam: "Marseille", date: "2026-10-18T15:00:00+02:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 8, homeTeam: "Marseille", awayTeam: "Le Havre", date: "2026-10-25T17:15:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 9, homeTeam: "Marseille", awayTeam: "Toulouse", date: "2026-11-01T20:45:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 10, homeTeam: "Lens", awayTeam: "Marseille", date: "2026-11-08T20:45:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 11, homeTeam: "Marseille", awayTeam: "Le Mans", date: "2026-11-22T20:45:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 12, homeTeam: "Auxerre", awayTeam: "Marseille", date: "2026-11-29T15:00:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 13, homeTeam: "Marseille", awayTeam: "Nice", date: "2026-12-05T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 14, homeTeam: "Lyon", awayTeam: "Marseille", date: "2026-12-13T20:45:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 15, homeTeam: "Brest", awayTeam: "Marseille", date: "2027-01-02T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 16, homeTeam: "Marseille", awayTeam: "Lille", date: "2027-01-16T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 17, homeTeam: "Lorient", awayTeam: "Marseille", date: "2027-01-23T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 18, homeTeam: "Marseille", awayTeam: "Troyes", date: "2027-01-30T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 19, homeTeam: "Paris-SG", awayTeam: "Marseille", date: "2027-02-07T20:45:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 20, homeTeam: "Marseille", awayTeam: "Angers", date: "2027-02-13T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 21, homeTeam: "Strasbourg", awayTeam: "Marseille", date: "2027-02-20T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 22, homeTeam: "Marseille", awayTeam: "Rennes", date: "2027-02-27T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 23, homeTeam: "Lille", awayTeam: "Marseille", date: "2027-03-06T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 24, homeTeam: "Marseille", awayTeam: "Monaco", date: "2027-03-13T12:00:00+01:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 25, homeTeam: "Marseille", awayTeam: "Lyon", date: "2027-03-21T20:45:00+01:00", timeTbd: false, played: false },
  { competition: "ligue1", matchday: 26, homeTeam: "Le Mans", awayTeam: "Marseille", date: "2027-04-03T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 27, homeTeam: "Marseille", awayTeam: "Brest", date: "2027-04-10T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 28, homeTeam: "Le Havre", awayTeam: "Marseille", date: "2027-04-17T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 29, homeTeam: "Marseille", awayTeam: "Auxerre", date: "2027-04-24T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 30, homeTeam: "Toulouse", awayTeam: "Marseille", date: "2027-05-01T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 31, homeTeam: "Nice", awayTeam: "Marseille", date: "2027-05-08T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 32, homeTeam: "Marseille", awayTeam: "Lens", date: "2027-05-16T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 33, homeTeam: "Paris FC", awayTeam: "Marseille", date: "2027-05-22T12:00:00+02:00", timeTbd: true, played: false },
  { competition: "ligue1", matchday: 34, homeTeam: "Marseille", awayTeam: "Lorient", date: "2027-05-29T12:00:00+02:00", timeTbd: true, played: false },
];

/** Europa League : phase de ligue tirée le 28 août 2026 (8 journées, nouveau format UEFA). */
export const OM_EUROPA_FIXTURES: readonly CalendarFixture[] = [
  { competition: "europa", matchday: 1, homeTeam: "Beşiktaş", awayTeam: "Marseille", date: "2026-09-17T21:00:00+02:00", timeTbd: false, played: true, homeScore: 4, awayScore: 1 },
  { competition: "europa", matchday: 2, homeTeam: "Marseille", awayTeam: "Olympiacos", date: "2026-10-15T21:00:00+02:00", timeTbd: false, played: false },
  { competition: "europa", matchday: 3, homeTeam: "Sturm Graz", awayTeam: "Marseille", date: "2026-10-22T18:45:00+02:00", timeTbd: false, played: false },
  { competition: "europa", matchday: 4, homeTeam: "Leverkusen", awayTeam: "Marseille", date: "2026-11-05T21:00:00+01:00", timeTbd: false, played: false },
  { competition: "europa", matchday: 5, homeTeam: "Marseille", awayTeam: "Levski Sofia", date: "2026-11-26T18:45:00+01:00", timeTbd: false, played: false },
  { competition: "europa", matchday: 6, homeTeam: "Marseille", awayTeam: "Celta", date: "2026-12-10T18:45:00+01:00", timeTbd: false, played: false },
  { competition: "europa", matchday: 7, homeTeam: "Celtic", awayTeam: "Marseille", date: "2027-01-21T21:00:00+01:00", timeTbd: false, played: false },
  { competition: "europa", matchday: 8, homeTeam: "Marseille", awayTeam: "Anderlecht", date: "2027-01-28T21:00:00+01:00", timeTbd: false, played: false },
];

/** Coupe de France : tirage à venir — fixtures ultérieures. */
export const OM_COUPE_FIXTURES: readonly CalendarFixture[] = [];

const FIXTURES_BY_COMPETITION: Record<CompetitionId, readonly CalendarFixture[]> = {
  ligue1: OM_LIGUE1_FIXTURES,
  europa: OM_EUROPA_FIXTURES,
  coupe: OM_COUPE_FIXTURES,
};

const COMPETITION_IDS = Object.keys(FIXTURES_BY_COMPETITION) as CompetitionId[];

function byDate(a: CalendarFixture, b: CalendarFixture): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

async function fixturesFor(competition: CompetitionId): Promise<readonly CalendarFixture[]> {
  const snapshot = await getFootballSnapshot(competition);
  return snapshot && snapshot.fixtures.length > 0
    ? snapshot.fixtures
    : FIXTURES_BY_COMPETITION[competition];
}

/** Matchs d'une compétition (par défaut Ligue 1), triés par date. */
export async function getOmFixtures(
  competition: CompetitionId = "ligue1",
): Promise<readonly CalendarFixture[]> {
  return [...(await fixturesFor(competition))].sort(byDate);
}

/** Calendrier général : toutes compétitions fusionnées et triées par date. */
export async function getAllOmFixtures(): Promise<readonly CalendarFixture[]> {
  const lists = await Promise.all(COMPETITION_IDS.map(fixturesFor));
  return lists.flat().sort(byDate);
}

/** Premier match non joué, toutes compétitions confondues, trié par date. */
export async function getNextOmFixture(): Promise<CalendarFixture | null> {
  return (await getAllOmFixtures()).find((f) => !f.played) ?? null;
}
