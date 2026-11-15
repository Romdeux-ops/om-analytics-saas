/**
 * Ajustement Dixon-Coles hiérarchique (maximum a posteriori).
 *
 *   log λ_dom = μ + γ + att_dom + def_ext (+ δ si repos court)
 *   log λ_ext = μ     + att_ext + def_dom (+ δ si repos court)
 *
 * `def` positif = défense faible. Les forces ont un a priori gaussien N(moyenne, σ²) dont la
 * moyenne vient de l'Elo. La vraisemblance est pondérée par l'âge du match (demi-vie) et
 * inclut le terme τ de Dixon-Coles : forces et ρ sont ajustés conjointement.
 */
import { dcTau } from "./grid";

export interface FitMatch {
  day: number;
  home: string;
  away: string;
  hg: number;
  ag: number;
  /** Match à huis clos (saison 2020-21) : avantage du domicile estimé à part. */
  covid?: boolean;
  /** Repos de 4 jours ou moins depuis le match de Ligue 1 précédent (entrée candidate). */
  shortRestHome?: boolean;
  shortRestAway?: boolean;
}

export interface FitConfig {
  /** Demi-vie de la pondération temporelle, en jours ; `Infinity` = pas de pondération. */
  halfLifeDays: number;
  /** Écart-type de l'a priori sur att/def (échelle log). */
  sigma: number;
  /** Seuls les matchs des `windowDays` derniers jours sont utilisés. */
  windowDays: number;
  /** Estimer la correction ρ des petits scores (sinon ρ = 0). */
  rho: boolean;
  /** Avantage du domicile séparé pour les matchs `covid`. */
  covidGamma: boolean;
  /** Log-avantage du domicile imposé (ablation) ; estimé si absent. */
  fixedHomeLog?: number;
  /** Estimer un effet du repos court (entrée candidate, hors modèle de référence). */
  restEffect?: boolean;
}

export interface FitPrior {
  att: Record<string, number>;
  def: Record<string, number>;
}

export interface FitResult {
  mu: number;
  gamma: number;
  gammaCovid: number;
  rho: number;
  rest: number;
  att: Record<string, number>;
  def: Record<string, number>;
  /** Écarts-types a posteriori (approximation de Laplace diagonale). */
  attSd: Record<string, number>;
  defSd: Record<string, number>;
  muSd: number;
  gammaSd: number;
  /** Somme des poids des matchs de chaque club : taille d'échantillon effective. */
  effectiveMatches: Record<string, number>;
  matches: number;
  iterations: number;
}

const RHO_MIN = -0.2;
const RHO_MAX = 0.2;
/** A priori sur l'avantage du domicile à huis clos : N(γ, 0,2²). */
const COVID_PRIOR_PRECISION = 1 / (0.2 * 0.2);
/** A priori sur l'effet du repos court : N(0, 0,2²). */
const REST_PRIOR_PRECISION = 1 / (0.2 * 0.2);
const MAX_STEP = 0.5;
const bounded = (step: number) => Math.max(-MAX_STEP, Math.min(MAX_STEP, step));

/** Dérivées de log τ par rapport à log λ_dom et log λ_ext. */
function tauGradient(hg: number, ag: number, lh: number, la: number, rho: number): [number, number] {
  if (rho === 0 || hg > 1 || ag > 1) return [0, 0];
  const t = Math.max(1e-6, dcTau(hg, ag, lh, la, rho));
  if (hg === 0 && ag === 0) return [(-lh * la * rho) / t, (-lh * la * rho) / t];
  if (hg === 0 && ag === 1) return [(lh * rho) / t, 0];
  if (hg === 1 && ag === 0) return [0, (la * rho) / t];
  return [0, 0];
}

/**
 * @param matches tous les matchs connus (le filtre « strictement avant `day` » est appliqué ici)
 * @param day jour de la prédiction : aucun match de ce jour ou d'après n'est utilisé
 * @param teams clubs à inclure même s'ils n'ont aucun match dans la fenêtre (promus)
 */
