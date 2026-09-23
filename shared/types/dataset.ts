export interface ColumnProfile {
  col: string;
  type: 'numeric' | 'categorical' | 'text' | 'datetime' | 'empty';
  semantic?: 'identifier' | 'zip' | 'phone' | 'email' | 'url' | 'currency' | 'boolean' | 'categorical' | 'numeric' | 'datetime' | 'text' | 'empty';
  nullCount: number;
  uniqueCount: number;
  total: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  median?: number;
  q1?: number;
  q3?: number;
  outliers?: number;
  skew?: number;
  top?: { value: string; count: number; pct: number }[];
}

export interface DatasetProfile {
  profile: ColumnProfile[];
  correlations: CorrelationPair[];
  advanced: AdvancedContext;
  health_score: number;
}

export interface CorrelationPair {
  colA: string;
  colB: string;
  r: number;
  n: number;
  warning?: string;
}

export interface AdvancedContext {
  temporalColumns?: { col: string; min: string; max: string; granularity: string }[];
  sparsity?: number;
  suggestedTargets?: string[];
  warnings?: string[];
}

export interface IngestResponse {
  file_hash: string;
  file_name: string;
  row_count: number;
  col_count: number;
  profile: ColumnProfile[];
  correlations: CorrelationPair[];
  advanced: AdvancedContext;
  health_score: number;
  cached: boolean;
}
