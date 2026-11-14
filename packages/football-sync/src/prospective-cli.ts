/**
 * Évaluation prospective de fin de saison (utilisable aussi en cours de saison).
 *
 *   bun run model:ingest        # d'abord : résultats et cotes de clôture à jour (football-data.co.uk)
 *   bun run model:prospective   # saison en cours ; ajouter -- --season=2627 pour une autre
 *
 * Joint le journal `prediction_log` (dernière prédiction écrite avant chaque coup d'envoi) aux résultats
 * et aux cotes de clôture, puis sort RPS, log-loss et calibration avec bootstrap par blocs de journées.
 * Lecture seule : ce script n'écrit rien en base.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDb, currentSeasonYear, getPredictionLog } from "@om/db";
import { evaluateProspective, type ProspectiveRow } from "@om/match-model/fit";
import { HISTORY_GENERATED_AT, loadHistory } from "@om/match-model/history";
import { seasonCode } from "./simulation-model";

const arg = process.argv.find((a) => a.startsWith("--season="));
const season = arg ? arg.slice("--season=".length) : seasonCode(currentSeasonYear());

const rows = await getPredictionLog(createDb(), season);
const prospective: ProspectiveRow[] = rows.map((r) => ({
  matchId: r.matchId,
  season: r.season,
  matchday: r.matchday,
  home: r.homeTeam,
  away: r.awayTeam,
  kickoff: new Date(r.kickoff),
  writtenAt: new Date(r.writtenAt),
  paramsHash: r.paramsHash,
  hyperHash: r.hyperHash,
  grid: r.grid,
  probabilities: [r.pHome, r.pDraw, r.pAway],
}));

const report = evaluateProspective(prospective, loadHistory(), season);
const markdown = `${report.markdown}\nHistorique des résultats et des cotes ingéré le ${HISTORY_GENERATED_AT.slice(0, 10)} ; rapport produit le ${new Date().toISOString().slice(0, 10)}.\n`;
console.log(markdown);
const path = join(import.meta.dir, "..", "..", "..", "docs", `simulation-prospectif-${season}.md`);
writeFileSync(path, markdown);
console.log(`→ ${path}`);
process.exit(0);
