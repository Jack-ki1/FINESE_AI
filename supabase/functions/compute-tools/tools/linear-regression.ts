import { mean } from "../../_shared/stats.ts";
import { pearsonR, tPValue } from "../../_shared/stats.ts";
export default function linearRegression(args: any, data: any[]) {
  const { x_col, y_col } = args as { x_col: string; y_col: string };
  if (!x_col || !y_col) return { error: "x_col and y_col required" };
  const pairs = data.map((r) => [Number(r[x_col]), Number(r[y_col])] as [number, number]).filter(([x, y]) => !isNaN(x) && !isNaN(y));
  if (pairs.length < 10) return { error: `not enough numeric pairs (${pairs.length}, need ≥10)` };
  const n = pairs.length; const xs = pairs.map((p) => p[0]); const ys = pairs.map((p) => p[1]);
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  if (den === 0) return { error: "x_col has zero variance" };
  const slope = num / den; const intercept = my - slope * mx;
  let ssTot = 0, ssRes = 0; for (let i = 0; i < n; i++) { const pred = slope * xs[i] + intercept; ssTot += (ys[i] - my) ** 2; ssRes += (ys[i] - pred) ** 2; }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot; const r = pearsonR(xs, ys);
  const s2 = ssRes / (n - 2); const seSlope = Math.sqrt(s2 / den); const t = seSlope === 0 ? 0 : slope / seSlope; const pVal = tPValue(t, n - 2);
  return { verified: true, x_col, y_col, n, slope: Math.round(slope * 10000) / 10000, intercept: Math.round(intercept * 10000) / 10000, r: Math.round(r * 10000) / 10000, r2: Math.round(r2 * 10000) / 10000, se_slope: Math.round(seSlope * 10000) / 10000, t_stat: Math.round(t * 10000) / 10000, p_value: isNaN(pVal) ? null : Math.round(pVal * 100000) / 100000 };
}
