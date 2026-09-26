// Model reliability benchmark (§3.3) — verified, not marketed.
//
// Measures what actually matters for FINESE: "does this free model correctly
// call our tools and produce parseable output". For each configured chain
// link it forces a `correlation` tool call and scores whether the model
// returns a valid call with parseable col_a/col_b args. Results upsert into
// public.model_benchmarks (public read → backs the /free-models leaderboard).
//
// Trigger: weekly via Supabase cron/pg_cron hitting this endpoint with
//   Authorization: Bearer <CRON_SECRET>
// or manually by any signed-in user (rate-limited; burns provider quota, so
// prefer cron). Logs each run to compute_jobs (job_type='model_benchmark').
//
// Deploy: supabase functions deploy model-benchmark
// Secrets: CRON_SECRET + the chain keys (GROQ_API_KEY, CEREBRAS_API_KEY,
//   OPENROUTER_API_KEY, GOOGLE_API_KEY, NVIDIA_API_KEY)
// Schedule (SQL, needs pg_cron):
//   select cron.schedule('model-benchmark-weekly', '0 4 * * 0',
//     $$select net.http_post('https://<project>.supabase.co/functions/v1/model-benchmark',
//       '{"":""}'::jsonb, '{"Authorization":"Bearer <CRON_SECRET>"}'::jsonb)$$);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser, getServiceClient } from "../_shared/auth.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";
import { FREE_CHAIN } from "../FINESE-chat/free-model-chain.ts";

const TOOL_DEF = {
  type: "function",
  function: {
    name: "correlation",
    description: "Compute Pearson correlation between two numeric columns.",
    parameters: {
      type: "object",
      properties: {
        col_a: { type: "string" },
        col_b: { type: "string" },
      },
      required: ["col_a", "col_b"],
    },
  },
};

async function checkLink(link: { provider: string; baseUrl: string; model: string; envKey: string }) {
  const key = Deno.env.get(link.envKey) || "";
  if (!key) return { provider: link.provider, model: link.model, skipped: true as const };
  const started = Date.now();
  try {
    const resp = await fetch(`${link.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: link.model,
        messages: [
          { role: "system", content: "You must call the provided tool. Reply with the tool call only." },
          { role: "user", content: "Is revenue correlated with discount in the sales table?" },
        ],
        tools: [TOOL_DEF],
        tool_choice: { type: "function", function: { name: "correlation" } },
        max_tokens: 256,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const latency = Date.now() - started;
    if (!resp.ok) {
      const status = resp.status === 429 ? "rate_limited" : "error";
      return { provider: link.provider, model: link.model, pass: false as const, latency, status, error: `HTTP ${resp.status}` };
    }
    const json = await resp.json().catch(() => null);
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (call?.function?.name !== "correlation") {
      return { provider: link.provider, model: link.model, pass: false as const, latency, status: "error", error: "no correlation tool call returned" };
    }
    let args: any = null;
    try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* fall through */ }
    if (!args || typeof args.col_a !== "string" || typeof args.col_b !== "string") {
      return { provider: link.provider, model: link.model, pass: false as const, latency, status: "error", error: "unparseable tool args" };
    }
    return { provider: link.provider, model: link.model, pass: true as const, latency, status: "ok" };
  } catch (e) {
    return { provider: link.provider, model: link.model, pass: false as const, latency: Date.now() - started, status: "error", error: String(e).slice(0, 200) };
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
    for (const link of FREE_CHAIN) {
      const r = await checkLink(link);
      results.push(r);
      if ("skipped" in r) continue;
      const { data: prev } = await svc.from("model_benchmarks").select("runs,tool_call_accuracy,avg_latency_ms").eq("provider", r.provider).eq("model", r.model).maybeSingle();
      const runs = (prev?.runs || 0) + 1;
      // Exponential moving average so one bad run doesn't nuke history.
      const alpha = 0.3;
      const prevAcc = Number(prev?.tool_call_accuracy ?? (r.pass ? 1 : 0));
      const accuracy = prevAcc + alpha * ((r.pass ? 1 : 0) - prevAcc);
      const prevLat = Number(prev?.avg_latency_ms ?? r.latency);
      const avgLatency = Math.round(prevLat + alpha * (r.latency - prevLat));
      await svc.from("model_benchmarks").upsert({
        provider: r.provider,
        model: r.model,
        tool_call_accuracy: accuracy,
        avg_latency_ms: avgLatency,
        runs,
        last_status: r.status,
        last_error: (r as any).error || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,model" });
    }

    await svc.from("compute_jobs").insert({
      user_id: userId,
      job_type: "model_benchmark",
      status: "done",
      params: { links: FREE_CHAIN.length },
      result: { results },
    });

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), { status: e.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    console.error("model-benchmark error:", e);
    return new Response(JSON.stringify({ error: "Benchmark failed" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
