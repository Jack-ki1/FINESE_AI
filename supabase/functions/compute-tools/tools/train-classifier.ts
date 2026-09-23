import { quantile, mean } from "../../_shared/stats.ts";
import { shuffle } from "../../_shared/stats.ts";
export default function trainClassifier(args: any, data: any[]) {
  const { target, features } = args as { target: string; features?: string[] };
  if (!target) return { error: "target column required" };
  const cols = Object.keys(data[0] || {});
  const featCols = (features && features.length ? features : cols.filter((c) => c !== target)).filter((c) => c !== target);
  if (!featCols.length) return { error: "no usable feature columns" };
  const rows = data.map((r) => ({ y: r[target], x: featCols.map((c) => r[c]) })).filter((r) => r.y !== null && r.y !== undefined && r.y !== "");
  if (rows.length < 20) return { error: `not enough labeled rows (${rows.length}, need ≥20)` };
  const labels = Array.from(new Set(rows.map((r) => String(r.y)))).sort();
  if (labels.length < 2) return { error: "target has only one class" };
  if (labels.length > 20) return { error: `too many classes (${labels.length})` };
  const featMeta = featCols.map((c) => {
    const numericVals = rows.map((r) => Number(r.x[featCols.indexOf(c)])).filter((n) => !isNaN(n));
    const isNumeric = numericVals.length / rows.length > 0.8;
    if (!isNumeric) return { col: c, kind: "cat" as const };
    const sorted = [...numericVals].sort((a, b) => a - b);
    const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => quantile(sorted, q));
    return { col: c, kind: "num" as const, cuts };
  });
  const encode = (xs: any[]): string[] => xs.map((v, i) => {
    const m = featMeta[i];
    if (m.kind === "cat") return String(v ?? "(null)");
    const n = Number(v); if (isNaN(n)) return "na";
    let b = 0; for (const c of m.cuts!) if (n > c) b++; return `b${b}`;
  });
  let seed = 42; const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const shuffled = shuffle(rows, rand);
  const split = Math.floor(shuffled.length * 0.7);
  const train = shuffled.slice(0, split); const test = shuffled.slice(split);
  const classCounts: Record<string, number> = {};
  const fvc: Record<string, Record<number, Record<string, number>>> = {};
  for (const lab of labels) { classCounts[lab] = 0; fvc[lab] = {}; for (let i = 0; i < featCols.length; i++) fvc[lab][i] = {}; }
  for (const r of train) { const lab = String(r.y); classCounts[lab]++; const enc = encode(r.x); enc.forEach((tok, i) => { fvc[lab][i][tok] = (fvc[lab][i][tok] || 0) + 1; }); }
  const vocabSizes = featMeta.map((m, i) => { const s = new Set<string>(); for (const lab of labels) Object.keys(fvc[lab][i]).forEach((k) => s.add(k)); return Math.max(s.size, 2); });
  const predict = (xs: any[]): string => {
    const enc = encode(xs); let best = labels[0]; let bestLog = -Infinity;
    for (const lab of labels) {
      const prior = (classCounts[lab] + 1) / (train.length + labels.length);
      let logP = Math.log(prior);
      enc.forEach((tok, i) => { const c = fvc[lab][i][tok] || 0; const denom = classCounts[lab] + vocabSizes[i]; logP += Math.log((c + 1) / denom); });
      if (logP > bestLog) { bestLog = logP; best = lab; }
    } return best;
  };
  const idx: Record<string, number> = {}; labels.forEach((l, i) => idx[l] = i);
  const matrix: number[][] = labels.map(() => labels.map(() => 0));
  let correct = 0;
  for (const r of test) { const pred = predict(r.x); const truth = String(r.y); matrix[idx[truth]][idx[pred]]++; if (pred === truth) correct++; }
  const accuracy = test.length ? correct / test.length : 0;
  const precision: Record<string, number> = {}; const recall: Record<string, number> = {}; const f1: Record<string, number> = {};
  labels.forEach((lab, i) => {
    const tp = matrix[i][i]; const fp = matrix.reduce((s, row, r) => s + (r === i ? 0 : row[i]), 0); const fn = matrix[i].reduce((s, v, c) => s + (c === i ? 0 : v), 0);
    precision[lab] = tp + fp > 0 ? tp / (tp + fp) : 0; recall[lab] = tp + fn > 0 ? tp / (tp + fn) : 0;
    f1[lab] = precision[lab] + recall[lab] > 0 ? 2 * precision[lab] * recall[lab] / (precision[lab] + recall[lab]) : 0;
  });
  const baseAcc = accuracy; const importance: { name: string; importance: number }[] = [];
  for (let f = 0; f < featCols.length; f++) {
    const colVals = test.map((r) => r.x[f]); let s2 = 7 + f; const rng = () => { s2 = (s2 * 9301 + 49297) % 233280; return s2 / 233280; };
    const shuffledCol = shuffle(colVals, rng); let permCorrect = 0;
    test.forEach((r, k) => { const xs = [...r.x]; xs[f] = shuffledCol[k]; if (predict(xs) === String(r.y)) permCorrect++; });
    const permAcc = test.length ? permCorrect / test.length : 0;
    importance.push({ name: featCols[f], importance: Math.max(0, baseAcc - permAcc) });
  }
  const totalImp = importance.reduce((s, x) => s + x.importance, 0) || 1;
  importance.forEach((x) => x.importance = Math.round((x.importance / totalImp) * 10000) / 10000);
  importance.sort((a, b) => b.importance - a.importance);
  return { verified: true, model: "MultinomialNB (Laplace)", target, features: featCols, labels, n_train: train.length, n_test: test.length, accuracy: Math.round(accuracy * 10000) / 10000, precision, recall, f1, matrix, feature_importance: importance };
}
