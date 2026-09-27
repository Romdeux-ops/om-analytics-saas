import type {
  FootballCompetitionId,
  NewsItemRecord,
  SnapshotFixture,
  SnapshotStanding,
} from "@om/db";

const OM = "Marseille";
const SOURCE = "OM Analytics";
const PARIS_TZ = "Europe/Paris";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Un résultat reste à la une une semaine ; un avant-match apparaît 4 jours avant. */
const RESULT_WINDOW = 7 * DAY;
const PREVIEW_WINDOW = 4 * DAY;
const MATCH_DURATION = 2 * HOUR;

const COMPETITION_LABELS: Record<FootballCompetitionId, string> = {
  ligue1: "Ligue 1",
  europa: "Europa League",
  coupe: "Coupe de France",
};

export interface CompetitionData {
  fixtures: SnapshotFixture[];
  standings: SnapshotStanding[];
}

const ordinal = (rank: number) => (rank === 1 ? "1er" : `${rank}e`);

function roundLabel(fixture: SnapshotFixture): string {
  const label = COMPETITION_LABELS[fixture.competition];
  return fixture.competition === "coupe" ? label : `${label}, J${fixture.matchday}`;
}

function standingOf(standings: SnapshotStanding[], club: string) {
  return standings.find((row) => row.clubName === club);
}

function parisDayKey(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: PARIS_TZ }).format(date);
}

function kickoffLabel(fixture: SnapshotFixture, now: Date): string {
  const kickoff = new Date(fixture.date);
  const daysAway = Math.round(
    (new Date(parisDayKey(kickoff)).getTime() - new Date(parisDayKey(now)).getTime()) / DAY,
  );
  const day =
    daysAway === 0
      ? "aujourd'hui"
      : daysAway === 1
        ? "demain"
        : new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: PARIS_TZ }).format(kickoff);
  if (fixture.timeTbd) return `${day} (horaire à confirmer)`;
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS_TZ })
    .format(kickoff)
    .replace(":", "h");
  return `${day} à ${time}`;
}

function resultItem(fixture: SnapshotFixture, standings: SnapshotStanding[]): NewsItemRecord {
  const isHome = fixture.homeTeam === OM;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const omGoals = (isHome ? fixture.homeScore : fixture.awayScore) ?? 0;
  const oppGoals = (isHome ? fixture.awayScore : fixture.homeScore) ?? 0;
  const verdict = omGoals > oppGoals ? "Victoire" : omGoals < oppGoals ? "Défaite" : "Match nul";
  const venue = isHome ? "face à" : "sur la pelouse de";

  const om = standingOf(standings, OM);
  const table = om
    ? fixture.competition === "ligue1"
      ? ` L'OM est désormais ${ordinal(om.rank)} avec ${om.points} point${om.points > 1 ? "s" : ""}.`
      : ` L'OM pointe au ${ordinal(om.rank)} rang de la phase de ligue avec ${om.points} point${om.points > 1 ? "s" : ""}.`
    : "";

  return {
    id: `auto-result-${fixture.competition}-${fixture.date.slice(0, 10)}`,
    kind: "auto",
    title: `${verdict} ${omGoals}-${oppGoals} ${venue} ${opponent}`,
    excerpt: `${roundLabel(fixture)} : ${fixture.homeTeam} ${fixture.homeScore}-${fixture.awayScore} ${fixture.awayTeam}.${table}`,
    url: "/calendrier",
    source: SOURCE,
    category: "match",
    imageUrl: null,
    publishedAt: new Date(new Date(fixture.date).getTime() + MATCH_DURATION).toISOString(),
  };
}

function previewItem(fixture: SnapshotFixture, standings: SnapshotStanding[], now: Date): NewsItemRecord {
  const isHome = fixture.homeTeam === OM;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const om = standingOf(standings, OM);
  const opp = standingOf(standings, opponent);
  const table =
    om && opp
      ? ` ${opponent} est ${ordinal(opp.rank)} (${opp.points} pts), l'OM ${ordinal(om.rank)} (${om.points} pts).`
      : "";
  const kickoff = new Date(fixture.date).getTime();

  return {
    id: `auto-preview-${fixture.competition}-${fixture.date.slice(0, 10)}`,
    kind: "auto",
    title: isHome ? `L'OM reçoit ${opponent} ${kickoffLabel(fixture, now)}` : `L'OM se déplace chez ${opponent} ${kickoffLabel(fixture, now)}`,
    excerpt: `${roundLabel(fixture)}${isHome ? " à l'Orange Vélodrome" : ""}.${table}`,
    url: "/calendrier",
    source: SOURCE,
    category: "match",
    imageUrl: null,
    // Remonte en tête la veille du match, sans jamais être daté dans le futur.
    publishedAt: new Date(Math.min(now.getTime(), kickoff - DAY)).toISOString(),
  };
}

/** Résultats de la semaine + prochain match à venir, écrits à partir des données synchronisées. */
export function buildAutoNews(
  data: Partial<Record<FootballCompetitionId, CompetitionData>>,
  now = new Date(),
): NewsItemRecord[] {
  const items: NewsItemRecord[] = [];
  const upcoming: { fixture: SnapshotFixture; standings: SnapshotStanding[] }[] = [];

  for (const { fixtures, standings } of Object.values(data)) {
    for (const fixture of fixtures) {
      const kickoff = new Date(fixture.date).getTime();
      if (fixture.played && now.getTime() - kickoff <= RESULT_WINDOW) {
        items.push(resultItem(fixture, standings));
      } else if (!fixture.played && kickoff > now.getTime()) {
        upcoming.push({ fixture, standings });
      }
    }
  }

  const next = upcoming.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date))[0];
  if (next && new Date(next.fixture.date).getTime() - now.getTime() <= PREVIEW_WINDOW) {
    items.push(previewItem(next.fixture, next.standings, now));
  }

  return items;
}
