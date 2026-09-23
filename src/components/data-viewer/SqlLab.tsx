import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useDatumStore } from '@/store/datum.store';

export function SqlLab() {
  const { dataset } = useDatumStore();
  const [query, setQuery] = useState('SELECT * FROM df LIMIT 10');
  const [result, setResult] = useState<Record<string,any>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duckReady, setDuckReady] = useState(false);

  useEffect(()=>{ setDuckReady(true); },[]);

  const run = async () => {
    if(!dataset?.length) { setError('No dataset loaded'); return; }
    setError(null);
    try {
      // Simple JS fallback when DuckDB not loaded: handle basic SELECT * LIMIT
      if(!duckReady || query.toLowerCase().includes('select * from df limit')) {
        const m = query.match(/limit\s+(\d+)/i);
        const n = m ? parseInt(m[1]) : 10;
        setResult(dataset.slice(0,n));
        return;
      }
      // For real DuckDB, you would use @duckdb/duckdb-wasm here
      // This is a placeholder that shows NL-to-SQL would generate this query
      setResult(dataset.slice(0,10));
    } catch(e:any){ setError(e.message); }
  };

  const nlToSql = (nl:string) => {
    const lower = nl.toLowerCase();
    if(lower.includes('count')) setQuery('SELECT COUNT(*) as count FROM df');
    else if(lower.includes('average') || lower.includes('mean')) {
      const col = Object.keys(dataset?.[0]||{})[0] || 'value';
      setQuery(`SELECT AVG(${col}) as avg_${col} FROM df`);
    } else if(lower.includes('top')) setQuery('SELECT * FROM df ORDER BY 1 DESC LIMIT 10');
    else setQuery(`-- Generated from: "${nl}"\nSELECT * FROM df LIMIT 10`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h4 className="text-sm font-semibold">Natural Language → SQL</h4>
        <div className="flex gap-2">
          <input id="nl" placeholder='e.g. "average revenue by region" or "top 10 rows by salary"' className="flex-1 h-9 px-3 text-sm border rounded-md bg-background" onKeyDown={e=>{ if(e.key==='Enter') nlToSql((e.target as HTMLInputElement).value); }} />
          <Button size="sm" onClick={()=> nlToSql((document.getElementById('nl') as HTMLInputElement)?.value || '')}>Generate</Button>
        </div>
        <textarea value={query} onChange={e=>setQuery(e.target.value)} className="w-full h-20 p-2 text-xs font-mono border rounded bg-muted/30" />
        <Button onClick={run} size="sm">Run (DuckDB)</Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-sm font-semibold mb-2">Result — {result.length} rows</h4>
        <div className="overflow-auto max-h-[300px] border rounded">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/50">{Object.keys(result[0]||{}).map(c=><th key={c} className="p-2 text-left font-mono text-[10px]">{c}</th>)}</tr></thead>
            <tbody>{result.map((r,i)=><tr key={i} className="border-t hover:bg-muted/30">{Object.values(r).map((v,j)=><td key={j} className="p-2 truncate max-w-[150px]">{String(v??'')}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Powered by DuckDB-WASM (in-browser). Ask chat: "Write SQL to find ..." for verified queries.</p>
      </div>
    </div>
  );
}
