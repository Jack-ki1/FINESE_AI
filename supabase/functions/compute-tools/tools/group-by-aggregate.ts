import { mean, quantile } from "../../_shared/stats.ts";
export default function groupByAggregate(args: any, data: any[]) {
  const { group_col, value_col, agg } = args;
  const groups: Record<string, number[]> = {};
  data.forEach((r) => {
    const k = String(r[group_col] ?? "(null)");
    const v = Number(r[value_col]);
    if (!groups[k]) groups[k] = [];
    if (!isNaN(v)) groups[k].push(v);
  });
  const result = Object.entries(groups).map(([k, vs]) => {
    let y = 0;
    switch (agg) {
      case "sum": y = vs.reduce((a, b) => a + b, 0); break;
      case "mean": y = mean(vs); break;
      case "median": y = quantile([...vs].sort((a, b) => a - b), 0.5); break;
      case "min": y = Math.min(...vs); break;
      case "max": y = Math.max(...vs); break;
      case "count": default: y = vs.length;
    }
    return { group: k, value: Math.round(y * 1000) / 1000, n: vs.length };
  }).sort((a, b) => b.value - a.value);
  return { group_col, value_col, agg, rows: result };
}
