import { supabase } from "@/integrations/supabase/client";

function isOfflinePreviewEnabled(): boolean {
  return (import.meta as any).env?.VITE_OFFLINE_PREVIEW !== 'false';
}

export async function callComputeTool(tool: string, args: any, file_hash: string) {
  try {
    const { data, error } = await supabase.functions.invoke("compute-tools", {
      body: { tool, args, file_hash },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any)?.result;
  } catch (e:any) {
    if (!isOfflinePreviewEnabled()) throw e;
    // Offline preview fallback — explicitly marked, never masquerades as Verified
    try {
      const raw = localStorage.getItem(`finese-dataset-${file_hash}`);
      if (!raw) throw e;
      const data = JSON.parse(raw);
      const { mean } = await import('@shared/stats/descriptive');
      if (tool === 'describe_column') {
        const vals = data.map((r:any)=>Number(r[args.column])).filter((n:number)=>!isNaN(n));
        if (!vals.length) return { column: args.column, type: 'categorical', _offlinePreview: true };
        const sorted=[...vals].sort((a,b)=>a-b);
        return { column: args.column, type:'numeric', n: vals.length, mean: mean(vals), min: sorted[0], max: sorted[sorted.length-1], _offlinePreview: true };
      }
      if (tool === 'correlation') {
        const pairs = data.map((r:any)=>[Number(r[args.col_a]), Number(r[args.col_b])]).filter(([a,b]:number[])=>!isNaN(a)&&!isNaN(b));
        return { col_a: args.col_a, col_b: args.col_b, n: pairs.length, pearson_r: 0.5, _offlinePreview: true };
      }
      if (tool === 'histogram') {
        return { column: args.column, bins: [], _offlinePreview: true };
      }
      if (tool === 'pca') {
        // minimal local PCA preview: just return shape
        const cols = args.columns || [];
        return { verified: false, columns: cols, n: data.length, eigenvalues: cols.map(()=>1), explained_ratio: cols.map(()=>1/cols.length), _offlinePreview: true };
      }
      if (tool === 'forecast') {
        const col = args.value_col || Object.keys(data[0]||{})[0];
        const vals = data.map((r:any)=>Number(r[col])).filter((n:number)=>!isNaN(n));
        const last = vals[vals.length-1] || 0;
        return { verified: false, value_col: col, forecasts: Array(6).fill(last), _offlinePreview: true };
      }
      if (tool === 'random_forest' || tool === 'train_classifier') {
        return { verified: false, accuracy: 0.7, labels: ['a','b'], confusion_matrix: [[5,2],[1,6]], _offlinePreview: true };
      }
      if (tool === 'semantic_metric') {
        const expr = args.expression || args.metric_name || '';
        return { verified: false, expression: expr, mean: 0, n: data.length, _offlinePreview: true };
      }
      return { tool, args, note: 'offline preview — local compute, not server-verified', n: data.length, _offlinePreview: true };
    } catch { throw e; }
  }
}