export function fitDixonColes(
  matches: readonly FitMatch[],
  day: number,
  cfg: FitConfig,
  prior: FitPrior,
  teams: readonly string[],
  warm?: FitResult,
): FitResult {
  const train = matches.filter((m) => m.day < day && m.day >= day - cfg.windowDays);
  const names = [...new Set([...train.flatMap((m) => [m.home, m.away]), ...teams])];
  const index = new Map(names.map((t, k) => [t, k]));
  const n = names.length;
  const N = train.length;

  const priorAtt = new Float64Array(n);
  const priorDef = new Float64Array(n);
  const att = new Float64Array(n);
  const def = new Float64Array(n);
  names.forEach((t, k) => {
    priorAtt[k] = prior.att[t] ?? 0;
    priorDef[k] = prior.def[t] ?? 0;
    att[k] = warm?.att[t] ?? priorAtt[k];
    def[k] = warm?.def[t] ?? priorDef[k];
  });

  const hi = new Int32Array(N);
  const ai = new Int32Array(N);
  const w = new Float64Array(N);
  const covid = new Uint8Array(N);
  const restH = new Uint8Array(N);
  const restA = new Uint8Array(N);
  const decay = cfg.halfLifeDays === Infinity ? 0 : Math.LN2 / cfg.halfLifeDays;
  train.forEach((m, k) => {
    hi[k] = index.get(m.home)!;
    ai[k] = index.get(m.away)!;
    w[k] = Math.exp(-decay * (day - m.day));
    covid[k] = cfg.covidGamma && m.covid ? 1 : 0;
    restH[k] = cfg.restEffect && m.shortRestHome ? 1 : 0;
    restA[k] = cfg.restEffect && m.shortRestAway ? 1 : 0;
  });

  let mu = warm?.mu ?? 0.2;
  let gamma = cfg.fixedHomeLog ?? warm?.gamma ?? 0.2;
  let gammaCovid = cfg.fixedHomeLog ?? warm?.gammaCovid ?? 0;
  let rho = cfg.rho ? (warm?.rho ?? -0.05) : 0;
  let rest = cfg.restEffect ? (warm?.rest ?? 0) : 0;
  const invVar = 1 / (cfg.sigma * cfg.sigma);

  const lh = new Float64Array(N);
  const la = new Float64Array(N);
  const rh = new Float64Array(N);
  const ra = new Float64Array(N);
  /** Recalcule λ et les résidus (y − λ + terme de Dixon-Coles) de chaque match. */
  const refresh = () => {
    for (let k = 0; k < N; k++) {
      const m = train[k];
      const l1 = Math.exp(mu + (covid[k] ? gammaCovid : gamma) + att[hi[k]] + def[ai[k]] + (restH[k] ? rest : 0));
      const l2 = Math.exp(mu + att[ai[k]] + def[hi[k]] + (restA[k] ? rest : 0));
      const [g1, g2] = tauGradient(m.hg, m.ag, l1, l2, rho);
      lh[k] = l1;
      la[k] = l2;
      rh[k] = m.hg - l1 + g1;
      ra[k] = m.ag - l2 + g2;
    }
  };

  const g = new Float64Array(n);
  const h = new Float64Array(n);
  let iterations = 0;
  let muH = 1;
  let gammaH = 1;
  for (; iterations < 300; iterations++) {
    let maxStep = 0;
    const track = (d: number) => {
      maxStep = Math.max(maxStep, Math.abs(d));
      return d;
    };

    // Bloc 1 : niveau de buts, avantage du domicile, repos.
    if (N > 0) {
      refresh();
      let gm = 0, hm = 0, gg = 0, hg = 0, gc = 0, hc = 0, gr = 0, hr = 0;
      for (let k = 0; k < N; k++) {
        gm += w[k] * (rh[k] + ra[k]);
        hm += w[k] * (lh[k] + la[k]);
        if (covid[k]) { gc += w[k] * rh[k]; hc += w[k] * lh[k]; } else { gg += w[k] * rh[k]; hg += w[k] * lh[k]; }
        if (restH[k]) { gr += w[k] * rh[k]; hr += w[k] * lh[k]; }
        if (restA[k]) { gr += w[k] * ra[k]; hr += w[k] * la[k]; }
      }
      muH = hm;
      gammaH = hg;
      // Pas de Newton bornés : avec peu de matchs, un pas libre sur un log-taux peut exploser.
      const dMu = bounded(gm / hm);
      mu += track(dMu);
      if (cfg.fixedHomeLog === undefined) {
        // On retire la part déjà absorbée par μ (μ entre aussi dans λ_dom).
        if (hg > 0) gamma += track(bounded(gg / hg - dMu));
        // γ huis clos : a priori N(γ, τ²). Sans lui, les premières journées de 2020-21 reposeraient
        // sur une poignée de matchs.
        if (hc > 0) gammaCovid += track(bounded((gc - hc * dMu - (gammaCovid - gamma) * COVID_PRIOR_PRECISION) / (hc + COVID_PRIOR_PRECISION)));
        else gammaCovid = gamma;
      }
      if (cfg.restEffect && hr > 0) rest += track(bounded((gr - rest * REST_PRIOR_PRECISION) / (hr + REST_PRIOR_PRECISION)));
    }

    // Bloc 2 : attaques.
    refresh();
    g.fill(0); h.fill(0);
    for (let k = 0; k < N; k++) {
      g[hi[k]] += w[k] * rh[k]; h[hi[k]] += w[k] * lh[k];
      g[ai[k]] += w[k] * ra[k]; h[ai[k]] += w[k] * la[k];
    }
    for (let t = 0; t < n; t++) att[t] += track(bounded((g[t] - (att[t] - priorAtt[t]) * invVar) / (h[t] + invVar)));

    // Bloc 3 : défenses.
    refresh();
    g.fill(0); h.fill(0);
    for (let k = 0; k < N; k++) {
      g[ai[k]] += w[k] * rh[k]; h[ai[k]] += w[k] * lh[k];
      g[hi[k]] += w[k] * ra[k]; h[hi[k]] += w[k] * la[k];
    }
    for (let t = 0; t < n; t++) def[t] += track(bounded((g[t] - (def[t] - priorDef[t]) * invVar) / (h[t] + invVar)));

    // Recentrage : décaler toutes les attaques (ou toutes les défenses) de c et μ de −c ne change
    // aucun λ. Seul l'a priori tranche, et son optimum est l'écart moyen nul. Sans cette étape,
    // la descente par blocs rampe le long de ces deux directions quand σ est grand.
    if (N > 0 && n > 0) {
      let shiftAtt = 0;
      let shiftDef = 0;
      for (let t = 0; t < n; t++) {
        shiftAtt += att[t] - priorAtt[t];
        shiftDef += def[t] - priorDef[t];
      }
      shiftAtt /= n;
      shiftDef /= n;
      for (let t = 0; t < n; t++) {
        att[t] -= shiftAtt;
        def[t] -= shiftDef;
      }
      mu += shiftAtt + shiftDef;
    }

    // Bloc 4 : ρ (Newton à une dimension sur la vraisemblance des petits scores).
    if (cfg.rho && N > 0) {
      refresh();
      let g1 = 0, h1 = 0;
      for (let k = 0; k < N; k++) {
        const m = train[k];
        if (m.hg > 1 || m.ag > 1) continue;
        const t = Math.max(1e-6, dcTau(m.hg, m.ag, lh[k], la[k], rho));
        const d = m.hg === 0 && m.ag === 0 ? -lh[k] * la[k] : m.hg === 0 ? lh[k] : m.ag === 0 ? la[k] : -1;
        g1 += (w[k] * d) / t;
        h1 += (w[k] * d * d) / (t * t);
      }
      if (h1 > 0) {
        const next = Math.min(RHO_MAX, Math.max(RHO_MIN, rho + g1 / h1));
        track(next - rho);
        rho = next;
      }
    }

    if (maxStep < 1e-7) break;
  }

  // Courbure finale pour les écarts-types et la taille d'échantillon effective.
  refresh();
  const hAtt = new Float64Array(n);
  const hDef = new Float64Array(n);
  const eff = new Float64Array(n);
  for (let k = 0; k < N; k++) {
    hAtt[hi[k]] += w[k] * lh[k]; hAtt[ai[k]] += w[k] * la[k];
    hDef[ai[k]] += w[k] * lh[k]; hDef[hi[k]] += w[k] * la[k];
    eff[hi[k]] += w[k]; eff[ai[k]] += w[k];
  }
  const record = (values: Float64Array, f: (v: number) => number = (v) => v) =>
    Object.fromEntries(names.map((t, k) => [t, f(values[k])]));

  return {
    mu,
    gamma,
    gammaCovid,
    rho,
    rest,
    att: record(att),
    def: record(def),
    attSd: record(hAtt, (v) => 1 / Math.sqrt(v + invVar)),
    defSd: record(hDef, (v) => 1 / Math.sqrt(v + invVar)),
    muSd: 1 / Math.sqrt(Math.max(1e-9, muH)),
    gammaSd: 1 / Math.sqrt(Math.max(1e-9, gammaH)),
    effectiveMatches: record(eff),
    matches: N,
    iterations,
  };
}

/** Log-espérances de buts d'une affiche et leur incertitude (hors μ, γ et repos). */
export function matchLogRates(fit: FitResult, home: string, away: string, opts: { covid?: boolean } = {}) {
  const need = (r: Record<string, number>, team: string) => {
    const v = r[team];
    if (v === undefined) throw new Error(`Club absent de l'ajustement : ${team}`);
    return v;
  };
  return {
    logHome: fit.mu + (opts.covid ? fit.gammaCovid : fit.gamma) + need(fit.att, home) + need(fit.def, away),
    logAway: fit.mu + need(fit.att, away) + need(fit.def, home),
    sdHome: Math.hypot(need(fit.attSd, home), need(fit.defSd, away)),
    sdAway: Math.hypot(need(fit.attSd, away), need(fit.defSd, home)),
  };
}
