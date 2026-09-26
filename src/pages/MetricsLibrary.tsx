import { AppShell } from '@/components/layout/AppShell';
import { useMetricsStore } from '@/store/metrics.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Sigma, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MetricsLibrary() {
  const { metrics, remove } = useMetricsStore();
  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><Sigma className="w-5 h-5 text-primary" /></div>
              <div>
                <h1 className="text-xl font-bold">Metric Library</h1>
                <p className="text-xs text-muted-foreground">Browse reusable metrics — defined once in Settings → Metrics, used everywhere via <code>semantic_metric</code>.</p>
              </div>
            </div>
            <Link to="/settings"><Button size="sm" variant="outline" className="gap-1"><Plus className="w-3.5 h-3.5"/> Define metric</Button></Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{metrics.length} metric definitions</CardTitle>
              <CardDescription className="text-xs">Persisted to localStorage <code>finese-metrics</code> and Supabase <code>metric_definitions</code> when signed in. Last-used counts are local approximations.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Sigma className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-sm text-muted-foreground">No metrics yet.</p>
                  <p className="text-xs text-muted-foreground">Define one like <code className="px-1 py-0.5 rounded bg-muted">profit = revenue - cost</code> in Settings → Metrics.</p>
                  <Link to="/settings"><Button size="sm" className="mt-2">Go to Settings → Metrics</Button></Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Expression</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map(m => (
                      <TableRow key={m.name}>
                        <TableCell className="font-mono text-xs font-medium">{m.name}</TableCell>
                        <TableCell className="font-mono text-xs">{m.expression}</TableCell>
                        <TableCell className="text-xs">{(m as any).unit || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate">{m.description || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={()=>{ remove(m.name); toast.success(`Deleted ${m.name}`); }}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <p className="text-[11px] text-muted-foreground">Tip: the model injects <code>metric_definitions</code> into the prompt so it calls <code>semantic_metric</code> with your metric before guessing column meanings.</p>
        </div>
      </div>
    </AppShell>
  );
}
