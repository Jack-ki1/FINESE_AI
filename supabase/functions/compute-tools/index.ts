// Real compute tools — HTTP handler + dataset cache + registry lookup only
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser, getServiceClient } from "../_shared/auth.ts";
import { TOOLS } from "./registry.ts";
import { computeToolsSchema, parseOrThrow } from "../_shared/schemas.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

function supa() {
  return getServiceClient();
}
const datasetCache = new Map<string, { data: any[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
async function loadDataset(file_hash: string, user_id: string): Promise<any[]> {
  const cacheKey = `${user_id}:${file_hash}`;
  const cached = datasetCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  const { data: meta } = await supa().from("datasets").select("storage_path, user_id").eq("file_hash", file_hash).eq("user_id", user_id).maybeSingle();
  if (!meta) throw new Response(JSON.stringify({ error: "Dataset not found or access denied" }), { status: 403 });
  const { data: blob, error } = await supa().storage.from("datasets").download(meta.storage_path);
  if (error || !blob) throw new Error("Failed to load dataset: " + (error?.message || ""));
  const text = await blob.text();
  const parsed = JSON.parse(text);
  datasetCache.set(cacheKey, { data: parsed, ts: Date.now() });
  if (datasetCache.size > 10) {
    const oldest = [...datasetCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    datasetCache.delete(oldest[0]);
  }
  return parsed;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { userId } = await requireUser(req);
    rateLimitOrThrow(req, userId, LIMITS.compute);
    const raw = await req.json();
    // join_datasets requires two hashes: file_hash (left) + args.right_file_hash
    let { tool, args, file_hash } = parseOrThrow(computeToolsSchema, raw) as { tool: string; args?: any; file_hash: string };
    if (!TOOLS[tool]) return new Response(JSON.stringify({ error: "Unknown tool: " + tool }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const tStart = Date.now();
    let data: any[] = [];
    let result: any;
    if (tool === "join_datasets") {
      const rightHash = (args as any)?.right_file_hash;
      if (!rightHash) return new Response(JSON.stringify({ error: "join_datasets requires args.right_file_hash" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const [left, right] = await Promise.all([loadDataset(file_hash, userId), loadDataset(rightHash, userId)]);
      result = TOOLS[tool]({ ...args, left, right }, []);
    } else {
      data = await loadDataset(file_hash, userId);
      result = TOOLS[tool](args || {}, data);
    }
    const latency = Date.now() - tStart;
    // F4 observability + F1 compute_jobs async write (fire-and-forget)
    try {
      const svc = supa();
      svc.from("compute_jobs").insert({ user_id: userId, file_hash, job_type: tool, status: result?.error ? "error" : "done", params: args, result, error: result?.error || null }).then(() => {}, () => {});
      svc.from("app_logs").insert({ user_id: userId, level: "info", message: `tool:${tool} latency:${latency}ms n:${Array.isArray(data)?data.length:0} verified:${!!result?.verified}` }).then(()=>{},()=>{});
    } catch {}
    // A2: attach confidence/reliability signal for ttest/correlation/anova etc
    if (result && typeof result === 'object' && !result.error) {
      const n = (result as any).n ?? (result as any).n_a ?? data.length;
      const p = (result as any).p_value ?? (result as any).p ?? null;
      let strength: 'high'|'medium'|'low' = 'medium';
      let reason = '';
      if (p !== null && typeof p === 'number') {
        if (p < 0.01 && n >= 100) { strength='high'; reason='p<0.01, n≥100'; }
        else if (p >= 0.04 && p <= 0.06) { strength='low'; reason='p near 0.05 threshold'; }
        else if (n < 30) { strength='low'; reason=`n=${n} < 30 (small)`; }
        else if (n < 100) { strength='medium'; reason=`n=${n}`; }
        else { strength='high'; reason=`n=${n}, p=${p}`; }
      } else if (typeof n === 'number') {
        if (n < 30) { strength='low'; reason=`n=${n} small`; }
        else if (n < 200) { strength='medium'; reason=`n=${n}`; }
        else { strength='high'; reason=`n=${n} large`; }
      }
      (result as any).confidence = { strength, reason, n: typeof n==='number'?n:undefined, p_value: p };
    }
    return new Response(JSON.stringify({ tool, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      const ct = e.headers.get("Content-Type") || "application/json";
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), { status: e.status, headers: { ...getCorsHeaders(req), "Content-Type": ct } });
    }
    console.error("compute-tools error:", e);
    return new Response(JSON.stringify({ error: "Compute tool failed. Please try again." }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
