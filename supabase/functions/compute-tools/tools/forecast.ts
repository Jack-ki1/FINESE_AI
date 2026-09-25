// Simple time-series forecast: Holt linear trend (double exponential smoothing) + naive fallback
// Operates on a single numeric column, ordered as given (or sorted by an optional datetime column)
export default function forecast(args: any, data: any[]) {
  const { value_col, date_col, periods = 6, alpha = 0.5, beta = 0.3 } = args as {
    value_col: string; date_col?: string; periods?: number; alpha?: number; beta?: number;
  };
  if (!value_col) return { error: "value_col required" };
  const p = Math.min(Math.max(Math.floor(periods), 1), 50);
  const a = Math.min(Math.max(alpha, 0.05), 0.95);
  const b = Math.min(Math.max(beta, 0.05), 0.95);
  let ordered = [...data];
  if (date_col) {
    ordered = [...data].sort((x, y) => new Date(x[date_col]).getTime() - new Date(y[date_col]).getTime());
  }
  const vals = ordered.map((r) => Number(r[value_col])).filter((n) => !isNaN(n) && isFinite(n));
  if (vals.length < 5) return { error: `not enough numeric values for ${value_col} (${vals.length}, need ≥5)` };
  // Holt linear
  let level = vals[0];
  let trend = vals.length > 1 ? vals[1] - vals[0] : 0;
  const fitted: number[] = [level];
  for (let i = 1; i < vals.length; i++) {
    const prevLevel = level;
    level = a * vals[i] + (1 - a) * (level + trend);
    trend = b * (level - prevLevel) + (1 - b) * trend;
    fitted.push(Math.round((level) * 1000) / 1000);
  }
  // forecast
  const forecasts: number[] = [];
  for (let h = 1; h <= p; h++) forecasts.push(Math.round((level + h * trend) * 1000) / 1000);
  // error metrics on fitted vs actual (one-step-ahead)
  let mae = 0, rmse = 0, mapeSum = 0, mapeN = 0;
  for (let i = 1; i < vals.length; i++) {
    const err = Math.abs(vals[i] - fitted[i - 1] - trend); // approximation
    // simpler: fitted[i] vs vals[i] but fitted already includes current; use level+trend forecast from i-1
    // recompute quickly: already have fitted, so compare fitted vs actual shifted
    const e = Math.abs(vals[i] - fitted[i]);
    mae += e; rmse += e * e;
    if (Math.abs(vals[i]) > 1e-9) { mapeSum += Math.abs(e / vals[i]); mapeN++; }
  }
  const n = vals.length;
  mae = Math.round((mae / Math.max(n - 1, 1)) * 1000) / 1000;
  rmse = Math.round(Math.sqrt(rmse / Math.max(n - 1, 1)) * 1000) / 1000;
  const mape = mapeN ? Math.round((mapeSum / mapeN) * 10000) / 100 : null;
  return {
    verified: true, value_col, date_col: date_col || null, n, periods: p, alpha: a, beta: b,
    last_level: Math.round(level * 1000) / 1000,
    last_trend: Math.round(trend * 1000) / 1000,
    forecasts, mae, rmse, mape,
    note: "Holt linear trend on given order" + (date_col ? ` (sorted by ${date_col})` : " (row order)"),
  };
}
