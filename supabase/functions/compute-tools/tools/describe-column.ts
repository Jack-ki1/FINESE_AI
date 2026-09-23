import { mean, std, quantile } from "../../_shared/stats.ts";
function num(v: any): number { const n = Number(v); return isNaN(n) ? NaN : n; }
function nums(data: any[], col: string): number[] { return data.map((r) => num(r[col])).filter((n) => !isNaN(n)); }
export default function describeColumn(args: any, data: any[]) {
  const { column } = args;
  const vals = nums(data, column);
  if (!vals.length) {
    const counts: Record<string, number> = {};
    data.forEach((r) => { const k = String(r[column] ?? "(null)"); counts[k] = (counts[k] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { column, type: "categorical", n: data.length, top };
  }
  const sorted = [...vals].sort((a, b) => a - b);
  return { column, type: "numeric", n: vals.length, mean: mean(vals), std: std(vals), min: sorted[0], q1: quantile(sorted, 0.25), median: quantile(sorted, 0.5), q3: quantile(sorted, 0.75), max: sorted[sorted.length - 1] };
}
