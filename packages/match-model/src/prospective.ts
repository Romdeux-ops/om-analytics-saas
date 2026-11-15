/**
 * Évaluation prospective : on confronte les prédictions consignées AVANT chaque match
 * (journal `prediction_log`) aux résultats et aux cotes de clôture connus après coup.
 * Code pur : la lecture de la base est faite par l'appelant.
 */
import { oddsProportional, seasonLabel, type HistoryMatch } from "./history";
import { brier, logLoss, outcomeOf, rps, scoreLogLoss, type Outcome } from "./metrics";

export interface ProspectiveRow {
  matchId: string;
  season: string;
  matchday: number;
  home: string;
  away: string;
  kickoff: Date;
  writtenAt: Date;
  paramsHash: string;
  hyperHash: string;
  codeCommit: string;
  grid: number[][];
  probabilities: [number, number, number];
}

export interface FinalSelection {
  /** Une prédiction par match : la dernière écrite avant le coup d'envoi. */
  kept: ProspectiveRow[];
  /** Prédictions remplacées par une plus récente. */
  superseded: number;
  /** Prédictions écartées parce qu'écrites à partir du coup d'envoi (ne devrait jamais arriver : la base les refuse). */
  late: number;
}

/**
 * Pour chaque match, garde la dernière prédiction écrite strictement avant le coup d'envoi.
 * Le coup d'envoi retenu est celui de la ligne la plus récente (calendrier le plus à jour en cas de report).
 */
export function selectFinalPredictions(rows: readonly ProspectiveRow[]): FinalSelection {
  const byMatch = new Map<string, ProspectiveRow[]>();
  for (const row of rows) byMatch.set(row.matchId, [...(byMatch.get(row.matchId) ?? []), row]);
  const kept: ProspectiveRow[] = [];
  let superseded = 0;
  let late = 0;
  for (const group of byMatch.values()) {
    group.sort((a, b) => a.writtenAt.getTime() - b.writtenAt.getTime());
    const kickoff = group[group.length - 1].kickoff.getTime();
    const valid = group.filter((r) => r.writtenAt.getTime() < kickoff);
    late += group.length - valid.length;
    if (valid.length === 0) continue;
    superseded += valid.length - 1;
    kept.push(valid[valid.length - 1]);
  }
  kept.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  return { kept, superseded, late };
}

