import { mean, variance, std, quantile } from './descriptive.ts';

export function pearsonR(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const d = Math.sqrt(dx * dy);
  return d === 0 ? 0 : num / d;
}

// Regularized incomplete beta I_x(a,b) via Lentz
function logGamma(z: number): number {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}
export function tPValue(t: number, df: number): number {
  if (!isFinite(t) || !isFinite(df) || df <= 0) return NaN;
  const x = df / (df + t * t);
  return ibeta(x, df / 2, 0.5);
}
export function welchT(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  const va = variance(a), vb = variance(b);
  const na = a.length, nb = b.length;
  if (na < 2 || nb < 2) return null;
  const t = (ma - mb) / Math.sqrt(va / na + vb / nb);
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const p = tPValue(t, df);
  return { t, df, p_value: p, mean_a: ma, mean_b: mb, n_a: na, n_b: nb };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pearsonCorrDetailed(
  data: Record<string, any>[],
  colA: string,
  colB: string
): { r: number; n: number; warning?: string } {
  const pairs = data.map((r) => [Number(r[colA]), Number(r[colB])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
  const n = pairs.length;
  if (n < 3) return { r: NaN, n, warning: `Insufficient pairs (n=${n}, need ≥3) — correlation undefined` };
  const sumA = pairs.reduce((s, [a]) => s + a, 0);
  const sumB = pairs.reduce((s, [, b]) => s + b, 0);
  const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0);
  const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0);
  const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0);
  const denom = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2));
  if (denom === 0) return { r: 0, n, warning: 'Zero variance in one column — correlation undefined' };
  const r = Math.round(((n * sumAB - sumA * sumB) / denom) * 1000) / 1000;
  const warning = n < 10 ? `Small sample (n=${n}) — interpret with caution` : undefined;
  return { r, n, warning };
}

export function pearsonCorr(data: Record<string, any>[], colA: string, colB: string): number {
  const { r } = pearsonCorrDetailed(data, colA, colB);
  return isNaN(r) ? 0 : r;
}

// Re-export helpers needed by tools
export { quantile } from './descriptive.ts';
export { mean, variance, std } from './descriptive.ts';
