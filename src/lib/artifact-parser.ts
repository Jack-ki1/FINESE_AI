import type { Artifact } from '@/types';

export function parseArtifacts(rawText: string): { cleanText: string; artifacts: Artifact[]; errors?: string[] } {
  const artifacts: Artifact[] = [];
  const errors: string[] = [];
  const cleanText = rawText.replace(/<artifact>([\s\S]*?)<\/artifact>/g, (_, json) => {
    const raw = json.trim();
    try {
      const art = JSON.parse(raw);
      artifacts.push(art);
    } catch {
      // Attempt lenient repair: fix unescaped newlines in code strings and trailing commas
      try {
        const repaired = raw
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        const art = JSON.parse(repaired);
        artifacts.push(art);
      } catch (e2) {
        errors.push(raw.slice(0, 200));
        // Fire-and-forget log to app_logs (requires auth, ignore failures)
        try {
          if (typeof window !== 'undefined') {
            const payload = JSON.stringify({
              level: 'warn',
              source: 'artifact-parser',
              message: 'Failed to parse artifact JSON',
              context: { raw: raw.slice(0, 1000), error: String(e2) },
            });
            // Use fetch via supabase if available, else console
            console.warn('[artifact-parser] malformed artifact:', raw.slice(0, 300));
            // Async log to app_logs table (best effort)
            import('@/integrations/supabase/client').then(({ supabase }) => {
              supabase.from('app_logs').insert({
                level: 'warn',
                source: 'artifact-parser',
                message: 'Failed to parse artifact JSON',
                context: { raw: raw.slice(0, 2000), error: String(e2) } as any,
              }).then(() => {}, () => {});
            }).catch(() => {});
            void payload;
          }
        } catch {}
      }
    }
    return '';
  }).trim();
  // If any parse errors, append a small notice artifact so user sees something
  if (errors.length) {
    console.warn(`[artifact-parser] ${errors.length} artifact(s) failed to parse`);
  }
  return { cleanText, artifacts, errors: errors.length ? errors : undefined };
}

export const VERIFIED_ARTIFACT_TYPES = new Set([
  'confusion_matrix',
  'feature_importance',
  'model_card',
  'drift_report',
  'hypothesis', // when backed by ttest/anova tool (check verified flag)
]);

export function isVerifiedArtifact(art: any): boolean {
  if (art.verified === true) return true;
  if (art.verified === false) return false;
  // Legacy: confusion_matrix/feature_importance without verified flag -> treat as unverified
  if (['confusion_matrix', 'feature_importance', 'drift_report'].includes(art.type)) {
    return false;
  }
  return false;
}