function mulberry(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Moyenne et intervalle à 95 % par bootstrap par blocs (un bloc = une journée). */
export function blockBootstrap(values: readonly number[], blocks: readonly string[], resamples = 2000, seed = 20261114) {
  const cells = new Map<string, [number, number]>();
  values.forEach((v, i) => {
    const cell = cells.get(blocks[i]) ?? [0, 0];
    cell[0] += v;
    cell[1] += 1;
    cells.set(blocks[i], cell);
  });
  const list = [...cells.values()];
  const mean = values.reduce((s, v) => s + v, 0) / Math.max(1, values.length);
  if (list.length < 2) return { mean, lo: NaN, hi: NaN, blocks: list.length };
  const random = mulberry(seed);
  const draws: number[] = [];
  for (let b = 0; b < resamples; b++) {
    let s = 0;
    let n = 0;
    for (let k = 0; k < list.length; k++) {
      const cell = list[Math.floor(random() * list.length)];
      s += cell[0];
      n += cell[1];
    }
    draws.push(s / n);
  }
  draws.sort((a, b) => a - b);
  return { mean, lo: draws[Math.floor(0.025 * resamples)], hi: draws[Math.floor(0.975 * resamples)], blocks: list.length };
}

export interface ProspectiveReport {
  markdown: string;
  summary: {
    logged: number;
    matches: number;
    evaluated: number;
    withOdds: number;
    rps: number | null;
    logloss: number | null;
    oddsRps: number | null;
    deltaRpsVsOdds: { mean: number; lo: number; hi: number } | null;
    hyperHashes: number;
    codeCommits: number;
  };
}

const f4 = (x: number) => (Number.isFinite(x) ? x.toFixed(4).replace(".", ",") : "—");
const signed = (x: number) => (Number.isFinite(x) ? `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(4).replace(".", ",")}` : "—");
const pct = (x: number) => (100 * x).toFixed(1).replace(".", ",");
const ci = (d: { mean: number; lo: number; hi: number }) => `${f4(d.mean)} [${f4(d.lo)} ; ${f4(d.hi)}]`;
const ciSigned = (d: { mean: number; lo: number; hi: number }) => `${signed(d.mean)} [${signed(d.lo)} ; ${signed(d.hi)}]`;

/**
 * @param rows toutes les lignes du journal de la saison
 * @param history résultats et cotes de clôture (football-data.co.uk), toutes saisons
 */
export function evaluateProspective(rows: readonly ProspectiveRow[], history: readonly HistoryMatch[], season: string, resamples = 2000): ProspectiveReport {
  const { kept, superseded, late } = selectFinalPredictions(rows.filter((r) => r.season === season));
  const results = new Map(history.filter((m) => m.season === season).map((m) => [`${m.home}|${m.away}`, m]));
  const joined = kept.flatMap((row) => {
    const match = results.get(`${row.home}|${row.away}`);
    return match ? [{ row, match, outcome: outcomeOf(match.hg, match.ag) as Outcome }] : [];
  });
  const hyperHashes = new Set(kept.map((r) => r.hyperHash)).size;
  const commits = [...new Set(kept.map((r) => r.codeCommit))];
  const out: string[] = [];
  const say = (line = "") => out.push(line);
  const table = (header: string[], body: string[][]) => {
    say(`| ${header.join(" | ")} |`);
    say(`|${header.map(() => "---").join("|")}|`);
    for (const r of body) say(`| ${r.join(" | ")} |`);
    say();
  };

  say(`# Évaluation prospective — saison ${seasonLabel(season)}`);
  say();
  say("Prédictions consignées avant chaque coup d'envoi dans `prediction_log` (écriture seule), confrontées après coup aux résultats et aux cotes de clôture de football-data.co.uk.");
  say();
  say(`- Lignes du journal : ${rows.filter((r) => r.season === season).length} ; matchs distincts : ${kept.length} ; prédictions remplacées par une plus récente : ${superseded} ; écrites trop tard et écartées : ${late}.`);
  say(`- Matchs avec résultat connu : ${joined.length} ; sans résultat (pas encore joués ou absents de l'historique) : ${kept.length - joined.length}.`);
  say(`- Jeux d'hyperparamètres rencontrés : ${hyperHashes}${hyperHashes > 1 ? " — **ATTENTION : les hyperparamètres ont changé en cours de saison, le test n'est plus prospectif au sens strict.**" : " (gel respecté)."}`);
  say(`- Versions du code rencontrées : ${commits.length}${commits.length > 1 ? ` (${commits.map((c) => c.slice(0, 8)).join(", ")}) — le code du modèle a changé en cours de saison : vérifier que ces changements ne touchent pas l'ajustement.` : commits.length === 1 ? ` (${commits[0].slice(0, 8)}).` : "."}`);
  say(`- Intervalles à 95 % : bootstrap par blocs de journées, ${resamples} rééchantillonnages.`);
  say();

  const empty: ProspectiveReport["summary"] = { logged: rows.length, matches: kept.length, evaluated: joined.length, withOdds: 0, rps: null, logloss: null, oddsRps: null, deltaRpsVsOdds: null, hyperHashes, codeCommits: commits.length };
  if (joined.length === 0) {
    say("Aucun match évaluable pour l'instant.");
    return { markdown: `${out.join("\n")}\n`, summary: empty };
  }

  const blocks = joined.map((j) => `${j.row.season}-${j.row.matchday}`);
  const boot = (values: number[], b = blocks) => blockBootstrap(values, b, resamples);
  const modelRps = joined.map((j) => rps(j.row.probabilities, j.outcome));
  const modelLl = joined.map((j) => logLoss(j.row.probabilities, j.outcome));
  const modelBrier = joined.map((j) => brier(j.row.probabilities, j.outcome));
  const modelScore = joined.map((j) => scoreLogLoss(j.row.grid, j.match.hg, j.match.ag));

  // Référence naïve : fréquences 1/N/2 des saisons précédentes (connues avant la saison évaluée).
  const past = history.filter((m) => m.season < season).slice(-1000);
  const counts = [0, 0, 0];
  for (const m of past) counts[outcomeOf(m.hg, m.ag)]++;
  const base = counts.map((c) => c / Math.max(1, past.length)) as [number, number, number];

  if (joined.length < 100) say(`**Échantillon réduit (${joined.length} matchs) : les intervalles sont larges, aucune conclusion ferme.**\n`);
  say("## Scores");
  say();
  const body: string[][] = [
    ["Modèle (dernière prédiction avant le coup d'envoi)", String(joined.length), ci(boot(modelRps)), ci(boot(modelLl)), ci(boot(modelBrier)), ci(boot(modelScore))],
    ["Fréquences de base des saisons précédentes", String(joined.length), ci(boot(joined.map((j) => rps(base, j.outcome)))), ci(boot(joined.map((j) => logLoss(base, j.outcome)))), ci(boot(joined.map((j) => brier(base, j.outcome)))), "—"],
  ];
  const withOdds = joined.filter((j) => j.match.odds);
  const oddsBlocks = withOdds.map((j) => `${j.row.season}-${j.row.matchday}`);
  let deltaRps: { mean: number; lo: number; hi: number } | null = null;
  let oddsRpsMean: number | null = null;
  if (withOdds.length > 0) {
    const odds = withOdds.map((j) => oddsProportional(j.match.odds!));
    const oddsRps = withOdds.map((j, i) => rps(odds[i], j.outcome));
    oddsRpsMean = oddsRps.reduce((s, v) => s + v, 0) / oddsRps.length;
    body.push([
      "Cotes de clôture (normalisation proportionnelle)", String(withOdds.length), ci(boot(oddsRps, oddsBlocks)),
      ci(boot(withOdds.map((j, i) => logLoss(odds[i], j.outcome)), oddsBlocks)), ci(boot(withOdds.map((j, i) => brier(odds[i], j.outcome)), oddsBlocks)), "—",
    ]);
    deltaRps = boot(withOdds.map((j, i) => rps(j.row.probabilities, j.outcome) - oddsRps[i]), oddsBlocks);
  }
  table(["", "n", "RPS [IC 95 %]", "Log-loss [IC 95 %]", "Brier [IC 95 %]", "Log-perte score exact [IC 95 %]"], body);
  if (withOdds.length > 0 && deltaRps) {
    const columns = [...new Set(withOdds.map((j) => j.match.odds!.column))].map((c) => `${c}H / ${c}D / ${c}A`).join(", ");
    const deltaLl = boot(withOdds.map((j) => logLoss(j.row.probabilities, j.outcome) - logLoss(oddsProportional(j.match.odds!), j.outcome)), oddsBlocks);
    say(`Modèle − cotes, sur les ${withOdds.length} matchs cotés (comparaison appariée) : ΔRPS = ${ciSigned(deltaRps)}, Δlog-loss = ${ciSigned(deltaLl)}. Colonnes : ${columns}.`);
    say();
  }
  const baseDelta = boot(joined.map((j, i) => modelRps[i] - rps(base, j.outcome)));
  say(`Modèle − fréquences de base : ΔRPS = ${ciSigned(baseDelta)}.`);
  say();

  say("## Calibration (trois issues empilées) : prédit → observé, en %");
  say();
  const edges = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1.0001];
  const calibration = (probabilities: (j: (typeof joined)[number]) => readonly number[] | null, lo: number, hi: number) => {
    let n = 0, p = 0, o = 0;
    for (const j of joined) {
      const q = probabilities(j);
      if (!q) continue;
      q.forEach((x, k) => {
        if (x >= lo && x < hi) { n++; p += x; o += k === j.outcome ? 1 : 0; }
      });
    }
    return n ? `${pct(p / n)} → ${pct(o / n)} (n = ${n})` : "—";
  };
  table(
    ["Tranche prédite", "Modèle", "Cotes de clôture"],
    edges.slice(0, -1).map((lo, b) => [
      `${Math.round(lo * 100)}-${b === edges.length - 2 ? 100 : Math.round(edges[b + 1] * 100)} %`,
      calibration((j) => j.row.probabilities, lo, edges[b + 1]),
      calibration((j) => (j.match.odds ? oddsProportional(j.match.odds) : null), lo, edges[b + 1]),
    ]),
  );

  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  return {
    markdown: `${out.join("\n")}\n`,
    summary: { ...empty, withOdds: withOdds.length, rps: mean(modelRps), logloss: mean(modelLl), oddsRps: oddsRpsMean, deltaRpsVsOdds: deltaRps },
  };
}
