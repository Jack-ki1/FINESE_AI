import { mean, std } from "../../_shared/stats.ts";
import { shuffle } from "../../_shared/stats.ts";
export default function kmeans(args: any, data: any[]) {
  const { columns, k = 3 } = args as { columns: string[]; k: number };
  if (!columns?.length) return { error: "columns required" };
  if (k < 2 || k > 10) return { error: "k must be between 2 and 10" };
  const pts: number[][] = [];
  for (const r of data) { const v = columns.map((c) => Number(r[c])); if (v.every((n) => !isNaN(n))) pts.push(v); }
  if (pts.length < k * 5) return { error: `not enough numeric rows (${pts.length}, need ≥${k * 5})` };
  const d = columns.length;
  const means = columns.map((_, j) => mean(pts.map((p) => p[j])));
  const stds = columns.map((_, j) => { const s = std(pts.map((p) => p[j])); return s || 1; });
  const norm = pts.map((p) => p.map((v, j) => (v - means[j]) / stds[j]));
  let seed = 123; const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const centroids: number[][] = [norm[Math.floor(rand() * norm.length)].slice()];
  while (centroids.length < k) {
    const dists = norm.map((p) => Math.min(...centroids.map((c) => p.reduce((s, v, j) => s + (v - c[j]) ** 2, 0))));
    const sum = dists.reduce((a, b) => a + b, 0); let r = rand() * sum; let idx = 0;
    for (let i = 0; i < dists.length; i++) { r -= dists[i]; if (r <= 0) { idx = i; break; } }
    centroids.push(norm[idx].slice());
  }
  let labels = Array(norm.length).fill(0);
  for (let iter = 0; iter < 30; iter++) {
    const newLabels = norm.map((p) => {
      let best = 0, bestD = Infinity; centroids.forEach((c, ci) => { const d2 = p.reduce((s, v, j) => s + (v - c[j]) ** 2, 0); if (d2 < bestD) { bestD = d2; best = ci; } }); return best;
    });
    if (newLabels.every((v, i) => v === labels[i]) && iter > 0) break;
    labels = newLabels;
    for (let ci = 0; ci < k; ci++) { const members = norm.filter((_, i) => labels[i] === ci); if (!members.length) continue; for (let j = 0; j < d; j++) centroids[ci][j] = mean(members.map((p) => p[j])); }
  }
  const centroidsRaw = centroids.map((c) => c.map((v, j) => Math.round((v * stds[j] + means[j]) * 100) / 100));
  const sizes = Array(k).fill(0); labels.forEach((l) => sizes[l]++);
  const sampleIdx = pts.length > 500 ? shuffle([...Array(pts.length).keys()], rand).slice(0, 500) : [...Array(pts.length).keys()];
  let silSum = 0;
  for (const i of sampleIdx) {
    const li = labels[i]; const same = sampleIdx.filter((j) => labels[j] === li && j !== i);
    const a = same.length ? mean(same.map((j) => Math.sqrt(norm[i].reduce((s, v, d2) => s + (v - norm[j][d2]) ** 2, 0)))) : 0;
    let b = Infinity; for (let ck = 0; ck < k; ck++) if (ck !== li) {
      const other = sampleIdx.filter((j) => labels[j] === ck); if (!other.length) continue;
      const avg = mean(other.map((j) => Math.sqrt(norm[i].reduce((s, v, d2) => s + (v - norm[j][d2]) ** 2, 0)))); if (avg < b) b = avg;
    }
    const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b); silSum += s;
  }
  const silhouette = sampleIdx.length ? Math.round((silSum / sampleIdx.length) * 1000) / 1000 : 0;
  return { verified: true, columns, k, n: pts.length, centroids: centroidsRaw, cluster_sizes: sizes, silhouette, labels_sample: labels.slice(0, 100) };
}
