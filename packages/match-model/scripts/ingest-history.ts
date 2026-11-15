/**
 * Ingestion ponctuelle de l'historique de Ligue 1 depuis football-data.co.uk.
 * Hors ligne, hors navigateur. Usage : `bun run model:ingest` (à relancer environ une fois par mois
 * pour rafraîchir les statistiques et les cotes de la saison en cours).
 *
 * Écrit `packages/match-model/data/ligue1-history.json`.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { HISTORY_COLUMNS, seasonCodeOf, type HistoryFile } from "../src/history";

const FIRST_SEASON_START = 2014;
const BASE_URL = "https://www.football-data.co.uk/mmz4281";

/** Noms football-data.co.uk → noms canoniques de l'application (les autres sont identiques). */
const NAME_ALIASES: Record<string, string> = { "Paris SG": "Paris-SG" };

/** Colonnes de cotes de clôture, par ordre de préférence : moyenne du marché, puis Pinnacle. */
const CLOSING_ODDS_PREFIXES = ["AvgC", "PSC"];

function seasonCodes(): string[] {
  const current = seasonCodeOf(new Date().toISOString());
  const codes: string[] = [];
  for (let start = FIRST_SEASON_START; ; start++) {
    const code = `${String(start % 100).padStart(2, "0")}${String((start + 1) % 100).padStart(2, "0")}`;
    codes.push(code);
    if (code === current) return codes;
  }
}

function isoDate(raw: string): string {
  const [d, m, y] = raw.split("/").map(Number);
  const year = y < 100 ? 2000 + y : y;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

async function fetchSeason(code: string): Promise<(string | number | null)[][]> {
  const res = await fetch(`${BASE_URL}/${code}/F1.csv`, { redirect: "follow" });
  if (!res.ok) throw new Error(`football-data.co.uk ${code} → HTTP ${res.status}`);
  const text = new TextDecoder("latin1").decode(await res.arrayBuffer()).replace(/^﻿|^ï»¿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(",");
  for (const required of ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG"]) {
    if (!header.includes(required)) throw new Error(`Saison ${code} : colonne ${required} absente`);
  }
  const rows: (string | number | null)[][] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const raw = (name: string) => (header.includes(name) ? cells[header.indexOf(name)] : undefined);
    const num = (name: string): number | null => {
      const v = raw(name);
      return v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v);
    };
    if (!raw("HomeTeam") || num("FTHG") === null || num("FTAG") === null) continue;

    const stats = ["HS", "AS", "HST", "AST", "HF", "AF", "HC", "AC", "HY", "AY", "HR", "AR"].map(num);
    const hasStats = stats.every((v) => v !== null);
    let odds: [number, number, number, string] | null = null;
    for (const prefix of CLOSING_ODDS_PREFIXES) {
      const o = [num(`${prefix}H`), num(`${prefix}D`), num(`${prefix}A`)];
      if (o.every((v) => v !== null && v > 1)) {
        odds = [o[0]!, o[1]!, o[2]!, prefix];
        break;
      }
    }
    const xg = [num("HxG"), num("AxG")];
    const name = (n: string) => NAME_ALIASES[n.trim()] ?? n.trim();
    rows.push([
      code, isoDate(raw("Date")!), name(raw("HomeTeam")!), name(raw("AwayTeam")!),
      num("FTHG"), num("FTAG"), num("HTHG"), num("HTAG"),
      ...(hasStats ? stats : stats.map(() => null)),
      ...(odds ?? [null, null, null, null]),
      ...(xg.every((v) => v !== null) ? xg : [null, null]),
    ]);
  }
  return rows;
}

const matches: (string | number | null)[][] = [];
for (const code of seasonCodes()) {
  const rows = await fetchSeason(code);
  const withOdds = rows.filter((r) => r[HISTORY_COLUMNS.indexOf("oddsH")] !== null);
  const columns = [...new Set(withOdds.map((r) => r[HISTORY_COLUMNS.indexOf("oddsColumn")]))].join("/");
  const withXg = rows.filter((r) => r[HISTORY_COLUMNS.indexOf("hxg")] !== null).length;
  console.log(`✓ ${code} : ${rows.length} matchs, cotes de clôture ${withOdds.length} (${columns || "aucune"}), xG ${withXg}`);
  matches.push(...rows);
}

const file: HistoryFile = {
  generatedAt: new Date().toISOString(),
  source: `${BASE_URL}/<saison>/F1.csv`,
  columns: [...HISTORY_COLUMNS],
  matches,
};
const path = join(import.meta.dir, "..", "data", "ligue1-history.json");
writeFileSync(path, `${JSON.stringify(file).replace(/\],\[/g, "],\n[")}\n`);
console.log(`→ ${path} (${matches.length} matchs)`);
