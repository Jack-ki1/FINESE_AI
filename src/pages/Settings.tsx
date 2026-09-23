import { useState } from 'react';
import { useSettingsStore, FREE_MODELS, type AIProvider } from '@/store/settings.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings, Cpu, Database, Palette, Shield, Zap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const providers: { id: AIProvider; label: string; desc: string; free: boolean }[] = [
  { id: 'openrouter', label: 'OpenRouter', desc: '20+ free models, one key, 50/day free (1k with $10)', free: true },
  { id: 'groq', label: 'Groq', desc: 'Fastest LPU, 1k-14k/day free, no card', free: true },
  { id: 'huggingface', label: 'Hugging Face', desc: '$0.10/mo free, 100k+ models', free: true },
  { id: 'ollama', label: 'Ollama (Local)', desc: '100% free, private, unlimited, local GPU/CPU', free: true },
  { id: 'google', label: 'Google AI Studio', desc: 'Gemini 1M context, 1500/d free', free: true },
  { id: 'openai', label: 'OpenAI', desc: 'Paid, gpt-4o', free: false },
  { id: 'anthropic', label: 'Anthropic', desc: 'Paid, Claude', free: false },
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">API Key {ai.useFree ? '(optional for free)' : '(required for paid)'}</Label>
                      <Input type="password" value={ai.apiKey} onChange={e=>setAI({apiKey:e.target.value})} placeholder={ai.useFree ? 'Leave empty for free tier' : 'sk-...'} className="h-8 text-xs font-mono" />
                      {!ai.useFree && !ai.apiKey && <p className="text-[11px] text-amber-600">Paid model needs your key — stored in localStorage only.</p>}
                      {ai.provider==='openrouter' && <p className="text-[11px] text-muted-foreground">Get free key: <a href="https://openrouter.ai/keys" target="_blank" className="underline">openrouter.ai/keys</a> — 50/day free, 1k/day after $10</p>}
                      {ai.provider==='groq' && <p className="text-[11px] text-muted-foreground">Get free key: <a href="https://console.groq.com/keys" target="_blank" className="underline">console.groq.com/keys</a> — no card</p>}
                      {ai.provider==='huggingface' && <p className="text-[11px] text-muted-foreground">Get token: <a href="https://huggingface.co/settings/tokens" target="_blank" className="underline">huggingface.co/settings/tokens</a> — $0.10/mo free</p>}
                      {ai.provider==='ollama' && <p className="text-[11px] text-muted-foreground">Run locally: <code>ollama run llama3.2</code> then set Base URL <code>http://localhost:11434</code></p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Base URL (custom / Ollama)</Label>
                      <Input value={ai.baseUrl} onChange={e=>setAI({baseUrl:e.target.value})} placeholder={ai.provider==='ollama' ? 'http://localhost:11434' : ai.provider==='openrouter' ? 'https://openrouter.ai/api/v1' : ai.provider==='groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'} className="h-8 text-xs font-mono" />
                      <Label className="text-xs mt-2 block">How to implement</Label>
                      <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">
                        1. Pick <b>FREE</b> provider → model auto-selected<br/>
                        2. For free: leave key empty, click Test<br/>
                        3. For paid: paste your key, choose paid model<br/>
                        4. Click Test → Save is automatic (localStorage)
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div><Label className="text-xs">Temperature {ai.temperature}</Label><input type="range" min={0} max={2} step={0.1} value={ai.temperature} onChange={e=>setAI({temperature: parseFloat(e.target.value)})} className="w-full" /></div>
                    <div><Label className="text-xs">Max Tokens</Label><Input type="number" value={ai.maxTokens} onChange={e=>setAI({maxTokens: parseInt(e.target.value)||2048})} className="h-8 text-xs" /></div>
                    <div><Label className="text-xs">Top P {ai.topP}</Label><input type="range" min={0} max={1} step={0.05} value={ai.topP} onChange={e=>setAI({topP: parseFloat(e.target.value)})} className="w-full" /></div>
                  </div>

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
                    <Label className="text-xs">Language</Label>
                    <select value={general.language} onChange={e=>setGeneral({language:e.target.value})} className="mt-1 h-8 w-full border rounded px-2 text-sm bg-background"><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option></select>
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
                <CardHeader><CardTitle className="text-sm">Appearance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label className="text-xs">Theme</Label>
                    <select value={general.theme} onChange={e=>setGeneral({theme:e.target.value as any})} className="mt-1 h-8 w-full border rounded px-2 text-sm bg-background"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
                  </div>
                  <p className="text-xs text-muted-foreground">Theme is applied via next-themes. Restart may be needed.</p>
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
