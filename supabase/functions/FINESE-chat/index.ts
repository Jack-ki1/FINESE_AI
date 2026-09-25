import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { TOOL_DEFS } from "./tool-defs.ts";
import { getAIConfig, callChatCompletions, runTool } from "./gateway.ts";
import { buildSystemPrompt } from "./prompts/index.ts";
import { chatRequestSchema, parseOrThrow } from "../_shared/schemas.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

const MAX_TOOL_ROUNDS = parseInt(Deno.env.get("MAX_TOOL_ROUNDS") || "6");
const MAX_HISTORY_MESSAGES = parseInt(Deno.env.get("MAX_HISTORY_MESSAGES") || "30");
const TOOL_RESULT_LIMIT = 12000;

function safeTruncate(json: string, limit: number): { text: string; truncated: boolean } {
  if (json.length <= limit) return { text: json, truncated: false };
  let cut = json.lastIndexOf(",", limit);
  const brace = json.lastIndexOf("}", limit);
  if (brace > cut) cut = brace;
  if (cut < limit * 0.5) cut = limit;
  return { text: json.slice(0, cut) + `... [truncated ${json.length - cut} chars]`, truncated: true };
}

function validateToolArgs(name: string, args: any): string | null {
  const def = TOOL_DEFS.find((t) => t.function.name === name);
  if (!def) return `Unknown tool ${name}`;
  const required = (def.function.parameters as any).required || [];
  for (const r of required) if (args[r] === undefined || args[r] === null || args[r] === "") return `Missing required arg "${r}" for ${name}`;
  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { userId, token: userJwt } = await requireUser(req);
    rateLimitOrThrow(req, userId, LIMITS.chat);
    const raw = await req.json();
    const { messages: rawMessages, dataset_context, file_hash, ai_config } = parseOrThrow(chatRequestSchema, raw) as any;
    // getAIConfig validates SSRF — throws if custom baseUrl without key
    getAIConfig(ai_config);
    const messages = Array.isArray(rawMessages) && rawMessages.length > MAX_HISTORY_MESSAGES ? rawMessages.slice(-MAX_HISTORY_MESSAGES) : rawMessages;
    if (file_hash) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
      const { data: owned } = await svc.from("datasets").select("file_hash").eq("file_hash", file_hash).eq("user_id", userId).maybeSingle();
      if (!owned) return new Response(JSON.stringify({ error: "Dataset access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // enrich with server-side metrics (merge with client-provided)
    if (dataset_context?.metric_definitions === undefined) dataset_context = { ...(dataset_context || {}), metric_definitions: [] };
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
      const svc2 = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
      const { data: metrics } = await svc2.from("metric_definitions").select("name,expression,description").eq("user_id", userId).limit(20);
      if (metrics?.length) {
        const existing = new Set((dataset_context.metric_definitions || []).map((m: any) => m.name));
        for (const m of metrics) if (!existing.has(m.name)) dataset_context.metric_definitions.push(m);
      }
    } catch {}
    const systemPrompt = buildSystemPrompt(dataset_context);
    const enableTools = !!file_hash;
    const convo: any[] = [{ role: "system", content: systemPrompt }, ...messages];
    const { PRIMARY_MODEL: pm, FALLBACK_MODELS: fm } = getAIConfig(ai_config);
    let truncatedRounds = false;
    if (enableTools) {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const toolResp = await callChatCompletions(pm, convo, TOOL_DEFS as any, false, ai_config);
        if (!toolResp.ok) {
          if (toolResp.status === 429 || toolResp.status === 402) return new Response(JSON.stringify({ error: toolResp.status === 429 ? "Rate limited — try again shortly." : "AI credits exhausted." }), { status: toolResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          break;
        }
        const j = await toolResp.json();
        const msg = j.choices?.[0]?.message;
        if (!msg) break;
        const calls = msg.tool_calls || [];
        if (!calls.length) break;
        if (round === MAX_TOOL_ROUNDS - 1 && calls.length) truncatedRounds = true;
        convo.push(msg);
        for (const call of calls) {
          let args: any = {}; let parseError: string | null = null;
          try { args = JSON.parse(call.function.arguments || "{}"); } catch (e) { parseError = `Invalid JSON arguments for ${call.function.name}: ${(e as Error).message}`; }
          if (parseError) { convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: parseError, hint: "Check your arguments JSON — ensure valid JSON with required fields." }) }); continue; }
          const validationError = validateToolArgs(call.function.name, args);
          if (validationError) { convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: validationError }) }); continue; }
          const result = await runTool(call.function.name, args, file_hash, userJwt);
          const raw = JSON.stringify(result);
          const { text, truncated } = safeTruncate(raw, TOOL_RESULT_LIMIT);
          convo.push({ role: "tool", tool_call_id: call.id, content: truncated ? text + ` [truncated: ${raw.length > TOOL_RESULT_LIMIT ? "true" : "false"}]` : text });
        }
        if (truncatedRounds) convo.push({ role: "system", content: `[System: tool loop truncated after ${MAX_TOOL_ROUNDS} rounds. Summarize what you have and note any incomplete steps to the user.]` });
      }
    }
    async function tryStream(modelList: string[]): Promise<Response> {
      let lastError: Response | null = null;
      for (const model of modelList) {
        const response = await callChatCompletions(model, convo, undefined, true, ai_config);
        if (response.ok) return response;
        if (response.status === 429 || response.status === 402) return response;
        const t = await response.text().catch(() => "");
        console.warn(`FINESE-chat model ${model} failed ${response.status}: ${t}`);
        lastError = response;
      }
      return lastError!;
    }
    const response = await tryStream(fm);
    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text(); console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      const ct = e.headers.get("Content-Type") || "application/json";
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), { status: e.status, headers: { ...getCorsHeaders(req), "Content-Type": ct } });
    }
    console.error("FINESE-chat error:", e);
    const msg = (e as Error)?.message || "";
    if (msg.includes("custom base URL") || msg.includes("Invalid custom")) {
      return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Chat service failed. Please try again." }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
