/**
 * Elo interne, calculé sur les seuls résultats de Ligue 1.
 * Sert de baseline et d'a priori pour les forces Dixon-Coles. Séquentiel : la note
 * d'avant-match d'un jour ne voit jamais les résultats de ce jour.
 */

export interface EloConfig {
  /** Facteur K de base, multiplié par √(écart de buts). */
  k: number;
  /** Avantage du domicile, en points d'Elo, dans le calcul de l'attendu. */
  homeAdvantage: number;
  /** Note d'entrée d'un club absent de la saison précédente (promu). */
  promotedRating: number;
  /** Note de départ des clubs de la première saison de l'historique. */
  initialRating: number;
}

export interface EloMatch {
  season: string;
  day: number;
  home: string;
  away: string;
  hg: number;
  ag: number;
}

export interface EloRun {
  /** Notes d'avant-match, dans l'ordre des matchs fournis. */
  pre: { home: number; away: number }[];
  /** Notes au matin de chaque jour de match. */
  snapshots: Map<number, Record<string, number>>;
  /** Notes après le dernier match. */
  final: Record<string, number>;
}

/**
 * @param matches triés par jour croissant
 * @param teamsBySeason clubs engagés dans chaque saison (y compris ceux qui n'ont pas encore joué)
 */
export function runElo(matches: readonly EloMatch[], teamsBySeason: Record<string, readonly string[]>, cfg: EloConfig): EloRun {
  const seasons = Object.keys(teamsBySeason).sort();
  const ratings = new Map<string, number>();
  const pre: { home: number; away: number }[] = new Array(matches.length);
  const snapshots = new Map<number, Record<string, number>>();
  let current = "";

  const enterSeason = (season: string) => {
    const previous = seasons[seasons.indexOf(season) - 1];
    for (const team of teamsBySeason[season] ?? []) {
      if (!previous) ratings.set(team, cfg.initialRating);
      else if (!teamsBySeason[previous].includes(team)) ratings.set(team, cfg.promotedRating);
      else if (!ratings.has(team)) ratings.set(team, cfg.initialRating);
    }
  };

  let i = 0;
  while (i < matches.length) {
    const day = matches[i].day;
    if (matches[i].season !== current) {
      current = matches[i].season;
      enterSeason(current);
    }
    snapshots.set(day, Object.fromEntries(ratings));
    const updates: [string, number][] = [];
    let j = i;
    while (j < matches.length && matches[j].day === day && matches[j].season === current) {
      const m = matches[j];
      const home = ratings.get(m.home) ?? cfg.initialRating;
      const away = ratings.get(m.away) ?? cfg.initialRating;
      pre[j] = { home, away };
      const expected = 1 / (1 + 10 ** (-(home - away + cfg.homeAdvantage) / 400));
      const actual = m.hg > m.ag ? 1 : m.hg === m.ag ? 0.5 : 0;
      const delta = cfg.k * Math.sqrt(Math.max(1, Math.abs(m.hg - m.ag))) * (actual - expected);
      updates.push([m.home, delta], [m.away, -delta]);
      j++;
    }
    for (const [team, delta] of updates) ratings.set(team, (ratings.get(team) ?? cfg.initialRating) + delta);
    i = j;
  }

  // Une saison annoncée mais pas encore commencée : on fait entrer ses clubs (promus compris).
  const last = seasons[seasons.length - 1];
  if (last && last !== current) enterSeason(last);

  return { pre, snapshots, final: Object.fromEntries(ratings) };
}
