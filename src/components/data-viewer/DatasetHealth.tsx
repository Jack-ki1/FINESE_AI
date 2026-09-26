import { HeartPulse } from 'lucide-react';

interface Props {
  profile: any[];
  data: Record<string, any>[];
  fileName?: string;
}

export interface HealthIssue {
  label: string;
  detail: string;
  severity: 'warn' | 'info';
}

export function computeHealth(profile: any[], data: Record<string, any>[]): { score: number; issues: HealthIssue[]; nullPct: number; dupPct: number } {
  const issues: HealthIssue[] = [];
  let totalCells = 0;
  let nullCells = 0;
  const highNullCols: string[] = [];
  let outlierCols = 0;

  for (const p of profile || []) {
    const total = Number(p.total) || 0;
    const nulls = Number(p.nullCount) || 0;
    totalCells += total;
    nullCells += nulls;
    if (total > 0 && nulls / total > 0.2) highNullCols.push(p.col);
    if (p.type === 'numeric' && Number(p.outliers) > 0) outlierCols++;
  }
  const nullPct = totalCells ? (nullCells / totalCells) * 100 : 0;

  // Duplicate scan, capped for perf.
  const sample = (data || []).slice(0, 5000);
  const seen = new Set<string>();
  let dups = 0;
  for (const row of sample) {
    const k = JSON.stringify(row);
    if (seen.has(k)) dups++;
    else seen.add(k);
  }
  const dupPct = sample.length ? (dups / sample.length) * 100 : 0;

  if (nullPct > 1) {
    issues.push({
      label: `${nullPct.toFixed(1)}% nulls`,
      detail: highNullCols.length ? `Worst: ${highNullCols.slice(0, 3).join(', ')}` : 'Spread thinly across columns',
      severity: nullPct > 10 ? 'warn' : 'info',
    });
  }
  if (dups > 0) {
    issues.push({
      label: `${dups} duplicate row${dups === 1 ? '' : 's'}`,
      detail: `in first ${sample.length.toLocaleString()} rows scanned`,
      severity: dupPct > 5 ? 'warn' : 'info',
    });
  }
  if (outlierCols > 0) {
    issues.push({
      label: `Outliers in ${outlierCols} numeric column${outlierCols === 1 ? '' : 's'}`,
      detail: 'Flagged by IQR during profiling — verify before modeling',
      severity: 'info',
    });
  }

  const score = Math.max(0, Math.round(100 - Math.min(40, nullPct * 2) - Math.min(30, dupPct * 3) - highNullCols.length * 3));
  return { score, issues, nullPct, dupPct };
}

export function DatasetHealth({ profile, data, fileName }: Props) {
  const { score, issues } = computeHealth(profile, data);
  const tone = score >= 90 ? 'verified' : score >= 70 ? 'estimated' : 'critical';
  const toneClass =
    tone === 'verified'
      ? 'bg-verified/10 text-verified border-verified/20'
      : tone === 'estimated'
        ? 'bg-estimated/10 text-estimated border-estimated/20'
        : 'bg-critical/10 text-critical border-critical/20';

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface p-4 flex flex-wrap items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${toneClass}`}>
        <HeartPulse className="w-3.5 h-3.5" /> Health {score}%
      </span>
      <span className="text-xs text-muted-foreground">
        {fileName ? `${fileName} — ` : ''}checked before your first question: nulls, duplicates, outliers.
      </span>
      <div className="flex flex-wrap gap-2 ml-auto">
        {issues.length === 0 && <span className="text-xs text-muted-foreground">Clean — no issues found.</span>}
        {issues.map((i) => (
          <span key={i.label} title={i.detail} className="text-[11px] px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
            {i.label}
          </span>
        ))}
      </div>
    </div>
  );
}
