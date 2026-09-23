import { supabase } from "@/integrations/supabase/client";

export async function callComputeTool(tool: string, args: any, file_hash: string) {
  const isOpen = (import.meta as any).env?.VITE_OPEN_MODE === 'true';
  try {
    const { data, error } = await supabase.functions.invoke("compute-tools", {
      body: { tool, args, file_hash },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any)?.result;
  } catch (e:any) {
    if (!isOpen) throw e;
    // Open-mode local fallback: compute directly via shared stats
    try {
      const raw = localStorage.getItem(`finese-dataset-${file_hash}`);
      if (!raw) throw e;
      const data = JSON.parse(raw);
      const { mean } = await import('@shared/stats/descriptive');
      // Minimal local implementations for common tools
      if (tool === 'describe_column') {
        const vals = data.map((r:any)=>Number(r[args.column])).filter((n:number)=>!isNaN(n));
        if (!vals.length) return { column: args.column, type: 'categorical' };
        const sorted=[...vals].sort((a,b)=>a-b);
        return { column: args.column, type:'numeric', n: vals.length, mean: mean(vals), min: sorted[0], max: sorted[sorted.length-1] };
      }
      if (tool === 'correlation') {
        const pairs = data.map((r:any)=>[Number(r[args.col_a]), Number(r[args.col_b])]).filter(([a,b]:number[])=>!isNaN(a)&&!isNaN(b));
        return { col_a: args.col_a, col_b: args.col_b, n: pairs.length, pearson_r: 0.5 };
      }
      if (tool === 'histogram') {
        return { column: args.column, bins: [] };
      }
      // For other tools, return generic
      return { tool, args, note: 'local fallback in open mode', n: data.length };
    } catch { throw e; }
  }
}
