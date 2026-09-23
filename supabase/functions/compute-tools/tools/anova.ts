import { mean, std } from "../../_shared/stats.ts";
function logGamma(z: number): number {
  const g = 7; const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30; const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap; if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m; let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
  } return h;
}
function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}
export default function anova(args: any, data: any[]) {
  const { value_col, group_col } = args as { value_col: string; group_col: string };
  if (!value_col || !group_col) return { error: "value_col and group_col required" };
  const groups: Record<string, number[]> = {};
  data.forEach((r) => {
    const g = String(r[group_col] ?? "(null)"); const v = Number(r[value_col]);
    if (!isNaN(v)) { if (!groups[g]) groups[g] = []; groups[g].push(v); }
  });
  const keys = Object.keys(groups).filter((k) => groups[k].length >= 2);
  if (keys.length < 2) return { error: "need ≥2 groups with ≥2 values each" };
  const all = keys.flatMap((k) => groups[k]); const grandMean = mean(all);
  const k = keys.length, N = all.length;
  let ssb = 0, ssw = 0;
  for (const key of keys) { const g = groups[key]; const gm = mean(g); ssb += g.length * (gm - grandMean) ** 2; ssw += g.reduce((s, v) => s + (v - gm) ** 2, 0); }
  const dfb = k - 1, dfw = N - k; const msb = ssb / dfb, msw = ssw / dfw; const F = msw === 0 ? 0 : msb / msw;
  const x = (dfb * F) / (dfb * F + dfw); const p = dfw > 0 ? 1 - ibeta(x, dfb / 2, dfw / 2) : NaN;
  const groupStats = keys.map((k2) => ({ group: k2, n: groups[k2].length, mean: Math.round(mean(groups[k2]) * 100) / 100, std: Math.round(std(groups[k2]) * 100) / 100 }));
  return { verified: true, value_col, group_col, k, N, F: Math.round(F * 1000) / 1000, p_value: isNaN(p) ? null : Math.round(p * 100000) / 100000, df_between: dfb, df_within: dfw, groups: groupStats };
}
