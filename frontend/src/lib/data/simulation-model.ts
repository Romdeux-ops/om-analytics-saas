import { unstable_cache } from "next/cache";
import { getSimulationParams } from "@om/db";
import { PARAMS_SCHEMA_VERSION, type ModelParams } from "@om/match-model";
import { REFERENCE_PARAMS } from "@om/match-model/reference-params";
import { getDb } from "@/src/lib/db";
import { FOOTBALL_CACHE_TAG } from "@/src/lib/data/football";

const PARAMS_KEY = "ligue1";

function isUsable(value: unknown): value is ModelParams {
  const p = value as Partial<ModelParams> | null;
  return !!p && p.schemaVersion === PARAMS_SCHEMA_VERSION && !!p.teams && Array.isArray(p.fixtures) && !!p.league && !!p.eventRates;
}

/**
 * Paramètres du modèle de prédiction : ligne jsonb régénérée par la synchro, sinon copie de
 * référence versionnée dans le dépôt (table absente, base indisponible, schéma différent).
 * On garde toujours la plus récente des deux. Invalidé avec le reste des données football.
 */
const loadParams = unstable_cache(
  async (): Promise<ModelParams> => {
    try {
      const stored = await getSimulationParams(getDb(), PARAMS_KEY);
      if (isUsable(stored) && stored.generatedAt >= REFERENCE_PARAMS.generatedAt) return stored;
    } catch (error) {
      console.error("[simulation] Lecture de simulation_params impossible, repli sur la copie du dépôt.", error);
    }
    return REFERENCE_PARAMS;
  },
  ["simulation-params"],
  { revalidate: 300, tags: [FOOTBALL_CACHE_TAG] },
);

export async function getSimulationModelParams(): Promise<ModelParams> {
  return loadParams();
}
