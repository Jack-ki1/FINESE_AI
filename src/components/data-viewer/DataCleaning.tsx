import { useState } from 'react';
import type { ColumnProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { useDatumStore } from '@/store/datum.store';
import { toast } from 'sonner';

interface Props { data: Record<string, any>[]; profile: ColumnProfile[]; }

export function DataCleaning({ data, profile }: Props) {
  const { setTransformedDataset, setActiveView, addChangelogEntry } = useDatumStore();
  const [preview, setPreview] = useState<Record<string, any>[] | null>(null);

  const missingCols = profile.filter(p=>p.nullCount>0);
  const dupCount = (()=>{ const seen=new Set(); let dups=0; data.forEach(r=>{ const k=JSON.stringify(r); if(seen.has(k)) dups++; else seen.add(k); }); return dups; })();

  const applyDedup = () => {
    const seen=new Set(); const out: Record<string, any>[]=[]; data.forEach(r=>{ const k=JSON.stringify(r); if(!seen.has(k)){ seen.add(k); out.push(r);} });
    setPreview(out); toast.success(`Removed ${data.length-out.length} duplicates`);
  };
  const applyFillMissing = (mode:'mean'|'median'|'mode') => {
    const out = data.map(r=>({ ...r }));
    profile.filter(p=>p.type==='numeric' && p.nullCount>0).forEach(p=>{
      const vals = data.map(r=>Number(r[p.col])).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
      let fill = 0; if(mode==='mean') fill = vals.reduce((a,b)=>a+b,0)/vals.length; else if(mode==='median') fill = vals[Math.floor(vals.length/2)]; else fill = Number(vals[0]);
      out.forEach(row=>{ if(row[p.col]==null || row[p.col]==='') row[p.col]=fill; });
    });
    // categorical mode
    profile.filter(p=>p.type==='categorical' && p.nullCount>0).forEach(p=>{
      const counts:any={}; data.forEach(r=>{ const v=r[p.col]; if(v!=null && v!=='') counts[String(v)]=(counts[String(v)]||0)+1; });
      const top = Object.entries(counts).sort((a:any,b:any)=>b[1]-a[1])[0]?.[0] || 'unknown';
      out.forEach(row=>{ if(row[p.col]==null || row[p.col]==='') row[p.col]=top; });
    });
    setPreview(out); toast.success(`Filled missing with ${mode}`);
  };
  const applyTrim = () => {
    const out = data.map(r=>{ const o:any={}; Object.entries(r).forEach(([k,v])=> o[k]= typeof v==='string'? v.trim(): v); return o; });
    setPreview(out); toast.success('Trimmed strings');
  };
  const commit = () => {
    if(!preview) return;
    setTransformedDataset(preview);
    setActiveView('transformed');
    addChangelogEntry('transform', `Cleaned dataset: ${preview.length} rows`);
    toast.success('Applied to Transformed view');
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold">Duplicates</p>
          <p className="text-2xl font-bold mt-1">{dupCount}</p>
          <p className="text-[11px] text-muted-foreground">{data.length} rows</p>
          <Button size="sm" className="mt-3 w-full" variant="outline" onClick={applyDedup} disabled={dupCount===0}>Remove duplicates</Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold">Missing</p>
          <p className="text-2xl font-bold mt-1">{missingCols.length}</p>
          <p className="text-[11px] text-muted-foreground">columns with nulls</p>
          <div className="flex gap-1 mt-3">
            <Button size="sm" variant="outline" className="flex-1 text-[11px]" onClick={()=>applyFillMissing('mean')}>Mean</Button>
            <Button size="sm" variant="outline" className="flex-1 text-[11px]" onClick={()=>applyFillMissing('median')}>Median</Button>
            <Button size="sm" variant="outline" className="flex-1 text-[11px]" onClick={()=>applyFillMissing('mode')}>Mode</Button>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold">Standardize</p>
          <p className="text-xs text-muted-foreground mt-1">Trim, lowercase, etc.</p>
          <Button size="sm" className="mt-3 w-full" variant="outline" onClick={applyTrim}>Trim strings</Button>
        </div>
      </div>

      {preview && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Preview — {preview.length} rows</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>setPreview(null)}>Discard</Button>
              <Button size="sm" onClick={commit}>Apply to Transformed</Button>
            </div>
          </div>
          <div className="overflow-auto max-h-[300px] border rounded">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/50">{Object.keys(preview[0]||{}).slice(0,6).map(c=><th key={c} className="p-2 text-left font-mono text-[10px]">{c}</th>)}</tr></thead>
              <tbody>{preview.slice(0,20).map((r,i)=><tr key={i} className="border-t">{Object.keys(r).slice(0,6).map(c=><td key={c} className="p-2 truncate max-w-[120px]">{String(r[c]??'')}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-dashed bg-muted/20 p-4">
        <p className="text-xs font-mono text-muted-foreground">Tip: Preview changes here, then Apply. Use chat: "Clean this dataset and handle outliers" for AI-generated cleaning script.</p>
      </div>
    </div>
  );
}
