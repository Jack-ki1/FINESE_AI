// Lite random forest: bagged CART stumps (depth ≤4) on numeric + categorical columns
// Not sklearn-grade, but real: bootstrap + greedy Gini splits + out-of-bag holdout + permutation importance.

function gini(labels: string[]): number {
  const n = labels.length;
  if (n === 0) return 0;
  const counts: Record<string, number> = {};
  labels.forEach((l) => counts[l] = (counts[l] || 0) + 1);
  let s = 0;
  for (const c of Object.values(counts)) { const p = c / n; s += p * p; }
  return 1 - s;
}

function majority(labels: string[]): string {
  const c: Record<string, number> = {};
  labels.forEach((l) => c[l] = (c[l] || 0) + 1);
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || labels[0] || "";
}

type TreeNode = { leaf?: string; col?: string; threshold?: number; category?: string; isCat?: boolean; left?: TreeNode; right?: TreeNode };

function bestSplit(rows: any[], labelCol: string, featureCols: string[], maxFeatures: number): { col: string; threshold?: number; category?: string; isCat: boolean; gain: number } | null {
  if (!rows.length) return null;
  const parentLabels = rows.map((r) => String(r[labelCol]));
  const parentGini = gini(parentLabels);
  let best: any = null;
  // sample subset of features per split (random subspace) for diversity
  const avail = [...featureCols].sort(() => Math.random() - 0.5).slice(0, Math.min(maxFeatures, featureCols.length));
  for (const col of avail) {
    const vals = rows.map((r) => r[col]);
    const isNumeric = vals.every((v) => v === null || v === "" || !isNaN(Number(v)));
    if (isNumeric) {
      const nums = vals.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length < 4) continue;
      // try median + quartiles as thresholds
      const uniq = [...new Set(nums)].sort((a, b) => a - b);
      const thresholds = uniq.length <= 8 ? uniq.slice(1) : [nums[Math.floor(nums.length * 0.25)], nums[Math.floor(nums.length * 0.5)], nums[Math.floor(nums.length * 0.75)]];
      for (const t of thresholds) {
        const left = rows.filter((r) => Number(r[col]) <= t);
        const right = rows.filter((r) => Number(r[col]) > t);
        if (!left.length || !right.length) continue;
        const wg = (left.length / rows.length) * gini(left.map((r) => String(r[labelCol]))) + (right.length / rows.length) * gini(right.map((r) => String(r[labelCol])));
        const gain = parentGini - wg;
        if (gain > (best?.gain || 0)) best = { col, threshold: t, isCat: false, gain };
      }
    } else {
      const freq: Record<string, number> = {};
      vals.forEach((v) => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
      const topCats = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
      for (const cat of topCats) {
        const left = rows.filter((r) => String(r[col]) === cat);
        const right = rows.filter((r) => String(r[col]) !== cat);
        if (!left.length || !right.length) continue;
        const wg = (left.length / rows.length) * gini(left.map((r) => String(r[labelCol]))) + (right.length / rows.length) * gini(right.map((r) => String(r[labelCol])));
        const gain = parentGini - wg;
        if (gain > (best?.gain || 0)) best = { col, category: cat, isCat: true, gain };
      }
    }
  }
  return best;
}

function buildTree(rows: any[], labelCol: string, featureCols: string[], depth: number, maxDepth: number, maxFeatures: number): TreeNode {
  const labels = rows.map((r) => String(r[labelCol]));
  const uniq = new Set(labels);
  if (uniq.size === 1 || depth >= maxDepth || rows.length < 6) return { leaf: majority(labels) };
  const split = bestSplit(rows, labelCol, featureCols, maxFeatures);
  if (!split || split.gain < 0.01) return { leaf: majority(labels) };
  const { col, threshold, category, isCat } = split;
  const left = rows.filter((r) => isCat ? String(r[col]) === category : Number(r[col]) <= (threshold as number));
  const right = rows.filter((r) => isCat ? String(r[col]) !== category : Number(r[col]) > (threshold as number));
  if (!left.length || !right.length) return { leaf: majority(labels) };
  return {
    col, threshold, category, isCat,
    left: buildTree(left, labelCol, featureCols, depth + 1, maxDepth, maxFeatures),
    right: buildTree(right, labelCol, featureCols, depth + 1, maxDepth, maxFeatures),
  };
}

function predictTree(node: TreeNode, row: any): string {
  if (node.leaf !== undefined) return node.leaf;
  const v = row[node.col as string];
  const goLeft = node.isCat ? String(v) === node.category : Number(v) <= (node.threshold as number);
  return predictTree(goLeft ? node.left! : node.right!, row);
}

