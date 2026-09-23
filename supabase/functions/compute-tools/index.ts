// Real compute tools — HTTP handler + dataset cache + registry lookup only
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { TOOLS } from "./registry.ts";

function supa() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
}
async function requireUser(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) throw new Response("Unauthorized", { status: 401 });
  return data.user.id;
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
    const user_id = await requireUser(req);
    const { tool, args, file_hash } = await req.json();
    if (!tool || !TOOLS[tool]) return new Response(JSON.stringify({ error: "Unknown tool: " + tool }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!file_hash) return new Response(JSON.stringify({ error: "file_hash required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const data = await loadDataset(file_hash, user_id);
    const result = TOOLS[tool](args || {}, data);
    return new Response(JSON.stringify({ tool, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), { status: e.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    console.error("compute-tools error:", e);
    return new Response(JSON.stringify({ error: "Compute tool failed. Please try again." }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
