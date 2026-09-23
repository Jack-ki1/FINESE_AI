// Lightweight profile fetch — returns cached profile without downloading full dataset rows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser, getServiceClient } from "../_shared/auth.ts";
import { datasetProfileSchema, parseOrThrow } from "../_shared/schemas.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { userId } = await requireUser(req);
    rateLimitOrThrow(req, userId, LIMITS.fetch);
    const raw = await req.json().catch(() => ({}));
    const { file_hash } = parseOrThrow(datasetProfileSchema, raw) as { file_hash: string };
    const supa = getServiceClient();
    const { data: meta } = await supa.from("datasets").select("file_name, row_count, col_count").eq("file_hash", file_hash).eq("user_id", userId).maybeSingle();
    if (!meta) {
      return new Response(JSON.stringify({ error: "Dataset not found or access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profileRow } = await supa.from("dataset_profiles").select("profile, correlations, advanced, health_score").eq("file_hash", file_hash).maybeSingle();
    if (!profileRow) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      file_hash,
      file_name: meta.file_name,
      row_count: meta.row_count,
      col_count: meta.col_count,
      profile: profileRow.profile,
      correlations: profileRow.correlations,
      advanced: profileRow.advanced,
      health_score: profileRow.health_score,
      cached: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, max-age=3600" },
    });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      const ct = e.headers.get("Content-Type") || "application/json";
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), {
        status: e.status,
        headers: { ...getCorsHeaders(req), "Content-Type": ct },
      });
    }
    console.error("dataset-profile error:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch profile. Please try again." }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
