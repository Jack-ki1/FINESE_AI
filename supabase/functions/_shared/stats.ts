// Shared pure-TS stats — single source of truth (mirrors shared/)
// This file is duplicated for Deno edge functions; keep in sync with shared/stats/*

export interface ColumnProfile {
  col: string;
  type: 'numeric' | 'categorical' | 'text' | 'datetime' | 'empty';
  semantic?: 'identifier' | 'zip' | 'phone' | 'email' | 'url' | 'currency' | 'boolean' | 'categorical' | 'numeric' | 'datetime' | 'text' | 'empty';
  nullCount: number;
  uniqueCount: number;
  total: number;
  min?: number; max?: number; mean?: number; std?: number; median?: number; q1?: number; q3?: number; outliers?: number; skew?: number;
  top?: { value: string; count: number; pct: number }[];
}

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



export function pearsonR(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = mean(xs.slice(0, n)), my = mean(ys.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const d = Math.sqrt(dx * dy);
  return d === 0 ? 0 : num / d;
}

// Regularized incomplete beta I_x(a,b) via Lentz
function logGamma(z: number): number {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}
export function tPValue(t: number, df: number): number {
  if (!isFinite(t) || !isFinite(df) || df <= 0) return NaN;
  const x = df / (df + t * t);
  return ibeta(x, df / 2, 0.5);
}
export function welchT(a: number[], b: number[]) {
  const ma = mean(a), mb = mean(b);
  const va = variance(a), vb = variance(b);
  const na = a.length, nb = b.length;
  if (na < 2 || nb < 2) return null;
  const t = (ma - mb) / Math.sqrt(va / na + vb / nb);
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const p = tPValue(t, df);
  return { t, df, p_value: p, mean_a: ma, mean_b: mb, n_a: na, n_b: nb };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pearsonCorrDetailed(
  data: Record<string, any>[],
  colA: string,
  colB: string
): { r: number; n: number; warning?: string } {
  const pairs = data.map((r) => [Number(r[colA]), Number(r[colB])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
  const n = pairs.length;
  if (n < 3) return { r: NaN, n, warning: `Insufficient pairs (n=${n}, need ≥3) — correlation undefined` };
  const sumA = pairs.reduce((s, [a]) => s + a, 0);
  const sumB = pairs.reduce((s, [, b]) => s + b, 0);
  const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0);
  const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0);
  const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0);
  const denom = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2));
  if (denom === 0) return { r: 0, n, warning: 'Zero variance in one column — correlation undefined' };
  const r = Math.round(((n * sumAB - sumA * sumB) / denom) * 1000) / 1000;
  const warning = n < 10 ? `Small sample (n=${n}) — interpret with caution` : undefined;
  return { r, n, warning };
}

export function pearsonCorr(data: Record<string, any>[], colA: string, colB: string): number {
  const { r } = pearsonCorrDetailed(data, colA, colB);
  return isNaN(r) ? 0 : r;
}

// Re-export helpers needed by tools
export { quantile } from './descriptive.ts';
export { mean, variance, std } from './descriptive.ts';


export type SemanticType =
  | 'identifier' | 'zip' | 'phone' | 'email' | 'url' | 'currency'
  | 'boolean' | 'categorical' | 'numeric' | 'datetime' | 'text' | 'empty';

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_RE = /^[\+\(\)\-\.\s\d]{7,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)/i;
const CURRENCY_RE = /^[\$€£¥₹]\s?-?\d/;
const BOOL_VALUES = new Set(['true', 'false', 'yes', 'no', 'y', 'n', '0', '1', 't', 'f']);

function looksNumeric(v: any): boolean {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return false;
  const n = Number(v);
  return !isNaN(n) && isFinite(n);
}

export function detectSemanticType(col: string, values: any[]): SemanticType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const total = nonNull.length;
  const isIdName = /(^id$|_id$|^uuid$|guid|hash|key)/i.test(col);
  const isZipName = /(^zip$|zipcode|postal|^postcode$)/i.test(col);
  const isPhoneName = /(phone|mobile|fax|tel)/i.test(col);
  const isEmailName = /(email|e-mail)/i.test(col);
  const isUrlName = /(url|link|href|website|domain)/i.test(col);
  const isCurrencyName = /(price|cost|revenue|amount|salary|wage|fee|charge|usd|eur|gbp)/i.test(col);

  const strs = nonNull.map(String);
  const uniqueRatio = new Set(strs).size / total;

  if (isIdName && uniqueRatio > 0.9) return 'identifier';
  if (uniqueRatio > 0.95 && strs.every((s) => s.length >= 6 && s.length <= 64)) return 'identifier';

  const matchRatio = (re: RegExp) => strs.filter((s) => re.test(s)).length / total;
  const boolRatio = strs.filter((s) => BOOL_VALUES.has(s.toLowerCase())).length / total;

  if (isZipName || matchRatio(ZIP_RE) > 0.8) return 'zip';
  if (isEmailName || matchRatio(EMAIL_RE) > 0.8) return 'email';
  if (isUrlName || matchRatio(URL_RE) > 0.8) return 'url';
  if (matchRatio(CURRENCY_RE) > 0.8 || (isCurrencyName && nonNull.every(looksNumeric))) return 'currency';
  if (isPhoneName && matchRatio(PHONE_RE) > 0.6) return 'phone';
  if (boolRatio > 0.95) return 'boolean';

  const numCount = nonNull.filter(looksNumeric).length;
  if (numCount / total > 0.9) {
    if (uniqueRatio > 0.95 && strs.every((s) => /^\d+$/.test(s))) return 'identifier';
    return 'numeric';
  }
  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / total > 0.85) return 'datetime';

  if (uniqueRatio < 0.25 && new Set(strs).size <= 50) return 'categorical';
  return 'text';
}

export function detectType(values: any[]): 'numeric' | 'categorical' | 'text' | 'datetime' | 'empty' {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'empty';
  const numCount = nonNull.filter((v) => !isNaN(Number(v)) && v !== '' && v !== true && v !== false).length;
  if (numCount / nonNull.length > 0.8) return 'numeric';
  const unique = new Set(nonNull.map(String));
  if (unique.size / nonNull.length < 0.25 && unique.size <= 40) return 'categorical';
  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(String(v))) && String(v).length > 4).length;
  if (dateCount / nonNull.length > 0.8) return 'datetime';
  return 'text';
}



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
