// Runtime limits — plan-aware, not hardcoded constants.
// Single plan today; tier selection reads from env or future billing.
export type Plan = 'free' | 'pro' | 'enterprise';
export const PLAN_LIMITS: Record<Plan, { maxFileMB: number; maxRows: number }> = {
  free: { maxFileMB: 20, maxRows: 250_000 },
  pro: { maxFileMB: 100, maxRows: 1_000_000 },
  enterprise: { maxFileMB: 500, maxRows: 5_000_000 },
};

function currentPlan(): Plan {
  const raw = (import.meta as any).env?.VITE_PLAN as string | undefined;
  if (raw === 'pro' || raw === 'enterprise') return raw;
  return 'free';
}

export function getLimits() {
  const plan = currentPlan();
  const cfg = PLAN_LIMITS[plan];
  return { plan, maxFileMB: cfg.maxFileMB, maxFileBytes: cfg.maxFileMB * 1024 * 1024, maxRows: cfg.maxRows };
}

// Backwards compat for existing imports
export const MAX_FILE_BYTES = getLimits().maxFileBytes;
export const MAX_FILE_MB = getLimits().maxFileMB;
export const MAX_INGEST_ROWS = getLimits().maxRows;
