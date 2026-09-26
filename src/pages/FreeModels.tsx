import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Zap, KeyRound, MonitorDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PROVIDER_DETAILS, type AIProvider } from '@/store/settings.store';
import { FREE_CHAIN_META as FREE_CHAIN } from '@/lib/freeChain';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { checkOllama } from '@/lib/ollama';

interface BenchRow {
  provider: string;
  model: string;
  tool_call_accuracy: number | null;
  avg_latency_ms: number | null;
  runs: number;
  last_status: string | null;
  updated_at: string;
}

const FREE_PROVIDERS: AIProvider[] = [
  'groq', 'cerebras', 'openrouter', 'google', 'nvidia', 'huggingface',
  'mistral', 'cloudflare', 'github', 'sambanova', 'cohere', 'ollama',
];

export default function FreeModels() {
  useDocumentHead(
    'Free models — there is no pricing page. Ever. | FINESE AI',
    'FINESE AI routes over genuinely-free tiers plus local models — no subscription, no metered trial. See live reliability benchmarks.'
  );
  const [rows, setRows] = useState<BenchRow[]>([]);
  const [benchError, setBenchError] = useState(false);
  const [ollama, setOllama] = useState<{ running: boolean; models: string[] } | null>(null);

  useEffect(() => {
    supabase.from('model_benchmarks').select('*').order('tool_call_accuracy', { ascending: false }).limit(20)
      .then(({ data, error }) => {
        if (error) setBenchError(true);
        else setRows((data || []) as BenchRow[]);
      });
    checkOllama().then((s) => setOllama({ running: s.running, models: s.models })).catch(() => {});
  }, []);

  const benchByProvider = new Map(rows.map((r) => [r.provider, r]));

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[image:var(--gradient-brand)] flex items-center justify-center text-primary-foreground font-display font-bold text-sm">F</div>
            <span className="font-display font-bold tracking-tight">FINESE AI</span>
          </Link>
          <Link to="/auth?mode=signup" className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Start free
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-verified/10 text-verified border border-verified/20">
          <Zap className="w-3.5 h-3.5" /> $0.00 · auto-failover across providers
        </span>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight mt-5">
          There is no pricing page. <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">Ever.</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mt-5 max-w-2xl mx-auto">
          Competitors sell metered trials designed to expire. FINESE routes over other companies&apos; genuinely-free tiers —
          plus fully offline local models — with automatic failover when one rate-limits you mid-session. It structurally
          can&apos;t expire on you.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/settings" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors">
            <KeyRound className="w-4 h-4" /> Add your free keys
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-verified" /> Reliability leaderboard — verified, not marketed
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Weekly benchmark: does each free model correctly call FINESE&apos;s own tools and produce parseable output?
          {benchError || rows.length === 0 ? (
            <> No benchmark runs recorded yet — run the <code className="font-mono">model-benchmark</code> edge function weekly via cron. Chain order below is the serving order.</>
          ) : (
            <> Live results from the <code className="font-mono">model_benchmarks</code> table.</>
          )}
        </p>
        <div className="mt-6 rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Provider · model</th>
                <th className="px-4 py-3 font-medium">Tool-call accuracy</th>
                <th className="px-4 py-3 font-medium">Avg latency</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {FREE_CHAIN.map((link) => {
                const b = benchByProvider.get(link.provider);
                return (
                  <tr key={link.provider} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{link.provider} · {link.model}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {b?.tool_call_accuracy != null ? `${(b.tool_call_accuracy * 100).toFixed(0)}% (${b.runs} runs)` : 'not yet benchmarked'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{b?.avg_latency_ms != null ? `${(b.avg_latency_ms / 1000).toFixed(1)}s` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${b?.last_status === 'ok' ? 'bg-verified/10 text-verified border-verified/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {b?.last_status || 'pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="font-display font-bold text-2xl tracking-tight">All 12 free providers — what each needs</h2>
        <p className="text-sm text-muted-foreground mt-2">A free API key and 30 seconds each. No card, no subscription.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {FREE_PROVIDERS.map((p) => {
            const d = PROVIDER_DETAILS[p];
            return (
              <div key={p} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold capitalize">{p === 'huggingface' ? 'Hugging Face' : p === 'google' ? 'Google AI Studio' : p === 'github' ? 'GitHub Models' : p}</h3>
                  <a href={d.keyUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline">Get key</a>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{d.limits}</p>
                <ol className="mt-2 space-y-1 text-xs text-muted-foreground list-decimal pl-4">
                  {d.howTo.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            );
          })}
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5">
            <h3 className="font-display font-semibold flex items-center gap-2"><MonitorDown className="w-4 h-4 text-primary" /> Ollama — this machine</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {ollama === null ? 'Checking…' : ollama.running ? `Running locally with ${ollama.models.length} model(s): ${ollama.models.slice(0, 3).join(', ') || 'none pulled yet'}` : 'Not detected on this device.'}
            </p>
            <Link to="/settings" className="text-[11px] text-primary hover:underline mt-2 inline-block">One-line setup in Settings → AI</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FINESE AI — free forever, structurally.</span>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </div>
      </footer>
    </div>
  );
}
