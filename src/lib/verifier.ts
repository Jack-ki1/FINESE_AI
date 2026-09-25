export type VerifierFlag = { level: "warn"|"info"; message: string };
export function verifyResult(tool: string, args: any, result: any): VerifierFlag[] {
  const flags: VerifierFlag[] = [];
  const n = result?.n ?? result?.n_a ?? result?.n_b ?? result?.sample_size ?? 0;
  const p = result?.p_value ?? result?.p ?? null;
  // sample size checks
  if (tool === "ttest" || tool === "anova") {
    if (typeof n === "number" && n < 30) flags.push({ level: "warn", message: `n=${n} < 30 — effect may be underpowered for ${tool}` });
    if (p !== null && p >= 0.04 && p <= 0.06) flags.push({ level: "warn", message: `p=${p} near 0.05 — treat as borderline, not decisive` });
  }
  if (tool === "correlation") {
    const r = result?.pearson_r ?? result?.r ?? 0;
    if (Math.abs(r) > 0.7 && typeof n === "number" && n < 50) flags.push({ level: "warn", message: `r=${r} on n=${n} — strong correlation from small sample may not generalize` });
    if (Math.abs(r) < 0.2) flags.push({ level: "info", message: `weak correlation r=${r} — correlation ≠ causation` });
  }
  if (tool === "group_by_aggregate" && typeof n === "number" && n < 20) {
    flags.push({ level: "info", message: `aggregated over n=${n} — check time window/unit consistency across groups` });
  }
  if (tool === "linear_regression") {
    const r2 = result?.r2 ?? 0;
    if (r2 < 0.15) flags.push({ level: "info", message: `R2=${r2} low — trend explains little variance` });
  }
  if (tool === "kmeans") {
    const sil = result?.silhouette ?? 0;
    if (sil < 0.2) flags.push({ level: "warn", message: `silhouette ${sil} low — clusters may not be meaningful` });
  }
  // unit/scale mismatch heuristic: if args reference columns with different semantic scales (currency vs count) — flag info
  return flags;
}
export function badgeForFlags(flags: VerifierFlag[]): "verified"|"flagged"|null {
  if (!flags.length) return "verified";
  return flags.some(f=>f.level==="warn") ? "flagged" : "verified";
}
