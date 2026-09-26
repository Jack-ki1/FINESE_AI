import { useEffect, useState } from 'react';
import { BellRing, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWatchStore, aggValue } from '@/store/watch.store';
import { toast } from 'sonner';

interface Props {
  fileHash: string;
  fileName?: string;
  rows: Record<string, any>[];
  profile: any[];
}

// "Re-run this on the latest version of this file, tell me if the number
// moves more than X%." MVP runs the check client-side whenever the dataset
// loads (server cron over compute_jobs is the follow-up for true scheduling).
export function WatchManager({ fileHash, fileName, rows, profile }: Props) {
  const { watches, add, remove, check } = useWatchStore();
  const numericCols = (profile || []).filter((p) => p.type === 'numeric').map((p) => p.col);
  const [column, setColumn] = useState(numericCols[0] || '');
  const [agg, setAgg] = useState<'mean' | 'sum'>('mean');
  const [threshold, setThreshold] = useState(5);

  useEffect(() => {
    setColumn((c) => c || numericCols[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileHash]);

  useEffect(() => {
    if (!rows?.length) return;
    const alerts = check(fileHash, rows);
    for (const a of alerts) toast.warning('Watched number moved', { description: a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileHash, rows?.length]);

  const mine = watches.filter((w) => w.fileHash === fileHash);
  const preview = column ? aggValue(rows || [], column, agg) : null;

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Watch a number — get told when it moves</h3>
      </div>
      {numericCols.length === 0 ? (
        <p className="text-xs text-muted-foreground">No numeric columns to watch in this file.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Column</Label>
            <select value={column} onChange={(e) => setColumn(e.target.value)} className="h-8 border rounded px-2 text-xs bg-background">
              {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Metric</Label>
            <select value={agg} onChange={(e) => setAgg(e.target.value as any)} className="h-8 border rounded px-2 text-xs bg-background">
              <option value="mean">mean</option>
              <option value="sum">sum</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Alert at ≥ %</Label>
            <Input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value) || 5)} className="h-8 text-xs w-20" />
          </div>
          <Button size="sm" onClick={() => {
            if (!column) return;
            add({ fileHash, fileName: fileName || fileHash.slice(0, 8), column, agg, thresholdPct: threshold, lastValue: preview });
            toast.success(`Watching ${agg}(${column})`, { description: `Alerts when it moves ≥ ${threshold}% on reload.` });
          }}>
            Watch{preview !== null ? ` (now ${preview.toFixed(2)})` : ''}
          </Button>
        </div>
      )}
      {mine.length > 0 && (
        <div className="space-y-1.5">
          {mine.map((w) => (
            <div key={w.id} className="flex items-center gap-2 text-xs p-2 rounded-lg border bg-muted/20">
              <span className="font-mono">{w.agg}({w.column}) ≥ {w.thresholdPct}%</span>
              <span className="text-muted-foreground">last: {w.lastValue?.toFixed(2) ?? '—'}</span>
              <button onClick={() => remove(w.id)} className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground" title="Remove watch">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
