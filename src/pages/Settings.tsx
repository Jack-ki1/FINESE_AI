import { useState } from 'react';
import { useSettingsStore, FREE_MODELS, PROVIDER_DETAILS, type AIProvider, ACCENT_PRESETS } from '@/store/settings.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings, Cpu, Database, Palette, Shield, Zap, Sigma } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useMetricsStore } from '@/store/metrics.store';
import { useDatumStore } from '@/store/datum.store';
import { checkOllama, OLLAMA_INSTALL } from '@/lib/ollama';

const providers: { id: AIProvider; label: string; desc: string; free: boolean }[] = [
  { id: 'openrouter', label: 'OpenRouter', desc: '15+ :free models, 1 key, 20 RPM 50/d → 1k/d', free: true },
  { id: 'groq', label: 'Groq', desc: 'Fastest LPU, 30 RPM, 1k-14k/d, 300-1000 t/s', free: true },
  { id: 'huggingface', label: 'Hugging Face', desc: '$0.10/mo free, 131K via Router', free: true },
  { id: 'ollama', label: 'Ollama (Local)', desc: 'Unlimited, private, local GPU/CPU', free: true },
  { id: 'google', label: 'Google AI Studio', desc: 'Gemini 1M, 15 RPM 1500/d', free: true },
  { id: 'cerebras', label: 'Cerebras', desc: 'Wafer-Scale, 1M tok/d free, 30× fast', free: true },
  { id: 'mistral', label: 'Mistral', desc: 'Experiment ~1B tok/mo free, Codestral', free: true },
  { id: 'cloudflare', label: 'Cloudflare', desc: '10k neurons/d free, edge', free: true },
  { id: 'nvidia', label: 'NVIDIA NIM', desc: '40 RPM, 1K req/mo free, 1M ctx', free: true },
  { id: 'cohere', label: 'Cohere', desc: 'Trial $5, Command R+ 128K', free: true },
  { id: 'github', label: 'GitHub Models', desc: 'Free w/ GitHub acct, zero new signup', free: true },
  { id: 'sambanova', label: 'SambaNova', desc: 'Fast Llama free tier', free: true },
  { id: 'together', label: 'Together', desc: 'Paid $5 min, 200+ models', free: false },
  { id: 'openai', label: 'OpenAI', desc: 'Paid, gpt-4o / o1', free: false },
  { id: 'anthropic', label: 'Anthropic', desc: 'Paid, Claude 3.5', free: false },
  { id: 'custom', label: 'Custom', desc: 'Any OpenAI-compatible URL', free: false },
];

