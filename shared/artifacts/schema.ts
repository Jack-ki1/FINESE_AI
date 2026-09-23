export const VERIFIED_ARTIFACT_TYPES = new Set([
  'confusion_matrix',
  'feature_importance',
  'model_card',
  'drift_report',
  'hypothesis',
  'chart', // when backed by group_by_aggregate
]);

export const ESTIMATED_ARTIFACT_TYPES = new Set([
  'pipeline',
  'lineage',
  'cost_analysis',
  'schema_explorer',
  'experiment',
]);

export type ArtifactType =
  | 'chart' | 'table' | 'insights' | 'code' | 'profile' | 'stats' | 'corr_matrix' | 'anomaly_report' | 'pivot' | 'hypothesis'
  | 'feature_importance' | 'confusion_matrix' | 'experiment' | 'pipeline' | 'model_card' | 'drift_report' | 'cost_analysis' | 'schema_explorer' | 'lineage' | 'suggestions';

export function isVerifiedArtifact(a: { type: string; verified?: boolean }): boolean {
  if (a.verified === true) return true;
  if (a.verified === false) return false;
  if (['confusion_matrix', 'feature_importance', 'drift_report'].includes(a.type)) return false;
  return false;
}

export interface ArtifactSchema {
  type: ArtifactType;
  verified: boolean; // true = tool-computed, false = AI narrative
  description: string;
}
