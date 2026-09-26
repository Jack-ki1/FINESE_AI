import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isLocalMode } from '@/lib/localMode';

export interface DatasetRow {
  file_hash: string;
  file_name: string;
  row_count: number;
  user_id: string;
}

function listLocalDatasets(limit: number): DatasetRow[] {
  // Local mode: inventory is the set of profiles persisted by localIngest.
  const rows: DatasetRow[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('finese-dataset-') || !key.endsWith('-profile')) continue;
      try {
        const p = JSON.parse(localStorage.getItem(key) || '');
        if (p?.file_hash) {
          rows.push({
            file_hash: p.file_hash,
            file_name: p.file_name || key,
            row_count: p.row_count || 0,
            user_id: 'local-owner',
          });
        }
      } catch { /* skip corrupt entries */ }
    }
  } catch { /* storage unavailable */ }
  return rows.slice(0, limit);
}

export async function fetchDatasets(limit = 50): Promise<DatasetRow[]> {
  if (isLocalMode()) return listLocalDatasets(limit);
  const { data, error } = await supabase
    .from('datasets')
    .select('file_hash,file_name,row_count,user_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as DatasetRow[];
}

/**
 * First react-query migration (see review §3.1): caching between
 * navigations, automatic retry, and a real error object instead of a
 * hand-rolled useEffect + silently-swallowed console.error.
 *
 * Usage: const { data: datasets, isLoading, error } = useDatasets();
 */
export function useDatasets(limit = 50) {
  return useQuery({
    queryKey: ['datasets', limit],
    queryFn: () => fetchDatasets(limit),
    staleTime: 30_000,
  });
}
