/**
 * Génère les paramètres du modèle de prédiction hors synchro.
 *   bun run model:fit              → écrit la copie de référence du dépôt
 *   bun run model:fit -- --db      → écrit aussi en base (table simulation_params)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDb, currentSeasonYear, upsertSimulationParams } from "@om/db";
import { fetchLigue1Season } from "./football-data";
import { SIMULATION_PARAMS_KEY, buildParamsFromSeason } from "./simulation-model";

const token = process.env.FOOTBALL_DATA_TOKEN;
if (!token) {
  console.error("FOOTBALL_DATA_TOKEN absent : impossible de récupérer les résultats et le calendrier.");
  process.exit(1);
}

const seasonYear = currentSeasonYear();
const params = buildParamsFromSeason(await fetchLigue1Season(token, seasonYear), seasonYear);
const path = join(import.meta.dir, "..", "..", "match-model", "data", "ligue1-params.json");
writeFileSync(path, `${JSON.stringify(params, null, 1)}\n`);
console.log(`→ ${path}`);
console.log(`  ${params.matchesUsed} matchs ajustés, données jusqu'au ${params.dataThrough}, journée ${params.matchday ?? "—"}`);
for (const f of params.fixtures) {
  const p = f.probabilities;
  console.log(
    `  ${f.home} – ${f.away} : ${(100 * p.home).toFixed(1)} / ${(100 * p.draw).toFixed(1)} / ${(100 * p.away).toFixed(1)} %  (λ ${f.lambdaHome} – ${f.lambdaAway})`,
  );
}

if (process.argv.includes("--db")) {
  await upsertSimulationParams(createDb(), SIMULATION_PARAMS_KEY, params);
  console.log("✓ écrit en base (simulation_params)");
  process.exit(0);
}