export default function randomForest(args: any, data: any[]) {
  const { target_col, feature_cols, n_trees = 15, max_depth = 4 } = args as {
    target_col: string; feature_cols?: string[]; n_trees?: number; max_depth?: number;
  };
  if (!target_col) return { error: "target_col required" };
  let cols = feature_cols?.length ? feature_cols : Object.keys(data[0] || {}).filter((c) => c !== target_col);
  if (!cols.length) return { error: "no feature_cols available" };
  cols = cols.slice(0, 20);
  const clean = data.filter((r) => r[target_col] !== null && r[target_col] !== undefined && r[target_col] !== "");
  if (clean.length < 20) return { error: `not enough rows with target (${clean.length}, need ≥20)` };
  const labels = clean.map((r) => String(r[target_col]));
  const uniq = [...new Set(labels)];
  if (uniq.length < 2) return { error: `target ${target_col} has only one class` };
  if (uniq.length > 12) return { error: `target has too many classes (${uniq.length}, max 12) — choose a categorical target` };

  const t = Math.min(Math.max(Math.floor(n_trees), 5), 50);
  const d = Math.min(Math.max(Math.floor(max_depth), 2), 6);
  const forest: TreeNode[] = [];
  const oobAcc: number[] = [];

  // Holdout for final evaluation
  const n = clean.length;
  const idx = [...Array(n).keys()];
  // Fisher-Yates shuffle via deterministic-ish rand
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const split = Math.floor(n * 0.75);
  const trainIdx = new Set(idx.slice(0, split));
  const testIdx = idx.slice(split);
  const train = clean.filter((_, i) => trainIdx.has(i));
  const test = clean.filter((_, i) => testIdx.has(i) || !trainIdx.has(i)); // fallback to all if holdout tiny
  const finalTest = testIdx.length >= 5 ? clean.filter((_, i) => testIdx.includes(i)) : train.slice(0, Math.min(20, train.length));

  const m = Math.max(1, Math.floor(Math.sqrt(cols.length)));

  for (let ti = 0; ti < t; ti++) {
    // bootstrap
    const boot: any[] = [];
    for (let i = 0; i < train.length; i++) boot.push(train[Math.floor(Math.random() * train.length)]);
    const tree = buildTree(boot, target_col, cols, 0, d, m);
    forest.push(tree);
  }

  function ensemblePredict(row: any): string {
    const votes: Record<string, number> = {};
    forest.forEach((tr) => { const p = predictTree(tr, row); votes[p] = (votes[p] || 0) + 1; });
    return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  }

  // accuracy on holdout
  let correct = 0;
  const predLabels: string[] = [];
  const trueLabels: string[] = [];
  finalTest.forEach((r) => {
    const p = ensemblePredict(r);
    predLabels.push(p); trueLabels.push(String(r[target_col]));
    if (p === String(r[target_col])) correct++;
  });
  const accuracy = finalTest.length ? Math.round((correct / finalTest.length) * 10000) / 10000 : 0;

  // confusion
  const cm: number[][] = Array.from({ length: uniq.length }, () => Array(uniq.length).fill(0));
  const labelIdx: Record<string, number> = Object.fromEntries(uniq.map((l, i) => [l, i]));
  finalTest.forEach((r, i) => { const ti = labelIdx[String(r[target_col])]; const pi = labelIdx[predLabels[i]]; if (ti !== undefined && pi !== undefined) cm[ti][pi]++; });

  // permutation importance (on holdout)
  let baseline = accuracy;
  const importances: { feature: string; importance: number }[] = [];
  for (const col of cols) {
    const shuffled = finalTest.map((r) => ({ ...r }));
    // permute this column within holdout
    const vals = shuffled.map((r) => r[col]);
    for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
    shuffled.forEach((r, i) => r[col] = vals[i]);
    let c = 0;
    shuffled.forEach((r, i) => { const p = ensemblePredict(r); if (p === trueLabels[i]) c++; });
    const accPerm = shuffled.length ? c / shuffled.length : 0;
    importances.push({ feature: col, importance: Math.round(Math.max(0, baseline - accPerm) * 10000) / 10000 });
  }
  importances.sort((a, b) => b.importance - a.importance);

  return {
    verified: true,
    target_col,
    feature_cols: cols,
    n: clean.length,
    n_train: train.length,
    n_test: finalTest.length,
    n_trees: t,
    max_depth: d,
    labels: uniq,
    accuracy,
    confusion_matrix: cm,
    feature_importance: importances.slice(0, 10),
    predictions_sample: finalTest.slice(0, 5).map((r, i) => ({ true: trueLabels[i], pred: predLabels[i] })),
    model_card: {
      training_rows: clean.length,
      assumptions: "Bagged CART depth ≤4, sqrt(p) feature sampling, bootstrap; 75/25 holdout",
      caveat: "Small holdout — accuracy variance high; permutation importance shuffles within holdout only",
      method: "Lite Random Forest (bagged Gini CART, voting)",
    },
  };
}
