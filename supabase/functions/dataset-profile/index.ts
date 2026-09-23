// Lightweight profile fetch — returns cached profile without downloading full dataset rows.
// This is a dedicated alias for dataset-fetch?profile_only=true for semantic clarity.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error: userErr } = await anon.auth.getUser(authHeader.slice(7));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user_id = userData.user.id;
    const { file_hash } = await req.json().catch(() => ({}));
    if (!file_hash || typeof file_hash !== "string") {
      return new Response(JSON.stringify({ error: "file_hash required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: meta } = await supa.from("datasets").select("file_name, row_count, col_count").eq("file_hash", file_hash).eq("user_id", user_id).maybeSingle();
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
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), {
        status: e.status,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    console.error("dataset-profile error:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch profile. Please try again." }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