export default function SettingsPage() {
  const { ai, general, data, setAI, setGeneral, setData, resetAI, testConnection } = useSettingsStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ok:boolean; latency?:number; error?:string}|null>(null);

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    const res = await testConnection();
    setTestResult(res); setTesting(false);
    if(res.ok) toast.success(`Connected${res.latency?` (${res.latency}ms)`:''}`);
    else toast.error(res.error || 'Failed');
  };

  const currentFreeModels = FREE_MODELS[ai.provider] || [];

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Settings className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-xs text-muted-foreground">Control all aspects of FINESE AI — project is open, changes are local to your browser (persisted).</p>
            </div>
          </div>

          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="bg-muted/50 border rounded-xl p-1 flex flex-wrap">
              <TabsTrigger value="ai" className="gap-2"><Cpu className="w-3.5 h-3.5"/> AI</TabsTrigger>
              <TabsTrigger value="metrics" className="gap-2"><Sigma className="w-3.5 h-3.5"/> Metrics</TabsTrigger>
              <TabsTrigger value="general" className="gap-2"><Settings className="w-3.5 h-3.5"/> General</TabsTrigger>
              <TabsTrigger value="data" className="gap-2"><Database className="w-3.5 h-3.5"/> Data</TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2"><Palette className="w-3.5 h-3.5"/> Appearance</TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2"><Shield className="w-3.5 h-3.5"/> Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6 mt-6">
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm"><Zap className="w-4 h-4 text-primary"/> AI Provider — Focus on FREE</CardTitle>
                  <CardDescription className="text-xs">Pick a provider. Free models need no API key (except Hugging Face needs free token). Paid models need your key — stored locally, never sent to our servers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {providers.map(p=>(
                      <button key={p.id} onClick={()=>setAI({provider:p.id, model: FREE_MODELS[p.id]?.[0]?.id || '', useFree:p.free})}
                        className={`p-3 rounded-xl border text-left space-y-1 ${ai.provider===p.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-accent/50'}`}>
                        <div className="flex items-center gap-2"><span className="text-xs font-semibold">{p.label}</span>{p.free && <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/15 text-green-600 border border-green-500/20">FREE</span>}</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">{p.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={ai.useFree} onChange={e=>setAI({useFree:e.target.checked})} className="rounded" />
                      Use free model (no key)
                    </label>
                    <span className="text-[11px] text-muted-foreground ml-auto">Free = no card for OpenRouter/Groq/HF/Ollama/Google</span>
                  </div>

                  <div>
                    <Label className="text-xs">Model — {ai.provider} free models</Label>
                    <div className="grid md:grid-cols-2 gap-2 mt-2 max-h-[260px] overflow-auto border rounded-lg p-2 bg-muted/20">
                      {currentFreeModels.length===0 ? (
                        <p className="text-xs text-muted-foreground p-2">No preset free models for custom — enter model id manually below.</p>
                      ) : currentFreeModels.map(m=>(
                        <button key={m.id} onClick={()=>setAI({model:m.id})}
                          className={`text-left p-2 rounded-lg border text-xs space-y-1 ${ai.model===m.id ? 'border-primary bg-card shadow-sm' : 'border-transparent hover:bg-card/50'}`}>
                          <div className="font-mono font-medium truncate">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{m.id}</div>
                          <div className="flex gap-2 text-[10px]"><span className="px-1 rounded bg-muted">{m.context}</span><span className="px-1 rounded bg-green-500/10 text-green-700">{m.cost}</span>{m.speed && <span className="px-1 rounded bg-primary/10">{m.speed}</span>}</div>
                          {m.bestFor && <div className="text-[10px] text-muted-foreground">{m.bestFor}</div>}
                        </button>
                      ))}
                    </div>
                    <Input value={ai.model} onChange={e=>setAI({model:e.target.value})} placeholder="model id (e.g. openrouter/free)" className="mt-2 h-8 text-xs font-mono" />
                  </div>

                  {/* Provider-specific expanded details — researched 2026 */}
                  {(() => { const d = PROVIDER_DETAILS[ai.provider]; if (!d) return null; return (
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold capitalize">{ai.provider} — details</h4>
                        <div className="flex gap-2">
                          <a href={d.docs} target="_blank" className="text-[11px] underline text-primary">Docs</a>
                          <a href={d.keyUrl} target="_blank" className="text-[11px] underline text-primary">Get key</a>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        <div><span className="font-medium">Base URL:</span> <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] break-all">{d.baseUrl || ai.baseUrl || 'custom'}</code></div>
                        <div><span className="font-medium">Limits:</span> <span className="text-muted-foreground">{d.limits}</span></div>
                      </div>
                      <div>
                        <p className="text-xs font-medium">How to get started:</p>
                        <ol className="list-decimal pl-4 text-xs text-muted-foreground space-y-0.5 mt-1">
                          {d.howTo.map((s,i)=><li key={i}>{s}</li>)}
                        </ol>
                      </div>
                      <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">{d.notes}</p>
                    </div>
                  ); })()}

                  {/* Custom per-provider config */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">API Key {ai.useFree ? '(optional for free)' : '(required for paid)'}</Label>
                      <Input type="password" value={ai.apiKey} onChange={e=>setAI({apiKey:e.target.value})} placeholder={ai.useFree ? 'Leave empty for free tier' : 'sk-...'} className="h-8 text-xs font-mono" />
                      {!ai.useFree && !ai.apiKey && <p className="text-[11px] text-amber-600">Paid model needs your key — stored in localStorage only.</p>}
                      <p className="text-[11px] text-muted-foreground">Key is stored locally (<code>finese-settings</code>) and never sent to our servers except as Bearer to your chosen provider.</p>
                      {ai.provider==='cerebras' && <p className="text-[11px] text-muted-foreground">Cerebras: free 1M tok/d → get $5 credit at cloud.cerebras.ai, then <code>api.cerebras.ai/v1</code></p>}
                      {ai.provider==='mistral' && <p className="text-[11px] text-muted-foreground">Mistral: Experiment ~1B tok/mo free — phone verify at console.mistral.ai</p>}
                      {ai.provider==='cloudflare' && <p className="text-[11px] text-muted-foreground">Cloudflare: replace <code>{"{id}"}</code> with your account ID → dash.cloudflare.com</p>}
                      {ai.provider==='nvidia' && <p className="text-[11px] text-muted-foreground">NVIDIA NIM: build.nvidia.com → 1K req/mo free, 40 RPM</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Base URL (custom / override)</Label>
                      <Input value={ai.baseUrl} onChange={e=>setAI({baseUrl:e.target.value})} placeholder={PROVIDER_DETAILS[ai.provider]?.baseUrl || 'https://api.openai.com/v1'} className="h-8 text-xs font-mono" />
                      <Label className="text-xs mt-2 block">Custom model id</Label>
                      <Input value={ai.model} onChange={e=>setAI({model:e.target.value})} placeholder="e.g. openrouter/free or gpt-4o-mini" className="h-8 text-xs font-mono" />
                      <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">
                        <b>Custom:</b> any OpenAI-compatible endpoint (LocalAI, vLLM, LiteLLM, Together, custom proxy).<br/>
                        1. Pick provider or choose Custom<br/>
                        2. Paste key (if free, leave empty)<br/>
                        3. Override Base URL if needed<br/>
                        4. Test → auto-saved
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div><Label className="text-xs">Temperature {ai.temperature}</Label><input type="range" min={0} max={2} step={0.1} value={ai.temperature} onChange={e=>setAI({temperature: parseFloat(e.target.value)})} className="w-full" /></div>
                    <div><Label className="text-xs">Max Tokens</Label><Input type="number" value={ai.maxTokens} onChange={e=>setAI({maxTokens: parseInt(e.target.value)||2048})} className="h-8 text-xs" /></div>
                    <div><Label className="text-xs">Top P {ai.topP}</Label><input type="range" min={0} max={1} step={0.05} value={ai.topP} onChange={e=>setAI({topP: parseFloat(e.target.value)})} className="w-full" /></div>
                  </div>

                  <FreeQuotaCard />
                  <OllamaSetupCard />

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleTest} disabled={testing}>{testing ? 'Testing…' : 'Test Connection'}</Button>
                    <Button size="sm" variant="outline" onClick={()=>resetAI()}>Reset to free default</Button>
                    {testResult && <span className={`text-xs px-2 py-1 rounded ${testResult.ok ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>{testResult.ok ? `OK ${testResult.latency}ms` : testResult.error}</span>}
                  </div>

                  <div className="text-[11px] text-muted-foreground border-t pt-3 space-y-1">
                    <p><b>Free research summary:</b> OpenRouter free = 20+ models 50/d (1k/d after $10) no card; Groq = 1k-14k/d no card fastest; HF $0.10/mo free + PRO $2; Ollama = unlimited local free private; Google Gemini 1M context 1500/d free.</p>
                    <p>All free providers are <b>OpenAI-compatible</b> — just swap `baseUrl` + `model` + `key` (except HF `inputs` shape). This app will route via your chosen provider from Settings → no code change.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4 mt-6">
              <MetricsPanel />
            </TabsContent>

            <TabsContent value="general" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">General</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Open Mode (building)</p><p className="text-xs text-muted-foreground">App is open, no sign-in required. Auth is frozen.</p></div>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={general.openMode} onChange={e=>setGeneral({openMode:e.target.checked})} /> Open</label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">Auto-save sessions</p><p className="text-xs text-muted-foreground">Persist sessions to localStorage (LRU 25)</p></div>
                    <input type="checkbox" checked={general.autoSave} onChange={e=>setGeneral({autoSave:e.target.checked})} />
                  </div>
                  <div>
                    <Label className="text-xs">Language — chat answers reply in this language</Label>
                    <select value={general.language} onChange={e=>setGeneral({language:e.target.value})} className="mt-1 h-8 w-full border rounded px-2 text-sm bg-background">
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                      <option value="ar">العربية</option>
                      <option value="hi">हिन्दी</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Data</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label className="text-xs">Max file MB</Label><Input type="number" value={data.maxFileMB} onChange={e=>setData({maxFileMB: parseInt(e.target.value)||20})} className="h-8 text-xs" /></div>
                  <div><Label className="text-xs">Max rows</Label><Input type="number" value={data.maxRows} onChange={e=>setData({maxRows: parseInt(e.target.value)||250000})} className="h-8 text-xs" /></div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={data.autoProfile} onChange={e=>setData({autoProfile:e.target.checked})} /> Auto-profile on upload</label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={data.cacheProfile} onChange={e=>setData({cacheProfile:e.target.checked})} /> Cache profile</label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Appearance — Theme & Colors</CardTitle><CardDescription className="text-xs">Light sidebar is now white, dark is navy. Pick an accent that tints buttons, links and active states.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div><Label className="text-xs">Theme</Label>
                    <select value={general.theme} onChange={e=>setGeneral({theme:e.target.value as any})} className="mt-1 h-8 w-full border rounded px-2 text-sm bg-background"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
                    <p className="text-[11px] text-muted-foreground mt-1">Dark is default (FINESE brand). Light makes sidebar white as requested. Applied instantly.</p>
                  </div>
                  <div>
                    <Label className="text-xs">Accent color — diverse options</Label>
                    <p className="text-[11px] text-muted-foreground mb-2">Applies to primary buttons, links, focus rings and sidebar active states. Verified blue stays distinct.</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {ACCENT_PRESETS.map(c=>(
                        <button key={c.id} onClick={()=>setGeneral({accent:c.hsl})} className={`p-2 rounded-xl border text-left space-y-1 ${general.accent===c.hsl ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border hover:bg-accent'}`} title={c.label}>
                          <div className="w-8 h-8 rounded-lg border shadow-sm" style={{background:c.hex}} />
                          <div className="text-[10px] font-medium leading-tight">{c.label}</div>
                          <div className="text-[9px] font-mono text-muted-foreground">{c.hex}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Label className="text-xs">Custom HSL</Label>
                      <Input value={general.accent} onChange={e=>setGeneral({accent:e.target.value})} placeholder="25 100% 50%" className="h-7 text-xs font-mono max-w-[180px]" />
                      <div className="w-7 h-7 rounded border" style={{background:`hsl(${general.accent})`}} />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary" />
                    <div><p className="text-xs font-medium">Preview</p><p className="text-[11px] text-muted-foreground">Buttons and active nav use this accent. Sidebar primary follows it.</p></div>
                    <Button size="sm" className="ml-auto">Example button</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Advanced</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p>Storage: <code>finese-settings</code> + <code>finese-ai-store</code> in localStorage. Clear to reset.</p>
                  <Button size="sm" variant="destructive" onClick={()=>{ localStorage.clear(); location.reload(); }}>Clear all local data</Button>
                  <p className="text-muted-foreground">Supabase: {import.meta.env.VITE_SUPABASE_URL || 'not set'} • Open mode bypasses Supabase when unreachable (mock admin).</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}

function FreeQuotaCard() {
  const { ai, setAI } = useSettingsStore();
  const keys = ai.extraKeys || {};
  const slots = [
    { id: 'groq', label: 'Groq', hint: 'console.groq.com/keys — no card' },
    { id: 'cerebras', label: 'Cerebras', hint: 'cloud.cerebras.ai — free tier' },
    { id: 'openrouter', label: 'OpenRouter', hint: 'openrouter.ai/keys — no card' },
    { id: 'google', label: 'Google AI Studio', hint: 'aistudio.google.com — no card' },
  ];
  const filled = slots.filter((s) => (keys[s.id] || '').trim()).length;
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Multiply your free quota — {filled}/4 keys</h4>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/10 text-verified border border-verified/20">$0.00 · auto-failover</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Add free keys from two or three providers and the chain round-robins across all of them — triple the daily quota, routing
        handled for you. Keys stay in <code>finese-settings</code> locally and are only sent as Bearer to their own provider.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {slots.map((s) => (
          <div key={s.id} className="space-y-1">
            <Label className="text-xs">{s.label} key</Label>
            <Input
              type="password"
              value={keys[s.id] || ''}
              onChange={(e) => setAI({ extraKeys: { ...keys, [s.id]: e.target.value } })}
              placeholder={s.hint}
              className="h-8 text-xs font-mono"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function OllamaSetupCard() {
  const { ai, setAI } = useSettingsStore();
  const [status, setStatus] = useState<{ running: boolean; models: string[]; error?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    setStatus(await checkOllama(ai.baseUrl || 'http://localhost:11434'));
    setChecking(false);
  };
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Run fully local — Ollama (zero cost, private)</h4>
        {status && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${status.running ? 'bg-verified/10 text-verified border-verified/20' : 'bg-critical/10 text-critical border-critical/20'}`}>
            {status.running ? `running · ${status.models.length} model${status.models.length === 1 ? '' : 's'}` : 'not detected'}
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        No account, no key, data never leaves your machine. Detect Ollama on this device, or follow the one-line setup for your OS.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={check} disabled={checking}>{checking ? 'Checking…' : 'Detect Ollama on this machine'}</Button>
        <Button size="sm" variant="ghost" onClick={() => setAI({ provider: 'ollama', model: 'llama3.2', useFree: true })}>Use Ollama</Button>
      </div>
      {status && !status.running && <OllamaInstallSteps />}
      {status?.running && status.models.length > 0 && (
        <p className="text-[11px] font-mono text-muted-foreground">Installed: {status.models.join(', ')}</p>
      )}
    </div>
  );
}

function OllamaInstallSteps() {
  const [os, setOs] = useState('Linux');
  const [copied, setCopied] = useState(false);
  const cmd = OLLAMA_INSTALL.find((o) => o.os === os)?.command || '';
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex gap-2">
        {['macOS', 'Linux', 'Windows'].map((o) => (
          <button key={o} onClick={() => setOs(o)} className={`text-[11px] px-2 py-1 rounded-full border ${os === o ? 'border-primary bg-primary/5' : 'border-border'}`}>{o}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[11px] font-mono bg-code-bg text-white rounded-lg px-3 py-2 overflow-auto">{cmd}</code>
        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

function MetricsPanel() {  const { metrics, add, remove } = useMetricsStore();
  const { profile, dataset } = useDatumStore();
  const cols = profile?.map(p => p.col) || Object.keys(dataset?.[0] || {});
  const [name, setName] = useState(''); const [expr, setExpr] = useState(''); const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const handleAdd = () => {
    const e = add({ name: name.trim(), expression: expr.trim(), description: desc.trim() || undefined });
    if (e) setErr(e); else { setErr(null); setName(''); setExpr(''); setDesc(''); toast.success(`Metric "${name}" saved`); }
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sigma className="w-4 h-4 text-primary"/> Semantic Layer — Metrics</CardTitle>
        <CardDescription className="text-xs">Define once, reuse everywhere. The model will call <code>semantic_metric</code> with your metric instead of guessing column meanings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cols.length > 0 && <p className="text-xs text-muted-foreground">Available columns: <span className="font-mono">{cols.join(', ')}</span></p>}
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label className="text-xs">Metric name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="profit" className="h-8 font-mono text-xs"/></div>
          <div className="md:col-span-2"><Label className="text-xs">Expression (column arithmetic)</Label><Input value={expr} onChange={e=>setExpr(e.target.value)} placeholder="revenue - cost" className="h-8 font-mono text-xs"/></div>
        </div>
        <div><Label className="text-xs">Description (optional)</Label><Input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Gross profit per row" className="h-8 text-xs"/></div>
        {err && <p className="text-xs text-critical">{err}</p>}
        <Button size="sm" onClick={handleAdd} disabled={!name || !expr}>Add metric</Button>
        <div className="space-y-2 pt-2">
          {metrics.length===0 ? <p className="text-xs text-muted-foreground">No metrics yet. Define one so the model stops guessing — e.g. <code>profit = revenue - cost</code>.</p> :
            metrics.map(m=>(
              <div key={m.name} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <div className="flex-1 min-w-0"><p className="text-xs font-mono font-medium truncate">{m.name} = {m.expression}</p>{m.description && <p className="text-[11px] text-muted-foreground truncate">{m.description}</p>}</div>
                <Button size="sm" variant="ghost" onClick={()=>remove(m.name)} className="h-7 text-xs">Remove</Button>
              </div>
            ))}
        </div>
        <p className="text-[11px] text-muted-foreground border-t pt-3">Honesty note: metrics are evaluated row-wise with a safe arithmetic evaluator (no code exec). Persisted to <code>finese-metrics</code> in localStorage (and <code>metric_definitions</code> in Supabase when signed in).</p>
      </CardContent>
    </Card>
  );
}
