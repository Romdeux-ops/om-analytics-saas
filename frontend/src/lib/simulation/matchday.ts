import type { StandingRow } from "@/src/lib/types/standing";
import { Rng, deriveSeed } from "./rng";
import { strengthFromStanding } from "./strength";
import type { MatchSimulationInput } from "./types";

export interface MultiplexFixture {
  id: string;
  input: MatchSimulationInput;
}

/**
 * Affiches des autres matchs de la journée.
 *
 * Le calendrier synchronisé ne contient que les matchs de l'OM : on apparie donc
 * les autres clubs de façon déterministe (même graine → mêmes affiches). Ces
 * affiches sont présentées comme « simulées ». Le jour où le calendrier complet
 * sera synchronisé, il suffira de remplacer cette fonction.
 */
export function buildMultiplexFixtures(
  standings: readonly StandingRow[],
  excluded: readonly string[],
  seed: number,
): MultiplexFixture[] {
  const others = standings.filter((row) => !excluded.includes(row.clubName));
  const shuffled = new Rng(deriveSeed(seed, 9999)).shuffle(others);
  const fixtures: MultiplexFixture[] = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    fixtures.push({
      id: `${home.clubName}-${away.clubName}`,
      input: {
        home: { name: home.clubName, strength: strengthFromStanding(home), starters: [], bench: [] },
        away: { name: away.clubName, strength: strengthFromStanding(away), starters: [], bench: [] },
      },
    });
  }
  return fixtures;
}
