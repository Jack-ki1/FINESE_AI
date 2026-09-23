import { pearsonR } from "../../_shared/stats.ts";
export default function correlation(args: any, data: any[]) {
  const { col_a, col_b } = args;
  const pairs = data.map((r) => [Number(r[col_a]), Number(r[col_b])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
  const xs = pairs.map((p) => p[0]); const ys = pairs.map((p) => p[1]);
  const r = pearsonR(xs, ys);
  return { col_a, col_b, n: pairs.length, pearson_r: Math.round(r * 10000) / 10000 };
}
