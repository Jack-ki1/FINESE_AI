import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings.store";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
export function SecondOpinion({ prompt, onResult }: { prompt: string; onResult?: (text:string)=>void }) {
  const [loading, setLoading]=useState(false);
  const [result, setResult]=useState<string|null>(null);
  const { ai } = useSettingsStore();
  const run = async () => {
    setLoading(true); setResult(null);
    try {
      // Pick a different provider than current
      const alt = ai.provider==="openrouter" ? "groq" : "openrouter";
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/FINESE-chat`, {
        method: "POST",
        headers: { "Content-Type":"application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify({ messages:[{role:"user",content:prompt}], dataset_context:null, ai_config:{ provider: alt, model: "" } })
      });
      const text = await resp.text();
      setResult(text.slice(0,2000) || "No response");
      onResult?.(text.slice(0,2000));
    } catch(e:any){ setResult(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold">Second opinion (different model)</span><Button size="sm" variant="outline" onClick={run} disabled={loading}><RefreshCw className="w-3 h-3 mr-1"/>{loading? "Asking…":"Ask second model"}</Button></div>
      {result && <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/30 p-2 rounded max-h-64 overflow-auto">{result}</pre>}
      <p className="text-[10px] text-muted-foreground">Disagreement is signal — if two models disagree on an Estimated claim, trust it less.</p>
    </div>
  );
}
