/** Régression de Poisson (lien log) par moindres carrés repondérés itérés. Petites dimensions seulement. */
export function poissonRegression(X: readonly number[][], y: readonly number[], weights?: readonly number[]): number[] {
  const p = X[0].length;
  const beta = new Array<number>(p).fill(0);
  const meanY = y.reduce((s, v) => s + v, 0) / y.length;
  // Départ : les colonnes indicatrices (0/1) partent du log de la moyenne.
  for (let j = 0; j < p; j++) if (X.every((row) => row[j] === 0 || row[j] === 1)) beta[j] = Math.log(Math.max(1e-6, meanY));
  for (let iter = 0; iter < 60; iter++) {
    const A = Array.from({ length: p }, () => new Array<number>(p).fill(0));
    const g = new Array<number>(p).fill(0);
    for (let i = 0; i < X.length; i++) {
      const row = X[i];
      let eta = 0;
      for (let j = 0; j < p; j++) eta += row[j] * beta[j];
      const mu = Math.exp(Math.max(-20, Math.min(20, eta)));
      const w = weights ? weights[i] : 1;
      for (let j = 0; j < p; j++) {
        if (row[j] === 0) continue;
        g[j] += w * row[j] * (y[i] - mu);
        for (let k = 0; k < p; k++) A[j][k] += w * row[j] * row[k] * mu;
      }
    }
    const step = solve(A, g);
    let max = 0;
    for (let j = 0; j < p; j++) {
      const d = Math.max(-2, Math.min(2, step[j]));
      beta[j] += d;
      max = Math.max(max, Math.abs(d));
    }
    if (max < 1e-9) break;
  }
  return beta;
}

/** Élimination de Gauss avec pivot partiel. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[pivot][c])) pivot = r;
    [M[c], M[pivot]] = [M[pivot], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / d;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / (M[r][r] || 1e-12);
  }
  return x;
}
