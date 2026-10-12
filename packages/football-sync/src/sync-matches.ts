import { createDb, clubs, matches, eq, and, type Db } from "@om/db";
import { canonicalTeamName } from "./teams";

export const CLUB_PROFILES: Record<
  string,
  { name: string; reputation: number; coach?: string }
> = {
  Marseille: { name: "Olympique de Marseille", reputation: 85, coach: "Bruno Genesio" },
  "Paris-SG": { name: "Paris Saint-Germain", reputation: 90, coach: "Luis Enrique" },
  Monaco: { name: "AS Monaco", reputation: 82, coach: "Adi Hütter" },
  Lyon: { name: "Olympique Lyonnais", reputation: 81, coach: "Pierre Sage" },
  Lille: { name: "LOSC Lille", reputation: 80, coach: "Bruno Génésio" },
  Lens: { name: "RC Lens", reputation: 78, coach: "Will Still" },
  Nice: { name: "OGC Nice", reputation: 78, coach: "Franck Haise" },
  Rennes: { name: "Stade Rennais", reputation: 77, coach: "Julien Stéphan" },
  Brest: { name: "Stade Brestois", reputation: 76, coach: "Éric Roy" },
  Strasbourg: { name: "RC Strasbourg", reputation: 74, coach: "Liam Rosenior" },
  Toulouse: { name: "Toulouse FC", reputation: 73, coach: "Carles Martinez Novell" },
  Auxerre: { name: "AJ Auxerre", reputation: 72, coach: "Christophe Pélissier" },
  Troyes: { name: "ESTAC Troyes", reputation: 71, coach: "Stéphane Dumont" },
  Angers: { name: "Angers SCO", reputation: 71, coach: "Alexandre Dujeux" },
  "Le Havre": { name: "Le Havre AC", reputation: 71, coach: "Didier Digard" },
  Lorient: { name: "FC Lorient", reputation: 71, coach: "Olivier Pantaloni" },
  "Paris FC": { name: "Paris FC", reputation: 72, coach: "Stéphane Gilli" },
  "Le Mans": { name: "Le Mans FC", reputation: 68, coach: "Patrick Videira" },
  // Europa League
  Leverkusen: { name: "Bayer Leverkusen", reputation: 86, coach: "Xabi Alonso" },
  Olympiacos: { name: "Olympiacos FC", reputation: 77, coach: "José Luis Mendilibar" },
  "Beşiktaş": { name: "Beşiktaş JK", reputation: 76, coach: "Giovanni van Bronckhorst" },
  Celtic: { name: "Celtic FC", reputation: 76, coach: "Brendan Rodgers" },
  Celta: { name: "Celta de Vigo", reputation: 76, coach: "Claudio Giráldez" },
  Anderlecht: { name: "RSC Anderlecht", reputation: 75, coach: "David Hubert" },
  "Sturm Graz": { name: "SK Sturm Graz", reputation: 73, coach: "Christian Ilzer" },
  "Levski Sofia": { name: "PFC Levski Sofia", reputation: 70, coach: "Stanislav Genchev" },
};

