import { mean, std } from "../../_shared/stats.ts";

function safeEval(expr: string, row: Record<string, any>, allowed: Set<string>): number | null {
  if (!/^[a-zA-Z0-9_\s+\-*/()%\.]+$/.test(expr)) return null;
  const ids = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  for (const t of ids) { if (/^\d+$/.test(t)) continue; if (!allowed.has(t)) return null; }
  try {
    const fn = new Function(...[...allowed], `return (${expr});`);
    const args = [...allowed].map((c) => Number(row[c]));
    // if any needed col is NaN, return null for that row
    if (args.some((v) => isNaN(v))) return null;
    const v = fn(...args);
    return typeof v === "number" && isFinite(v) ? v : null;
  } catch { return null; }
}

export default function semanticMetric(args: any, data: any[]) {
  const { metric_name, expression, description } = args as { metric_name?: string; expression?: string; description?: string };
  const expr = expression || "";
  if (!expr && !metric_name) return { error: "provide metric_name or expression (e.g. 'revenue - cost')" };
  // if expression not provided but name provided, the caller should have resolved it; for local compute we expect expression
  const useExpr = expr || metric_name || "";
  if (!/^[a-zA-Z0-9_\s+\-*/()%\.]+$/.test(useExpr)) return { error: "expression contains illegal characters" };
  const cols = Object.keys(data[0] || {});
  const allowed = new Set(cols);
  const tokens = useExpr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const refs = tokens.filter((t) => !/^\d+$/.test(t) && allowed.has(t));
  if (!refs.length) return { error: `expression references no known columns. Available: ${cols.join(", ")}` };
  const missing = tokens.filter((t) => !/^\d+$/.test(t) && !allowed.has(t));
  if (missing.length) return { error: `unknown columns: ${missing.join(", ")}. Available: ${cols.join(", ")}` };
  const vals: number[] = [];
  let nulls = 0;
  for (const row of data) {
    const v = safeEval(useExpr, row, allowed);
    if (v === null) nulls++; else vals.push(v);
  }
  if (!vals.length) return { error: `expression produced no numeric values (${nulls} nulls)` };
  const n = vals.length;
  const sorted = [...vals].sort((a, b) => a - b);
  const m = mean(vals);
  const s = std(vals);
  return {
    verified: true,
    metric_name: metric_name || useExpr,
    expression: useExpr,
    description: description || null,
    n, nulls,
    mean: Math.round(m * 1000) / 1000,
    std: Math.round(s * 1000) / 1000,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(n / 2)],
    sample_values: vals.slice(0, 5).map((v) => Math.round(v * 1000) / 1000),
    note: "derived metric computed row-wise; define it once in Settings → Metrics and the model will reuse it instead of guessing",
  };
}
