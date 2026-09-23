import type { ColumnProfile } from '../types/dataset.ts';
import { quantile } from './descriptive.ts';
import { detectSemanticType } from './semantic-types.ts';

function semanticToType(s: string): ColumnProfile['type'] {
  if (s === 'numeric' || s === 'currency') return 'numeric';
  if (s === 'datetime') return 'datetime';
  if (s === 'categorical' || s === 'boolean') return 'categorical';
  if (s === 'empty') return 'empty';
  return 'text';
}

function pearson(data: any[], a: string, b: string): { r: number; n: number } {
  const pairs = data.map((r) => [Number(r[a]), Number(r[b])]).filter(([x, y]) => !isNaN(x) && !isNaN(y));
  const n = pairs.length;
  if (n < 3) return { r: NaN, n };
  const sa = pairs.reduce((s, [x]) => s + x, 0);
  const sb = pairs.reduce((s, [, y]) => s + y, 0);
  const sab = pairs.reduce((s, [x, y]) => s + x * y, 0);
  const sa2 = pairs.reduce((s, [x]) => s + x * x, 0);
  const sb2 = pairs.reduce((s, [, y]) => s + y * y, 0);
  const d = Math.sqrt((n * sa2 - sa ** 2) * (n * sb2 - sb ** 2));
  if (d === 0) return { r: 0, n };
  return { r: Math.round(((n * sab - sa * sb) / d) * 1000) / 1000, n };
}

export function buildProfile(data: Record<string, any>[]): ColumnProfile[] {
  if (!data.length) return [];
  const cols = Object.keys(data[0]);
  return cols.map((col) => {
    const values = data.map((r) => r[col]);
    const semantic = detectSemanticType(col, values);
    const type: ColumnProfile['type'] =
      semantic === 'numeric' || semantic === 'currency' ? 'numeric'
      : semantic === 'datetime' ? 'datetime'
      : semantic === 'categorical' || semantic === 'boolean' ? 'categorical'
      : semantic === 'empty' ? 'empty'
      : 'text';
    const total = values.length;
    const nullCount = values.filter((v) => v === null || v === undefined || v === '').length;
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
    const uniqueCount = new Set(nonNull.map(String)).size;
    const p: ColumnProfile = { col, type, nullCount, uniqueCount, total, semantic } as ColumnProfile;
    if (type === 'numeric') {
      const nums = nonNull.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length) {
        p.min = nums[0];
        p.max = nums[nums.length - 1];
        p.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        p.median = quantile(nums, 0.5);
        p.std = nums.length > 1 ? Math.sqrt(nums.reduce((s, v) => s + (v - p.mean!) ** 2, 0) / (nums.length - 1)) : 0;
        p.q1 = quantile(nums, 0.25);
        p.q3 = quantile(nums, 0.75);
        const iqr = (p.q3 || 0) - (p.q1 || 0);
        const lo = (p.q1 || 0) - 1.5 * iqr;
        const hi = (p.q3 || 0) + 1.5 * iqr;
        p.outliers = nums.filter((v) => v < lo || v > hi).length;
      }
    } else if (type === 'categorical') {
      const counts: Record<string, number> = {};
      nonNull.forEach((v) => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
      p.top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value, count]) => ({ value, count, pct: Math.round((count / total) * 100) }));
    }
    return p;
  });
}

export function buildAdvanced(data: any[], profile: ColumnProfile[]) {
  const numCols = profile.filter((p) => p.type === 'numeric' && p.semantic !== 'identifier').map((p) => p.col);
  const correlations: any[] = [];
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const { r, n } = pearson(data, numCols[i], numCols[j]);
      if (!isNaN(r) && Math.abs(r) > 0.4) {
        const out: any = { colA: numCols[i], colB: numCols[j], r, n };
        if (n < 10) out.warning = `Small sample (n=${n})`;
        correlations.push(out);
      }
    }
  }
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  const dateCols = profile.filter((p) => p.type === 'datetime');
  const temporalColumns = dateCols.map((p) => {
    const dates = data.map((r) => new Date(r[p.col])).filter((d) => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length < 2) return { col: p.col, min: 'N/A', max: 'N/A', granularity: 'unknown' };
    return { col: p.col, min: dates[0].toISOString().split('T')[0], max: dates[dates.length - 1].toISOString().split('T')[0], granularity: 'auto' };
  });
  const totalCells = profile.reduce((s, p) => s + p.total, 0);
  const nullCells = profile.reduce((s, p) => s + p.nullCount, 0);
  const sparsity = totalCells > 0 ? nullCells / totalCells : 0;
  const suggestedTargets = profile.filter((p) => (p.type === 'categorical' && p.uniqueCount <= 10) || (p.type === 'numeric' && p.uniqueCount === 2)).map((p) => p.col);
  return { correlations: correlations.slice(0, 20), advanced: { temporalColumns, sparsity, suggestedTargets } };
}

export function healthScore(profile: ColumnProfile[]): number {
  if (!profile.length) return 100;
  const totalCells = profile.reduce((s, p) => s + p.total, 0);
  const nullCells = profile.reduce((s, p) => s + p.nullCount, 0);
  return Math.round((1 - nullCells / totalCells) * 100);
}

export function entropy(data: Record<string, any>[], col: string): number {
  const values = data.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== '');
  if (!values.length) return 0;
  const counts: Record<string, number> = {};
  values.forEach((v) => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
  const n = values.length;
  return -Object.values(counts).reduce((s, c) => { const p = c / n; return s + (p > 0 ? p * Math.log2(p) : 0); }, 0);
}

export function classBalance(data: Record<string, any>[], col: string): { column: string; distribution: Record<string, number>; isImbalanced: boolean } {
  const values = data.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== '');
  const counts: Record<string, number> = {};
  values.forEach((v) => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
  const n = values.length;
  const distribution: Record<string, number> = {};
  Object.entries(counts).forEach(([k, c]) => { distribution[k] = Math.round((c / n) * 100); });
  const pcts = Object.values(distribution);
  const maxPct = Math.max(...pcts);
  const minPct = Math.min(...pcts);
  return { column: col, distribution, isImbalanced: maxPct / Math.max(minPct, 1) > 3 };
}

export function temporalRange(data: Record<string, any>[], col: string): { min: string; max: string; granularity: string } {
  const dates = data.map((r) => new Date(r[col])).filter((d) => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
  if (dates.length < 2) return { min: 'N/A', max: 'N/A', granularity: 'unknown' };
  const min = dates[0].toISOString().split('T')[0];
  const max = dates[dates.length - 1].toISOString().split('T')[0];
  const diffs = [];
  for (let i = 1; i < Math.min(dates.length, 20); i++) diffs.push(dates[i].getTime() - dates[i - 1].getTime());
  const medianDiff = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)] / 1000;
  let granularity = 'unknown';
  if (medianDiff < 120) granularity = 'seconds';
  else if (medianDiff < 7200) granularity = 'minutes';
  else if (medianDiff < 172800) granularity = 'hourly';
  else if (medianDiff < 864000) granularity = 'daily';
  else if (medianDiff < 3456000) granularity = 'weekly';
  else if (medianDiff < 35000000) granularity = 'monthly';
  else granularity = 'yearly';
  return { min, max, granularity };
}