export const FIXTURES = [
  // Ligue 1 2026-2027 (J1-J34)
  { competition: "ligue1", matchday: 1, home: "Marseille", away: "Strasbourg", date: "2026-08-21T20:45:00+02:00", played: true, homeScore: 4, awayScore: 0 },
  { competition: "ligue1", matchday: 2, home: "Monaco", away: "Marseille", date: "2026-08-30T20:45:00+02:00", played: true, homeScore: 2, awayScore: 0 },
  { competition: "ligue1", matchday: 3, home: "Marseille", away: "Paris FC", date: "2026-09-06T20:45:00+02:00", played: true, homeScore: 2, awayScore: 3 },
  { competition: "ligue1", matchday: 4, home: "Rennes", away: "Marseille", date: "2026-09-11T20:45:00+02:00", played: true, homeScore: 1, awayScore: 0 },
  { competition: "ligue1", matchday: 5, home: "Marseille", away: "Paris-SG", date: "2026-09-20T20:45:00+02:00", played: true, homeScore: 1, awayScore: 2 },
  { competition: "ligue1", matchday: 6, home: "Troyes", away: "Marseille", date: "2026-10-11T20:45:00+02:00", played: true, homeScore: 0, awayScore: 2 },
  { competition: "ligue1", matchday: 7, home: "Angers", away: "Marseille", date: "2026-10-18T15:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 8, home: "Marseille", away: "Le Havre", date: "2026-10-25T17:15:00+01:00", played: false },
  { competition: "ligue1", matchday: 9, home: "Marseille", away: "Toulouse", date: "2026-11-01T20:45:00+01:00", played: false },
  { competition: "ligue1", matchday: 10, home: "Lens", away: "Marseille", date: "2026-11-08T20:45:00+01:00", played: false },
  { competition: "ligue1", matchday: 11, home: "Marseille", away: "Le Mans", date: "2026-11-22T20:45:00+01:00", played: false },
  { competition: "ligue1", matchday: 12, home: "Auxerre", away: "Marseille", date: "2026-11-29T15:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 13, home: "Marseille", away: "Nice", date: "2026-12-05T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 14, home: "Lyon", away: "Marseille", date: "2026-12-13T20:45:00+01:00", played: false },
  { competition: "ligue1", matchday: 15, home: "Brest", away: "Marseille", date: "2027-01-02T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 16, home: "Marseille", away: "Lille", date: "2027-01-16T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 17, home: "Lorient", away: "Marseille", date: "2027-01-23T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 18, home: "Marseille", away: "Troyes", date: "2027-01-30T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 19, home: "Paris-SG", away: "Marseille", date: "2027-02-07T20:45:00+01:00", played: false },
  { competition: "ligue1", matchday: 20, home: "Marseille", away: "Angers", date: "2027-02-13T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 21, home: "Strasbourg", away: "Marseille", date: "2027-02-20T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 22, home: "Marseille", away: "Rennes", date: "2027-02-27T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 23, home: "Lille", away: "Marseille", date: "2027-03-06T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 24, home: "Marseille", away: "Monaco", date: "2027-03-13T12:00:00+01:00", played: false },
  { competition: "ligue1", matchday: 25, home: "Marseille", away: "Lyon", date: "2027-03-21T20:45:00+01:00", played: false },
  { competition: "ligue1", matchday: 26, home: "Le Mans", away: "Marseille", date: "2027-04-03T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 27, home: "Marseille", away: "Brest", date: "2027-04-10T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 28, home: "Le Havre", away: "Marseille", date: "2027-04-17T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 29, home: "Marseille", away: "Auxerre", date: "2027-04-24T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 30, home: "Toulouse", away: "Marseille", date: "2027-05-01T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 31, home: "Nice", away: "Marseille", date: "2027-05-08T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 32, home: "Marseille", away: "Lens", date: "2027-05-16T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 33, home: "Paris FC", away: "Marseille", date: "2027-05-22T12:00:00+02:00", played: false },
  { competition: "ligue1", matchday: 34, home: "Marseille", away: "Lorient", date: "2027-05-29T12:00:00+02:00", played: false },
  // Europa League
  { competition: "europa", matchday: 1, home: "Beşiktaş", away: "Marseille", date: "2026-09-17T21:00:00+02:00", played: true, homeScore: 4, awayScore: 1 },
  { competition: "europa", matchday: 2, home: "Marseille", away: "Olympiacos", date: "2026-10-15T21:00:00+02:00", played: false },
  { competition: "europa", matchday: 3, home: "Sturm Graz", away: "Marseille", date: "2026-10-22T18:45:00+02:00", played: false },
  { competition: "europa", matchday: 4, home: "Leverkusen", away: "Marseille", date: "2026-11-05T21:00:00+01:00", played: false },
  { competition: "europa", matchday: 5, home: "Marseille", away: "Levski Sofia", date: "2026-11-26T18:45:00+01:00", played: false },
  { competition: "europa", matchday: 6, home: "Marseille", away: "Celta", date: "2026-12-10T18:45:00+01:00", played: false },
  { competition: "europa", matchday: 7, home: "Celtic", away: "Marseille", date: "2027-01-21T21:00:00+01:00", played: false },
  { competition: "europa", matchday: 8, home: "Marseille", away: "Anderlecht", date: "2027-01-28T21:00:00+01:00", played: false },
];

export async function syncMatchesToDatabase(): Promise<{ clubsCount: number; matchesCount: number }> {
  const db = createDb();

  console.log("Synchronisation des clubs...");
  const clubIdMap = new Map<string, number>();

  const existingClubs = await db.select({ id: clubs.id, name: clubs.name }).from(clubs);
  for (const c of existingClubs) {
    clubIdMap.set(c.name, c.id);
  }

  for (const [canon, profile] of Object.entries(CLUB_PROFILES)) {
    let clubId = clubIdMap.get(profile.name) ?? clubIdMap.get(canon);
    if (!clubId) {
      const [inserted] = await db
        .insert(clubs)
        .values({
          name: profile.name,
          reputation: profile.reputation,
          coach: profile.coach ?? null,
          budgetTransfert: 10000000,
          masseSalarialeActuelle: 30000000,
          plafondSalarialDncg: 50000000,
        })
        .returning({ id: clubs.id });
      clubId = inserted.id;
      console.log(`+ Club créé : ${profile.name} (ID: ${clubId})`);
    } else {
      await db
        .update(clubs)
        .set({
          reputation: profile.reputation,
          coach: profile.coach ?? undefined,
        })
        .where(eq(clubs.id, clubId));
    }
    clubIdMap.set(canon, clubId);
    clubIdMap.set(profile.name, clubId);
  }

  console.log(`✓ ${clubIdMap.size} clubs prêts.`);

  console.log("Synchronisation des matchs...");
  let insertedCount = 0;
  for (const fixture of FIXTURES) {
    const homeId = clubIdMap.get(fixture.home);
    const awayId = clubIdMap.get(fixture.away);

    if (!homeId || !awayId) {
      console.warn(`Club introuvable pour ${fixture.home} vs ${fixture.away}`);
      continue;
    }

    const matchDate = new Date(fixture.date);

    const [existing] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(and(eq(matches.homeTeamId, homeId), eq(matches.awayTeamId, awayId)))
      .limit(1);

    if (!existing) {
      await db.insert(matches).values({
        homeTeamId: homeId,
        awayTeamId: awayId,
        date: matchDate,
        played: fixture.played,
        homeScore: fixture.homeScore ?? 0,
        awayScore: fixture.awayScore ?? 0,
        matchLog: [],
      });
      insertedCount++;
    } else {
      await db
        .update(matches)
        .set({
          date: matchDate,
          played: fixture.played,
          homeScore: fixture.homeScore ?? 0,
          awayScore: fixture.awayScore ?? 0,
        })
        .where(eq(matches.id, existing.id));
    }
  }

  const allMatches = await db.select({ id: matches.id }).from(matches);
  console.log(`✓ ${insertedCount} nouveaux matchs insérés. Total en base : ${allMatches.length}`);

  return {
    clubsCount: clubIdMap.size,
    matchesCount: allMatches.length,
  };
}

/**
 * Met à jour les scores et le statut `played: true` dans la table `matches`
 * pour chaque rencontre jouée présente dans les snapshots (Ligue 1 / Coupe / Europa).
 * Permet au moteur de simulation d'avancer automatiquement vers le prochain match réel.
 */
export async function syncPlayedMatchesFromSnapshots(
  db: Db,
  fixtures: { homeTeam: string; awayTeam: string; played: boolean; homeScore?: number; awayScore?: number }[],
): Promise<number> {
  const existingClubs = await db.select({ id: clubs.id, name: clubs.name }).from(clubs);
  const clubIdByCanonical = new Map<string, number>();
  for (const c of existingClubs) {
    clubIdByCanonical.set(canonicalTeamName(c.name), c.id);
  }

  let updatedCount = 0;
  for (const f of fixtures) {
    if (!f.played) continue;
    const homeCanonical = canonicalTeamName(f.homeTeam);
    const awayCanonical = canonicalTeamName(f.awayTeam);
    const homeId = clubIdByCanonical.get(homeCanonical);
    const awayId = clubIdByCanonical.get(awayCanonical);
    if (!homeId || !awayId) continue;

    const [existing] = await db
      .select({ id: matches.id, played: matches.played, homeScore: matches.homeScore, awayScore: matches.awayScore })
      .from(matches)
      .where(and(eq(matches.homeTeamId, homeId), eq(matches.awayTeamId, awayId)))
      .limit(1);

    if (existing && (!existing.played || existing.homeScore !== f.homeScore || existing.awayScore !== f.awayScore)) {
      await db
        .update(matches)
        .set({
          played: true,
          homeScore: f.homeScore ?? 0,
          awayScore: f.awayScore ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, existing.id));
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`✓ ${updatedCount} match(s) joué(s) synchronisé(s) dans la table simulation.`);
  }

  return updatedCount;
}

if (import.meta.main) {
  syncMatchesToDatabase()
    .then((res) => {
      console.log("Succès !", res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erreur sync :", err);
      process.exit(1);
    });
}
