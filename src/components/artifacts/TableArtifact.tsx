import { useState, useMemo } from 'react';
import type { Artifact } from '@/types';
import { formatNumber } from '@/lib/stats';
import { useDatumStore } from '@/store/datum.store';

export function TableArtifact({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || [];
  const [expanded, setExpanded] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = expanded ? 100 : 20;

  if (!data.length) return <p className="text-xs text-muted-foreground p-4">No data</p>;

  const cols = Object.keys(data[0]);

  const filtered = useMemo(() => {
    if (!filter) return data;
    const q = filter.toLowerCase();
    return data.filter(row => cols.some(c => String(row[c] ?? '').toLowerCase().includes(q)));
  }, [data, filter, cols]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const an = Number(av), bn = Number(bv);
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const handleCellClick = (col: string, value: any) => {
    // Click to ask follow-up — like ChatGPT interactive tables
    const store = useDatumStore.getState();
    if (store.sendMessage) {
      const q = `Tell me about rows where ${col} = ${JSON.stringify(String(value))}`;
      // Don't auto-send, just show hint; user can copy
      navigator.clipboard?.writeText(q).catch(()=>{});
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2">
        <input
          placeholder={`Filter ${filtered.length} rows...`}
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          className="flex-1 h-7 px-2 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-[10px] font-mono text-muted-foreground">{sorted.length}/{data.length}</span>
      </div>
      <div className="overflow-auto max-h-[320px] border border-border rounded-md">
        <table className="w-full text-xs">
          <thead>
            <tr className="sticky top-0 bg-secondary z-10">
              {cols.map(c => (
                <th
                  key={c}
                  onClick={() => handleSort(c)}
                  className={`px-3 py-2 text-left font-mono font-medium border-b border-border whitespace-nowrap cursor-pointer hover:text-foreground select-none ${sortCol===c ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <span className="flex items-center gap-1">
                    {c} {sortCol===c && <span className="text-[9px]">{sortDir==='asc'?'▲':'▼'}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="hover:bg-accent/50 transition-colors">
                {cols.map(c => {
                  const v = row[c];
                  const isNull = v === null || v === undefined || v === '';
                  const isNum = typeof v === 'number';
                  return (
                    <td
                      key={c}
                      onClick={() => handleCellClick(c, v)}
                      title="Click to copy follow-up query"
                      className={`px-3 py-1.5 border-b border-border/50 whitespace-nowrap cursor-pointer ${isNum ? 'text-right text-datum-cyan' : ''} ${isNull ? 'italic text-datum-text-3' : ''} hover:bg-primary/5`}
                    >
                      {isNull ? 'null' : isNum ? formatNumber(v) : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-1">
          <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="px-2 py-1 text-[10px] font-mono border border-border rounded disabled:opacity-30 hover:bg-accent">Prev</button>
          <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 text-[10px] font-mono border border-border rounded disabled:opacity-30 hover:bg-accent">Next</button>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">Page {page+1}/{totalPages} • {expanded ? '100' : '20'}/page</span>
        <button onClick={() => setExpanded(!expanded)} className="px-2 py-1 text-[10px] font-mono text-primary hover:bg-accent/50 rounded border border-primary/20">
          {expanded ? 'Compact' : `Expand (${data.length})`}
        </button>
      </div>
    </div>
  );
}
