import type { StandingRow } from "@/src/lib/types/standing";
import type { RealFixture } from "./model-input";
import { Rng, deriveSeed } from "./rng";
import { strengthFromStanding } from "./strength";
import type { MatchSimulationInput } from "./types";

export interface MultiplexFixture {
  id: string;
  input: MatchSimulationInput;
  /**
   * « calendrier » : affiche réelle de la journée, prédite par le modèle.
   * « illustratif » : appariement fictif de repli, à ne jamais présenter comme une prédiction.
   */
  source: "calendrier" | "illustratif";
}

/**
 * Affiches des autres matchs de la journée.
 *
 * Quand le calendrier réel est disponible (`real`), on simule les vraies affiches avec le même
 * moteur et les mêmes forces que le match principal (pas de composition pour ces clubs).
 * Sinon, repli : les autres clubs sont appariés de façon déterministe (même graine → mêmes
 * affiches) et l'ensemble est étiqueté « illustratif ».
 */
export function buildMultiplexFixtures(
  standings: readonly StandingRow[],
  excluded: readonly string[],
  seed: number,
  real?: readonly RealFixture[] | null,
): MultiplexFixture[] {
  const row = (name: string) => standings.find((r) => r.clubName === name);

  if (real && real.length > 0) {
    return real
      .filter((f) => !excluded.includes(f.home) && !excluded.includes(f.away))
      .map((f) => ({
        id: `${f.home}-${f.away}`,
        source: "calendrier" as const,
        input: {
          home: { name: f.home, strength: strengthFromStanding(row(f.home)), starters: [], bench: [] },
          away: { name: f.away, strength: strengthFromStanding(row(f.away)), starters: [], bench: [] },
          model: f.model,
        },
      }));
  }

  const others = standings.filter((r) => !excluded.includes(r.clubName));
  const shuffled = new Rng(deriveSeed(seed, 9999)).shuffle(others);
  const fixtures: MultiplexFixture[] = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const home = shuffled[i];
    const away = shuffled[i + 1];
    fixtures.push({
      id: `${home.clubName}-${away.clubName}`,
      source: "illustratif",
      input: {
        home: { name: home.clubName, strength: strengthFromStanding(home), starters: [], bench: [] },
        away: { name: away.clubName, strength: strengthFromStanding(away), starters: [], bench: [] },
      },
    });
  }
  return fixtures;
}
