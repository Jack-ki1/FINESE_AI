export interface MetricDefinition {
  id?: string;
  user_id?: string;
  name: string;
  expression: string;
  description?: string;
  created_at?: string;
}

// Evaluate a metric expression against a row. Expression is a JS arithmetic expression
// referencing column names, e.g. "revenue - cost" or "revenue / users".
// Returns number or null if expression invalid/missing cols. Safe eval via whitelist.
export function evalMetric(expr: string, row: Record<string, any>, allowedCols: Set<string>): number | null {
  // Allow only arithmetic, column identifiers, numbers, parentheses, + - * / % .
  if (!/^[a-zA-Z0-9_\s+\-*/()%\.]+$/.test(expr)) return null;
  const tokens = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  for (const t of tokens) {
    // skip numeric literals already handled? tokens are identifiers; check not a number
    if (/^\d+$/.test(t)) continue;
    if (!allowedCols.has(t) && !["Math", "abs", "round", "floor", "ceil", "min", "max"].includes(t)) return null;
  }
  try {
    const fn = new Function(...([...allowedCols].map((c) => c)), `return (${expr});`);
    const args = [...allowedCols].map((c) => Number(row[c]));
    const v = fn(...args);
    return typeof v === "number" && isFinite(v) ? v : null;
  } catch { return null; }
}

export function validateMetricName(name: string): string | null {
  if (!name || !/^[a-zA-Z][a-zA-Z0-9_]{1,63}$/.test(name)) return "name must be 2-64 chars, letters/numbers/_ , starting with letter";
  return null;
}

export function validateExpression(expr: string): string | null {
  if (!expr || expr.length > 500) return "expression required, max 500 chars";
  if (!/^[a-zA-Z0-9_\s+\-*/()%\.]+$/.test(expr)) return "expression contains illegal characters (only col refs + arithmetic)";
  return null;
}
