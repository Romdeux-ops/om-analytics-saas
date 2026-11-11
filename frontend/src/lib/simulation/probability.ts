const MAX_GOALS = 10;

function poissonPmf(lambda: number, max: number): number[] {
  const pmf: number[] = [];
  let p = Math.exp(-lambda);
  for (let k = 0; k <= max; k++) {
    pmf.push(p);
    p = (p * lambda) / (k + 1);
  }
  return pmf;
}

/**
 * Probabilités 1/N/2 du résultat final, connaissant le score actuel et les buts
 * encore attendus de chaque côté (deux lois de Poisson indépendantes).
 */
export function outcomeProbabilities(
  score: { home: number; away: number },
  remainingHome: number,
  remainingAway: number,
): { home: number; draw: number; away: number } {
  const ph = poissonPmf(Math.max(0, remainingHome), MAX_GOALS);
  const pa = poissonPmf(Math.max(0, remainingAway), MAX_GOALS);
  const diff = score.home - score.away;
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = ph[i] * pa[j];
      const final = diff + i - j;
      if (final > 0) home += p;
      else if (final < 0) away += p;
      else draw += p;
    }
  }
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}
