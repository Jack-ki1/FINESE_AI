import { welchT } from "../../_shared/stats.ts";
function num(v: any): number { const n = Number(v); return isNaN(n) ? NaN : n; }
export default function ttest(args: any, data: any[]) {
  const { value_col, group_col, group_a, group_b } = args;
  const a = data.filter((r) => String(r[group_col]) === String(group_a)).map((r) => num(r[value_col])).filter((n) => !isNaN(n));
  const b = data.filter((r) => String(r[group_col]) === String(group_b)).map((r) => num(r[value_col])).filter((n) => !isNaN(n));
  return welchT(a, b);
}
