import { PERSONA } from "./persona.ts";
import { PROMPT_NO_DATASET } from "./prompt-no-dataset.ts";
import { CHAIN_OF_THOUGHT } from "./chain-of-thought.ts";
import { RESPONSE_QUALITY } from "./response-quality.ts";
import { SPECIALIZED_MODES } from "./specialized-modes.ts";
import { MULTI_STEP_PATTERNS } from "./multi-step-patterns.ts";
import { SIZE_AWARE_RULES } from "./size-aware-rules.ts";
import { ARTIFACT_INSTRUCTIONS } from "./artifact-instructions.ts";
import { CAPABILITIES } from "./capabilities.ts";
import { RULES } from "./rules.ts";
import { TOOL_USAGE_PROMPT } from "./tool-usage.ts";

export function buildSystemPrompt(ctx: any): string {
  if (!ctx || !ctx.fileName) return PROMPT_NO_DATASET;
  const metricsBlock = ctx?.metric_definitions?.length
    ? `\n## User-Defined Metrics (check BEFORE guessing)\nThese are canonical. Use semantic_metric with the name before inventing a formula.\n` + ctx.metric_definitions.map((m: any) => `- **${m.name}** = \`${m.expression}\`${m.description ? ` — ${m.description}` : ''}`).join('\n')
    : '';
  const { fileName, rowCount, colCount, healthScore, profile, correlations, advancedContext } = ctx;
  const sizeCategory = rowCount < 100 ? 'small' : rowCount < 1000 ? 'medium' : rowCount < 10000 ? 'large' : 'very_large';
  const profileStr = (profile || []).map((p: any) => {
    let line = `- **${p.col}** (${p.type}): ${p.total} values, ${p.nullCount} nulls (${((p.nullCount/p.total)*100).toFixed(1)}%), ${p.uniqueCount} unique (cardinality: ${((p.uniqueCount/p.total)*100).toFixed(1)}%)`;
    if (p.type === "numeric") line += ` | min=${p.min}, max=${p.max}, mean=${p.mean?.toFixed(2)}, std=${p.std?.toFixed(2)}, median=${p.median}, Q1=${p.q1}, Q3=${p.q3}, outliers=${p.outliers || 0}, skew=${p.skew?.toFixed(3) || 'N/A'}`;
    if (p.type === "categorical" && p.top) line += ` | top: ${p.top.slice(0, 5).map((t: any) => `"${t.value}"(${t.pct}%)`).join(", ")}`;
    return line;
  }).join("\n");
  const corrStr = correlations?.length ? correlations.map((c: any) => `${c.colA} ↔ ${c.colB}: r=${c.r.toFixed(3)}`).join(", ") : "No strong correlations (|r| > 0.4) detected";
  let advancedStr = '';
  if (advancedContext) {
    const parts: string[] = [];
    if (advancedContext.temporalColumns?.length) parts.push(`**Temporal columns:** ${advancedContext.temporalColumns.map((t: any) => `${t.col} (${t.min} → ${t.max}, ${t.granularity})`).join('; ')}`);
    if (advancedContext.suggestedTargets?.length) parts.push(`**Likely prediction targets:** ${advancedContext.suggestedTargets.join(', ')}`);
    if (advancedContext.classBalance) { const cb = advancedContext.classBalance; parts.push(`**Class balance (${cb.column}):** ${Object.entries(cb.distribution).map(([k,v]) => `${k}: ${v}%`).join(', ')} — ${cb.isImbalanced ? '⚠️ IMBALANCED' : 'balanced'}`); }
    if (advancedContext.entropy?.length) parts.push(`**Entropy:** ${advancedContext.entropy.map((e: any) => `${e.col}: ${e.entropy.toFixed(2)}`).join(', ')}`);
    if (advancedContext.sparsity !== undefined) parts.push(`**Sparsity:** ${(advancedContext.sparsity * 100).toFixed(1)}% of cells are null/empty`);
    advancedStr = parts.length ? `\n## Advanced Data Characteristics\n${parts.join('\n')}` : '';
  }
  const sizeInstructions = (SIZE_AWARE_RULES as any)[sizeCategory] || (SIZE_AWARE_RULES as any).medium;
  return `${PERSONA}\n\n## Active Dataset\n- **File:** "${fileName}" | **${rowCount}** rows × **${colCount}** columns | **Health Score:** ${healthScore}% | **Size category:** ${sizeCategory}\n\n## Column Profiles\n${profileStr}\n\n## Correlations (|r| > 0.4)\n${corrStr}\n${advancedStr}${metricsBlock}\n\n${CHAIN_OF_THOUGHT}\n\n${RESPONSE_QUALITY}\n\n${SPECIALIZED_MODES}\n\n${ARTIFACT_INSTRUCTIONS}\n\n${MULTI_STEP_PATTERNS}\n\n${sizeInstructions}\n\n${CAPABILITIES}\n\n${RULES}\n\n${TOOL_USAGE_PROMPT}`;
}
