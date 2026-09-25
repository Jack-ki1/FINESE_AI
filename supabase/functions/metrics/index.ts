// Metrics CRUD: GET/POST/PUT/DELETE — semantic layer (one table, one lookup)
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser, getServiceClient } from "../_shared/auth.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

function svc() { return getServiceClient(); }

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { userId } = await requireUser(req);
    rateLimitOrThrow(req, userId, LIMITS.compute);
    const url = new URL(req.url);

    if (req.method === "GET") {
      const name = url.searchParams.get("name");
      let q = svc().from("metric_definitions").select("*").eq("user_id", userId);
      if (name) q = q.eq("name", name);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ metrics: data || [] }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name, expression, description } = body as { name: string; expression: string; description?: string };
      if (!name || !expression) return new Response(JSON.stringify({ error: "name and expression required" }), { status: 400, headers: cors });
      if (!/^[a-zA-Z][a-zA-Z0-9_]{1,63}$/.test(name)) return new Response(JSON.stringify({ error: "name must be 2-64 chars, letters/numbers/_" }), { status: 400, headers: cors });
      if (!/^[a-zA-Z0-9_\s+\-*/()%\.]+$/.test(expression)) return new Response(JSON.stringify({ error: "expression contains illegal characters" }), { status: 400, headers: cors });
      const { data, error } = await svc().from("metric_definitions").insert({ user_id: userId, name, expression, description: description || null }).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors });
      return new Response(JSON.stringify({ metric: data }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { name, expression, description } = body as { name: string; expression: string; description?: string };
      if (!name || !expression) return new Response(JSON.stringify({ error: "name and expression required" }), { status: 400, headers: cors });
      const { data, error } = await svc().from("metric_definitions").update({ expression, description: description ?? null }).eq("user_id", userId).eq("name", name).select().single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors });
      return new Response(JSON.stringify({ metric: data }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE") {
      const name = url.searchParams.get("name");
      if (!name) return new Response(JSON.stringify({ error: "name query param required" }), { status: 400, headers: cors });
      const { error } = await svc().from("metric_definitions").delete().eq("user_id", userId).eq("name", name);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), { status: e.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    console.error("metrics error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
