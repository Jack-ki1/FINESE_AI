// Catalog accuracy check (§3.6) — free-tier terms change often (tightened
// limits, deprecated model IDs), and a stale catalog is the "fabrication risk
// applied to metadata". Weekly job: ping each provider's /models endpoint (or
// one minimal completion where /models doesn't exist) and log per-provider
// status to catalog_health_log + compute_jobs. Surface drift before a user
// hits it.
//
// Same auth model as model-benchmark: CRON_SECRET bearer, else signed-in user.
// Deploy: supabase functions deploy catalog-health

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser, getServiceClient } from "../_shared/auth.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

const PROVIDERS: { provider: string; modelsUrl: string; envKey: string }[] = [
  { provider: "groq", modelsUrl: "https://api.groq.com/openai/v1/models", envKey: "GROQ_API_KEY" },
  { provider: "cerebras", modelsUrl: "https://api.cerebras.ai/v1/models", envKey: "CEREBRAS_API_KEY" },
  { provider: "openrouter", modelsUrl: "https://openrouter.ai/api/v1/models", envKey: "OPENROUTER_API_KEY" },
  { provider: "google", modelsUrl: "https://generativelanguage.googleapis.com/v1beta/openai/models", envKey: "GOOGLE_API_KEY" },
  { provider: "nvidia", modelsUrl: "https://integrate.api.nvidia.com/v1/models", envKey: "NVIDIA_API_KEY" },
  { provider: "mistral", modelsUrl: "https://api.mistral.ai/v1/models", envKey: "MISTRAL_API_KEY" },
  { provider: "github", modelsUrl: "https://models.github.ai/inference/models", envKey: "GITHUB_TOKEN" },
  { provider: "sambanova", modelsUrl: "https://api.sambanova.ai/v1/models", envKey: "SAMBANOVA_API_KEY" },
  // huggingface router + cloudflare + ollama have no stable /models over the
  // same auth shape — covered by the benchmark job instead. Not listed = not
  // silently claimed healthy.
];

async function ping(p: { provider: string; modelsUrl: string; envKey: string }) {
  const key = Deno.env.get(p.envKey) || "";
  if (!key) return { provider: p.provider, status: "skipped" as const, detail: "no key configured" };
  try {
    const resp = await fetch(p.modelsUrl, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (resp.ok) {
      const json = await resp.json().catch(() => null);
      const count = Array.isArray(json?.data) ? json.data.length : null;
      return { provider: p.provider, status: "ok" as const, detail: count !== null ? `${count} models listed` : "reachable" };
    }
    return { provider: p.provider, status: "error" as const, detail: `HTTP ${resp.status}` };
  } catch (e) {
    return { provider: p.provider, status: "error" as const, detail: String(e).slice(0, 200) };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const cronSecret = Deno.env.get("CRON_SECRET") || "";
    const auth = req.headers.get("Authorization") || "";
    const isCron = cronSecret && auth === `Bearer ${cronSecret}`;
    let userId: string | null = null;
    if (!isCron) {
      const ctx = await requireUser(req);
      userId = ctx.userId;
      rateLimitOrThrow(req, userId, LIMITS.chat);
    }

    const svc = getServiceClient();
    const results = [];
    for (const p of PROVIDERS) {
      const r = await ping(p);
      results.push(r);
      if (r.status === "skipped") continue;
      await svc.from("catalog_health_log").insert({ provider: r.provider, status: r.status, detail: r.detail });
    }
    await svc.from("compute_jobs").insert({
      user_id: userId,
      job_type: "catalog_health",
      status: "done",
      params: { providers: PROVIDERS.length },
      result: { results },
    });

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), { status: e.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    console.error("catalog-health error:", e);
    return new Response(JSON.stringify({ error: "Health check failed" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
