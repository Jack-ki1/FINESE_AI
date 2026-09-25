import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  ShieldCheck, Database, Sparkles, GitCompare, BarChart3, Braces, FlaskConical,
  Blocks, FileText, Cpu, Globe, Users, Zap, ArrowRight, Play, CheckCircle2,
  Layers, Workflow, FileSpreadsheet, Brain, Search, Wrench, LineChart,
  Code2, Table2, Eye, Lock, Cloud, Github, Boxes, TrendingUp, MessageSquare,
  ChevronRight, Star, Quote
} from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAV */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-bold text-sm">F</div>
            <span className="font-bold tracking-tight">FINESE AI</span>
            <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/10 text-verified border border-verified/20 ml-1">VERIFIED COMPUTE</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#tools" className="hover:text-foreground">16 Tools</a>
            <a href="#stack" className="hover:text-foreground">Stack</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground px-3 py-1.5">Sign in</Link>
            <Link to="/chat"><Button size="sm" className="rounded-full gap-1.5">Open Chat <ArrowRight className="w-3.5 h-3.5"/></Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO — colorful, gradient, mockup */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-amber-500/10" />
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-500/15 to-pink-500/15 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full bg-verified/10 text-verified border border-verified/20">
                <span className="w-2 h-2 rounded-full bg-verified animate-pulse" /> 16 verified tools • auditable receipts • free forever
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95]">
                Chat with your data.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-cyan-500 to-teal-600">Get numbers you can defend.</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                FINESE AI is a <span className="font-semibold text-foreground">chat-first data intelligence platform</span> for professionals. Upload a CSV, ask “what’s driving churn?” and get <span className="font-mono text-verified">● Verified</span> charts, stats, and models — computed server-side on your rows, with a receipt you can hand to your boss. Not guessed. Not hallucinated.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link to="/chat"><Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20"><Play className="w-4 h-4"/> Try in Chat — no card</Button></Link>
                <Link to="/data/upload"><Button size="lg" variant="outline" className="rounded-full gap-2"><FileSpreadsheet className="w-4 h-4"/> Upload a file</Button></Link>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-verified"/> 16 server-verified tools</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-verified"/> DuckDB-WASM in browser</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-verified"/> MCP for Claude/Cursor</span>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 border-2 border-background" />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 border-2 border-background" />
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-background" />
                </div>
                <p className="text-xs text-muted-foreground">Built for analysts, data scientists, and product teams who need <span className="font-medium text-foreground">receipts, not vibes</span>.</p>
              </div>
            </div>
            {/* Mock chat card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 rounded-[24px] blur-xl" />
              <div className="relative rounded-[20px] border bg-card shadow-2xl overflow-hidden">
                <div className="h-10 flex items-center justify-between px-4 border-b bg-muted/30">
                  <span className="text-xs font-mono flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"/> FINESE chat • sales_data.csv — 12,400 rows</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/10 text-verified border border-verified/20">3 verified</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-end"><div className="max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-xs">What’s driving revenue decline in the West?</div></div>
                  <div className="rounded-2xl border bg-card p-3 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wide text-verified"><ShieldCheck className="w-3.5 h-3.5"/> Verified · real compute — group_by_aggregate + correlation + linear_regression</div>
                    <p className="text-xs leading-relaxed">West is <span className="font-mono bg-amber-500/10 px-1 rounded">-14.2% vs East</span> (mean $7,500 vs $14,200, <span className="font-mono text-verified">p=0.003</span>, n=842). Discount is correlated with revenue at <span className="font-mono">r=-0.62</span>.</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 border flex items-center justify-center"><BarChart3 className="w-5 h-5 text-violet-500"/></div>
                      <div className="h-16 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border flex items-center justify-center"><LineChart className="w-5 h-5 text-cyan-600"/></div>
                      <div className="h-16 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border flex items-center justify-center"><Table2 className="w-5 h-5 text-amber-600"/></div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/10 text-verified border border-verified/20">● Verified · r=-0.62 (n=842)</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border">Receipt →</span>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 flex items-center gap-2">
                  <div className="flex-1 h-8 rounded-full border bg-muted/50 px-3 flex items-center text-xs text-muted-foreground">Ask a follow-up…</div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"><ArrowRight className="w-4 h-4"/></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-mono text-muted-foreground">Trusted pattern: <span className="text-verified">● Verified</span> = server computed • <span className="text-estimated">◐ Estimated</span> = AI scaffolding</span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3"/> Every number has a receipt</span>
            <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3"/> Your data never trains the model</span>
            <span className="inline-flex items-center gap-1"><Cloud className="w-3 h-3"/> Runs on your rows, not a sample</span>
          </span>
        </div>
      </section>

      {/* FEATURES — colorful */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything a data pro needs — verified</h2>
          <p className="text-sm text-muted-foreground mt-2">Not a chatbot that guesses. A tool that computes. Each feature below is either <span className="font-mono text-verified">Verified</span> (real tool on your data) or clearly marked <span className="font-mono text-estimated">Estimated</span>.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] to-transparent hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-violet-600"/></span> Auto profiling</CardTitle><CardDescription className="text-xs">Column types, nulls, outliers, distributions, correlations — health score in seconds. 100% local parsing via Web Worker.</CardDescription></CardHeader>
          </Card>
          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-transparent hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-cyan-600"/></span> 16 verified tools</CardTitle><CardDescription className="text-xs">describe, correlation, t-test, ANOVA, regression, K-Means, drift, PCA, forecast, Random Forest, semantic metric…</CardDescription></CardHeader>
          </Card>
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center"><FileSpreadsheet className="w-4 h-4 text-amber-600"/></span> SQL Lab • DuckDB-WASM</CardTitle><CardDescription className="text-xs">Real in-browser SQL on your file. No data leaves your device. Evidence: “DuckDB-WASM • Verified”.</CardDescription></CardHeader>
          </Card>
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center"><Brain className="w-4 h-4 text-emerald-600"/></span> Real ML</CardTitle><CardDescription className="text-xs">Naive Bayes + bagged CART Random Forest with holdout accuracy, confusion matrix, permutation importance — not fake numbers.</CardDescription></CardHeader>
          </Card>
          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/[0.07] to-transparent hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center"><Braces className="w-4 h-4 text-pink-600"/></span> Semantic layer</CardTitle><CardDescription className="text-xs">Define <span className="font-mono">profit = revenue - cost</span> once in Settings → Metrics. The model checks it before guessing.</CardDescription></CardHeader>
          </Card>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/[0.07] to-transparent hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-600"/></span> Connect & extend</CardTitle><CardDescription className="text-xs">Google Sheets (read-only), 2-file joins on a key, MCP for Claude/Cursor, embeddable verified widget.</CardDescription></CardHeader>
          </Card>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-center">How it works — from file to defendable number in 4 steps</h2>
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            {[
              { n:"01", title:"Upload", desc:"CSV/TSV/XLSX/JSON up to 20MB • 250k rows. Parsed in a Web Worker, never blocks UI.", icon: FileSpreadsheet, color:"bg-violet-500" },
              { n:"02", title:"Profile", desc:"Server builds types, nulls, outliers, correlations, health score. Cached by file_hash.", icon: Search, color:"bg-cyan-500" },
              { n:"03", title:"Ask", desc:"Chat calls a verified tool. Not a guess — it reads your rows.", icon: MessageSquare, color:"bg-amber-500" },
              { n:"04", title:"Verify & share", desc:"Chart/table shows ● Verified + receipt. Export HTML report stamped “14/16 verified”.", icon: FileText, color:"bg-emerald-500" },
            ].map(s=>(
              <div key={s.n} className="relative rounded-2xl border bg-card p-5">
                <div className={`w-8 h-8 rounded-xl ${s.color} text-white flex items-center justify-center text-xs font-bold`}>{s.n}</div>
                <s.icon className="w-5 h-5 text-muted-foreground mt-3"/>
                <h3 className="font-semibold text-sm mt-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">16 verified tools — the moat</h2>
            <p className="text-xs text-muted-foreground mt-1">Each returns <span className="font-mono text-verified">verified:true</span> + <span className="font-mono">confidence {`{strength, reason}`}</span> and a potential <span className="font-mono text-amber-600">flagged</span> if n is small or p≈0.05.</p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-full bg-verified/10 text-verified border border-verified/20">● Verified · real compute</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["describe_column","mean/median/std/outliers","violet"],
            ["correlation","Pearson r, n, warning","cyan"],
            ["ttest / anova","Welch & one-way, p-value","amber"],
            ["group_by_aggregate","sum/mean/median/count","violet"],
            ["linear_regression","slope, R², p","emerald"],
            ["kmeans","centroids, silhouette","cyan"],
            ["drift_check","PSI + KS","pink"],
            ["pca","eigenvalues, loadings","violet"],
            ["forecast","Holt linear • MAE/RMSE","amber"],
            ["random_forest","bagged CART • importance","emerald"],
            ["train_classifier","Naive Bayes","blue"],
            ["outliers","IQR / z-score","amber"],
            ["histogram","bins","cyan"],
            ["filter_count","count + sample","blue"],
            ["semantic_metric","revenue-cost row-wise","pink"],
            ["join_datasets","inner/left on key","violet"],
          ].map(([name,desc,color])=>(
            <div key={name} className="rounded-xl border bg-card p-3 flex items-start gap-2.5">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${color==="violet"?"bg-violet-500":color==="cyan"?"bg-cyan-500":color==="amber"?"bg-amber-500":color==="emerald"?"bg-emerald-500":color==="pink"?"bg-pink-500":"bg-blue-500"}`} />
              <div><p className="text-xs font-mono font-medium">{name}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border bg-amber-500/[0.06] border-amber-500/20 p-3 flex gap-2 items-start">
          <FlaskConical className="w-4 h-4 text-amber-600 mt-0.5"/>
          <p className="text-xs leading-relaxed"><span className="font-semibold">Verifier pass:</span> every verified result is checked for small-n, p≈0.05, Simpson risk, unit mismatch → <span className="font-mono bg-amber-500/15 px-1 rounded">● Verified · flagged</span> if the math is technically correct but methodologically shaky. No competitor does this.</p>
        </div>
      </section>

      {/* ARCH + STACK */}
      <section id="stack" className="bg-muted/20 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Workflow className="w-5 h-5 text-primary"/> Architecture — clean, auditable</h2>
            <div className="rounded-2xl border bg-card p-4 font-mono text-[11px] leading-relaxed overflow-auto">
              <div className="text-muted-foreground">Frontend (React + Vite + Zustand) — components never call backend directly</div>
              <div className="my-1">streaming.ts / ingest-client.ts / parsers → <span className="text-primary">HTTPS / SSE</span></div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <span className="rounded-lg border p-2 bg-violet-500/5">dataset-ingest<br/><span className="text-muted-foreground">validate → storage → profile</span></span>
                <span className="rounded-lg border p-2 bg-cyan-500/5">FINESE-chat<br/><span className="text-muted-foreground">6-round tool loop</span></span>
                <span className="rounded-lg border p-2 bg-emerald-500/5">compute-tools (16)<br/><span className="text-muted-foreground">verified stats/ML</span></span>
                <span className="rounded-lg border p-2 bg-amber-500/5">dataset-fetch<br/><span className="text-muted-foreground">cache + RLS</span></span>
              </div>
              <div className="mt-2 text-muted-foreground">Storage: datasets/&lt;user_id&gt;/&lt;file_hash&gt;.json • DB: datasets, profiles, jobs, metric_definitions, workspaces • MCP: 18 tools behind same auth</div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">RLS owner-only</span>
              <span className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">JWT + MCP_API_KEY</span>
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Rate-limit per user</span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">Receipt per artifact</span>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Boxes className="w-5 h-5 text-primary"/> Stack — boring, fast, portable</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card"><CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5"/> Frontend</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground space-y-1"><p>React 18 + Vite 5 + SWC</p><p>Zustand + TanStack Query</p><p>shadcn/ui + Recharts</p><p>PapaParse + XLSX + DuckDB-WASM</p><p>Pyodide in Web Worker</p></CardContent></Card>
              <Card className="bg-card"><CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5"/> Backend</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground space-y-1"><p>Supabase + Deno edge</p><p>Postgres RLS + Storage</p><p>OpenAI-compatible gateway</p><p>MCP 18 tools</p><p>Upstash-ready rate limit</p></CardContent></Card>
            </div>
            <Card className="bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border-violet-500/20">
              <CardHeader className="pb-2"><CardTitle className="text-xs">Free forever — the pitch</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground">OpenRouter 50/d (1k/d after $10), Groq 14k/d, HF $0.10/mo, Ollama unlimited local. Pick in <span className="font-mono">Settings → AI</span>. Most competitors cap free at 5 msgs/month. Here free <em>is</em> the product.</CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-xl font-bold text-center">Who it’s for — and what they ship faster</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-600"/> Growth analyst</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Wizards: “Find what’s driving activation” → group-by + correlation + regression, all verified, export stamped report to Slack. No more spreadsheet joins.</CardContent></Card>
          <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-600"/> Data scientist</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Train NB vs Random Forest, compare permutation importance, run PCA to explain variance, forecast next 6 weeks — receipts for every number.</CardContent></Card>
          <Card className="hover:shadow-md transition-shadow"><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-amber-600"/> Product team</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Define <span className="font-mono">active = last_seen &lt; 7d</span> once, share workspace, comment on a verified chart, embed it in Notion via signed &lt;iframe&gt;.</CardContent></Card>
        </div>
      </section>

      {/* TESTIMONIAL STYLE + CTA */}
      <section className="relative overflow-hidden border-y">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-cyan-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Quote className="w-6 h-6 text-muted-foreground mx-auto"/>
            <p className="text-sm sm:text-base font-medium">“Finally a chat tool that doesn’t hallucinate p-values. The flagged badge caught a t-test on n=18 I would have shipped.”</p>
            <p className="text-xs text-muted-foreground">— Data lead, Series B marketplace</p>
            <div className="flex justify-center gap-2 pt-2">
              <Link to="/chat"><Button size="lg" className="rounded-full gap-2">Open Chat <ArrowRight className="w-4 h-4"/></Button></Link>
              <Link to="/data/upload"><Button size="lg" variant="outline" className="rounded-full">Upload data</Button></Link>
            </div>
            <div className="flex justify-center gap-3 pt-2 text-[11px] font-mono text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-amber-500"/> No credit card for free tier</span>
              <span className="inline-flex items-center gap-1"><Github className="w-3 h-3"/> Supabase + Deno + Recharts</span>
              <span className="inline-flex items-center gap-1"><Layers className="w-3 h-3"/> 250k rows • 20MB</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 justify-between text-xs text-muted-foreground">
          <span>© 2026 FINESE AI — proprietary. Your data stays in <span className="font-mono">datasets/&lt;user_id&gt;</span> and never trains the model.</span>
          <span className="flex gap-4"><Link to="/settings" className="hover:text-foreground">Settings</Link><Link to="/data/upload" className="hover:text-foreground">Upload</Link><Link to="/chat" className="hover:text-foreground">Chat</Link></span>
        </div>
      </footer>
    </div>
  );
}
