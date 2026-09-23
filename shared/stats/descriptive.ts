export function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.length > 1 ? arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1) : 0;
}

export function std(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  if (sorted.length === 1) return sorted[0];
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function formatNumber(n: number): string {
  if (n === null || n === undefined || isNaN(n as number)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

export function healthScoreFromProfiles(profiles: { total: number; nullCount: number }[]): number {
  if (!profiles.length) return 100;
  const totalCells = profiles.reduce((s, p) => s + p.total, 0);
  const nullCells = profiles.reduce((s, p) => s + p.nullCount, 0);
  return Math.round((1 - nullCells / totalCells) * 100);
}

export function aggregateData(
  data: Record<string, any>[],
  xCol: string,
  yCol: string,
  aggFn: 'sum' | 'mean' | 'count' | 'max' | 'min'
): { x: string; y: number }[] {
  const groups: Record<string, number[]> = {};
  data.forEach((r) => {
    const key = String(r[xCol] ?? 'null');
    if (!groups[key]) groups[key] = [];
    const v = Number(r[yCol]);
    if (!isNaN(v)) groups[key].push(v);
  });
  return Object.entries(groups).map(([x, vals]) => {
    let y = 0;
    if (aggFn === 'sum') y = vals.reduce((a, b) => a + b, 0);
    else if (aggFn === 'mean') y = vals.reduce((a, b) => a + b, 0) / vals.length;
    else if (aggFn === 'count') y = vals.length;
    else if (aggFn === 'max') y = Math.max(...vals);
    else if (aggFn === 'min') y = Math.min(...vals);
    return { x, y: Math.round(y * 100) / 100 };
  });
}
