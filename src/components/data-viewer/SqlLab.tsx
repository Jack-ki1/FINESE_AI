import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useDatumStore } from '@/store/datum.store';

type DuckDB = any;

export function SqlLab() {
  const { dataset } = useDatumStore();
  const [query, setQuery] = useState('SELECT * FROM df LIMIT 10');
  const [result, setResult] = useState<Record<string,any>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<'duckdb' | 'js' | 'loading'>('loading');
  const dbRef = useRef<DuckDB | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dataset?.length) { setEngine('js'); return; }
      try {
        const duckdb = await import('@duckdb/duckdb-wasm');
        // Try to init — if wasm fails we fall back to JS engine honestly
        if (duckdb && !cancelled) {
          setEngine('duckdb');
          // Minimal init: create in-memory DB if available
          try {
            const JSDELIVR_BUNDLES = (duckdb as any).getJsDelivrBundles?.();
            const bundle = JSDELIVR_BUNDLES ? await (duckdb as any).selectBundle(JSDELIVR_BUNDLES) : null;
            if (bundle?.mainWorker) {
              const workerUrl = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }));
              const worker = new Worker(workerUrl);
              const logger = new (duckdb as any).ConsoleLogger();
              const db = new (duckdb as any).AsyncDuckDB(logger, worker);
              await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
              URL.revokeObjectURL(workerUrl);
              dbRef.current = db;
            }
          } catch (e) {
            console.warn('DuckDB init failed, falling back to JS:', e);
            if (!cancelled) setEngine('js');
          }
        } else if (!cancelled) setEngine('js');
      } catch {
        if (!cancelled) setEngine('js');
      }
    })();
    return () => { cancelled = true; };
  }, [dataset]);

  const run = async () => {
    if(!dataset?.length) { setError('No dataset loaded'); return; }
    setError(null);
    try {
      // If DuckDB is ready, use it
      if (engine === 'duckdb' && dbRef.current) {
        try {
          const conn = await dbRef.current.connect();
          // Register dataset as table df
          await conn.insertJSONFromPath?.('df.json', { data: dataset });
          // For real, we'd also try arrow: if insertJSON not available, fallback
          const arrow = await conn.query(query);
          const rows = arrow.toArray().map((r:any)=> r.toJSON());
          setResult(rows);
          await conn.close();
          return;
        } catch (e:any) {
          throw new Error(`DuckDB error: ${e.message} — falling back to JS shows only basic SELECT * LIMIT`);
        }
      }
      // Honest JS fallback — only handles trivial shapes, clearly labeled
      const lower = query.trim().toLowerCase();
      if (lower.startsWith('select * from df')) {
        const m = query.match(/limit\s+(\d+)/i);
        const n = m ? parseInt(m[1]) : 10;
        const whereMatch = query.match(/where\s+(.+?)(?:\s+limit|\s+order|$)/i);
        let filtered = dataset;
        if (whereMatch) {
          // Very limited where handling — warn user
          setError('JS engine: WHERE clauses are not evaluated — showing unfiltered rows. Load DuckDB for full SQL.');
        }
        if (lower.includes('order by')) {
          const orderMatch = query.match(/order by\s+(\w+)/i);
          const col = orderMatch?.[1];
          if (col && Object.prototype.hasOwnProperty.call(dataset[0] ?? {}, col)) {
            filtered = [...dataset].sort((a,b)=> String(a[col]).localeCompare(String(b[col])));
          }
        }
        setResult(filtered.slice(0,n));
        return;
      }
      if (lower.includes('count(*)')) {
        setResult([{ count: dataset.length }]);
        return;
      }
      // For AVG etc, compute locally and be explicit
      const avgMatch = query.match(/avg\s*\(\s*(\w+)\s*\)/i);
      if (avgMatch) {
        const col = avgMatch[1];
        const vals = dataset.map(r=>Number(r[col])).filter(n=>!isNaN(n));
        const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
        setResult([{ [`avg_${col}`]: avg, n: vals.length, _note: 'JS-computed avg (local, not DuckDB)' }]);
        return;
      }
      // Unknown query — don't pretend
      setError('JS engine cannot execute this query. Use a simple “SELECT * FROM df LIMIT 10” or enable DuckDB (auto-loads when dataset present).');
      setResult([]);
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
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Natural Language → SQL</h4>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${engine==='duckdb' ? 'bg-[hsl(var(--verified))]/10 text-[hsl(var(--verified))] border-[hsl(var(--verified))]/30' : engine==='js' ? 'bg-[hsl(var(--estimated))]/10 text-[hsl(var(--estimated))] border-[hsl(var(--estimated))]/30 border-dashed' : 'bg-muted text-muted-foreground'}`}>
            {engine==='duckdb' ? 'DuckDB-WASM • Verified' : engine==='js' ? 'JS engine • Estimated' : 'Loading…'}
          </span>
        </div>
        <div className="flex gap-2">
          <input id="nl" placeholder='e.g. "average revenue by region" or "top 10 rows by salary"' className="flex-1 h-9 px-3 text-sm border rounded-md bg-background" onKeyDown={e=>{ if(e.key==='Enter') nlToSql((e.target as HTMLInputElement).value); }} />
          <Button size="sm" onClick={()=> nlToSql((document.getElementById('nl') as HTMLInputElement)?.value || '')}>Generate</Button>
        </div>
        <textarea value={query} onChange={e=>setQuery(e.target.value)} className="w-full h-20 p-2 text-xs font-mono border rounded bg-muted/30" />
        <div className="flex items-center gap-2">
          <Button onClick={run} size="sm" disabled={engine==='loading'}>Run {engine==='duckdb' ? 'DuckDB' : 'SQL'}</Button>
          <span className="text-[11px] text-muted-foreground">Engine: {engine==='duckdb' ? 'In-browser DuckDB (real SQL)' : 'Lightweight JS — COUNT/AVG/SELECT * LIMIT only. Complex queries need DuckDB.'}</span>
        </div>
        {error && <p className="text-xs text-[hsl(var(--critical))] bg-[hsl(var(--critical))]/10 border border-[hsl(var(--critical))]/20 rounded p-2">{error}</p>}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-sm font-semibold mb-2">Result — {result.length} rows <span className="font-mono text-xs text-muted-foreground">{engine==='duckdb' ? '• Verified in-browser' : '• Estimated'}</span></h4>
        <div className="overflow-auto max-h-[300px] border rounded">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/50">{Object.keys(result[0]||{}).map(c=><th key={c} className="p-2 text-left font-mono text-[10px]">{c}</th>)}</tr></thead>
            <tbody>{result.map((r,i)=><tr key={i} className="border-t hover:bg-muted/30">{Object.values(r).map((v,j)=><td key={j} className="p-2 truncate max-w-[150px] font-mono">{String(v??'')}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">In-browser SQL — no data leaves your device. Ask chat for verified server-side queries or use Data Viewer → Auto-EDA.</p>
      </div>
    </div>
  );
}
