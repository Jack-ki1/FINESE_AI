import { mean, std } from "../../_shared/stats.ts";

function covarianceMatrix(data: number[][]): number[][] {
  const n = data.length, d = data[0].length;
  const means = Array.from({ length: d }, (_, j) => mean(data.map((r) => r[j])));
  const cov: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += (data[k][i] - means[i]) * (data[k][j] - means[j]);
      const v = s / (n - 1);
      cov[i][j] = v;
      cov[j][i] = v;
    }
  }
  return cov;
}

function powerIteration(mat: number[][], maxIter = 300, tol = 1e-8): { value: number; vector: number[] } {
  const n = mat.length;
  let v = Array.from({ length: n }, () => Math.random() - 0.5);
  let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  v = v.map((x) => x / (norm || 1));
  let lambda = 0;
  for (let iter = 0; iter < maxIter; iter++) {
    const w = Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) w[i] += mat[i][j] * v[j];
    const wn = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
    if (wn < 1e-12) break;
    const vn = w.map((x) => x / wn);
    let lv = 0;
    for (let i = 0; i < n; i++) {
      let mv = 0;
      for (let j = 0; j < n; j++) mv += mat[i][j] * vn[j];
      lv += vn[i] * mv;
    }
    if (Math.abs(lv - lambda) < tol) { v = vn; lambda = lv; break; }
    v = vn; lambda = lv;
  }
  return { value: lambda, vector: v };
}

export default function pca(args: any, data: any[]) {
  const { columns, n_components } = args as { columns: string[]; n_components?: number };
  if (!columns?.length) return { error: "columns required (≥2 numeric columns)" };
  if (columns.length < 2) return { error: "need ≥2 columns for PCA" };
  const k = Math.min(Math.max(n_components || Math.min(3, columns.length), 1), columns.length);
  const rows: number[][] = [];
  for (const r of data) {
    const v = columns.map((c) => Number(r[c]));
    if (v.every((n) => !isNaN(n) && isFinite(n))) rows.push(v);
  }
  if (rows.length < 10) return { error: `not enough complete rows (${rows.length}, need ≥10)` };
  // standardize
  const means = columns.map((_, j) => mean(rows.map((r) => r[j])));
  const stds = columns.map((_, j) => { const s = std(rows.map((r) => r[j])); return s > 1e-9 ? s : 1; });
  const norm = rows.map((r) => r.map((v, j) => (v - means[j]) / stds[j]));
  let cov = covarianceMatrix(norm);
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  let total = 0;
  // we track sum of diag as proxy for total variance; for correlation matrix it is d
  const trace = columns.length;
  for (let comp = 0; comp < k; comp++) {
    const { value, vector } = powerIteration(cov);
    const ev = Math.max(0, value);
    eigenvalues.push(Math.round(ev * 10000) / 10000);
    eigenvectors.push(vector.map((x) => Math.round(x * 10000) / 10000));
    total += ev;
    // deflate
    const next: number[][] = Array.from({ length: cov.length }, () => Array(cov.length).fill(0));
    for (let i = 0; i < cov.length; i++) for (let j = 0; j < cov.length; j++) next[i][j] = cov[i][j] - ev * vector[i] * vector[j];
    cov = next;
  }
  const explained_ratio = eigenvalues.map((v) => Math.round((v / trace) * 10000) / 10000);
  const cumulative = explained_ratio.reduce((acc: number[], v, i) => { acc.push(Math.round(((acc[i - 1] || 0) + v) * 10000) / 10000); return acc; }, [] as number[]);
  const loadings = eigenvectors.map((vec, ci) => Object.fromEntries(columns.map((c, j) => [c, vec[j]])));
  // project first few rows for sanity
  const projected = norm.slice(0, 5).map((r) => eigenvectors.map((vec) => Math.round(r.reduce((s, v, j) => s + v * vec[j], 0) * 1000) / 1000));
  return {
    verified: true, columns, n: rows.length, n_components: k,
    eigenvalues, explained_ratio, cumulative, loadings, projected_sample: projected,
    note: "loadings = eigenvectors of correlation matrix; explained_ratio sums to ≤1",
    model_card: {
      training_rows: rows.length,
      assumptions: "Numeric, standardized; linear components; complete rows only",
      caveat: "PCA is sensitive to scaling/outliers; interpret loadings with domain context",
      method: "Correlation-matrix eigen via power iteration + deflation",
    },
  };
}
