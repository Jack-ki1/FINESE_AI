import { mean, std, quantile } from "../../_shared/stats.ts";
function nums(data: any[], col: string): number[] { return data.map((r) => Number(r[col])).filter((n) => !isNaN(n)); }
export default function outliers(args: any, data: any[]) {
  const { column, method = "iqr" } = args;
  const vals = nums(data, column);
  const sorted = [...vals].sort((a, b) => a - b);
  if (method === "iqr") {
    const q1 = quantile(sorted, 0.25); const q3 = quantile(sorted, 0.75); const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr; const hi = q3 + 1.5 * iqr;
    const outs = vals.filter((v) => v < lo || v > hi);
    return { column, method, n: vals.length, n_outliers: outs.length, lower: lo, upper: hi, sample_outliers: outs.slice(0, 20) };
  }
  const m = mean(vals), s = std(vals);
  const outs = vals.filter((v) => Math.abs((v - m) / s) > 3);
  return { column, method: "zscore", n: vals.length, n_outliers: outs.length, sample_outliers: outs.slice(0, 20) };
}
