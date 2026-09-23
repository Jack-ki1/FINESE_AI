import { mean, quantile } from "../../_shared/stats.ts";
export default function driftCheck(args: any, data: any[]) {
  const { columns } = args as { columns?: string[] };
  const allCols = Object.keys(data[0] || {});
  let cols: string[];
  if (columns?.length) cols = columns;
  else {
    cols = allCols.filter((c) => {
      const vals = data.slice(0, Math.min(100, data.length)).map((r) => Number(r[c])).filter((n) => !isNaN(n));
      return vals.length / Math.min(100, data.length) > 0.8;
    }).slice(0, 10);
  }
  if (!cols.length) return { error: "no numeric columns for drift check" };
  const mid = Math.floor(data.length / 2);
  const baseline = data.slice(0, mid); const current = data.slice(mid);
  const features = cols.map((col) => {
    const bVals = baseline.map((r) => Number(r[col])).filter((n) => !isNaN(n));
    const cVals = current.map((r) => Number(r[col])).filter((n) => !isNaN(n));
    const bMean = mean(bVals), cMean = mean(cVals);
    const sorted = [...bVals].sort((a, b) => a - b);
    const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => quantile(sorted, q));
    const bin = (v: number) => { let b = 0; for (const cut of cuts) if (v > cut) b++; return b; };
    const bCounts = Array(5).fill(0); const cCounts = Array(5).fill(0);
    bVals.forEach((v) => bCounts[bin(v)]++); cVals.forEach((v) => cCounts[bin(v)]++);
    let psi = 0;
    for (let i = 0; i < 5; i++) {
      const bp = (bCounts[i] + 0.5) / (bVals.length + 1); const cp = (cCounts[i] + 0.5) / (cVals.length + 1);
      psi += (cp - bp) * Math.log(cp / bp);
    }
    const bSorted = [...bVals].sort((a, b) => a - b); const cSorted = [...cVals].sort((a, b) => a - b);
    let ks = 0;
    for (const q of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const bv = quantile(bSorted, q), cv = quantile(cSorted, q);
      const diff = Math.abs(bv - cv) / (Math.max(Math.abs(bv), Math.abs(cv), 1));
      if (diff > ks) ks = diff;
    }
    const drift_score = Math.round((psi * 0.7 + ks * 0.3) * 1000) / 1000;
    let status: string = "stable"; if (psi > 0.25 || ks > 0.3) status = "drifted"; else if (psi > 0.1 || ks > 0.15) status = "warning";
    return { name: col, drift_score, psi: Math.round(psi * 1000) / 1000, ks: Math.round(ks * 1000) / 1000, baseline_mean: Math.round(bMean * 100) / 100, current_mean: Math.round(cMean * 100) / 100, status, test: "PSI+KS" };
  });
  return { verified: true, baseline_n: baseline.length, current_n: current.length, features };
}
