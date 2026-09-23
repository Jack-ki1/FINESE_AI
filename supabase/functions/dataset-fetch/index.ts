// Public edge function: returns dataset rows for a given file_hash.
// The datasets table and storage bucket are locked down (no anon access);
// this function uses service_role to read them on behalf of the client.
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
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await anon.auth.getUser(authHeader.slice(7));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user_id = userData.user.id;

    const body = await req.json();
    const { file_hash, profile_only } = body;
    if (!file_hash || typeof file_hash !== "string") {
      return new Response(JSON.stringify({ error: "file_hash required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: meta, error: metaErr } = await supa
      .from("datasets")
      .select("storage_path, file_name, row_count, col_count")
      .eq("file_hash", file_hash)
      .eq("user_id", user_id)
      .maybeSingle();
    if (metaErr || !meta) {
      return new Response(JSON.stringify({ error: "Dataset not found or access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lightweight profile-only fetch — avoids downloading full dataset when caller only needs metadata.
    if (profile_only) {
      const { data: profileRow } = await supa
        .from("dataset_profiles")
        .select("profile, correlations, advanced, health_score")
        .eq("file_hash", file_hash)
        .maybeSingle();
      if (!profileRow) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          file_hash,
          file_name: meta.file_name,
          row_count: meta.row_count,
          col_count: meta.col_count,
          profile: profileRow.profile,
          correlations: profileRow.correlations,
          advanced: profileRow.advanced,
          health_score: profileRow.health_score,
          cached: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=3600",
          },
        },
      );
    }

    const { data: blob, error } = await supa.storage
      .from("datasets")
      .download(meta.storage_path);
    if (error || !blob) {
      console.error("dataset-fetch download failed:", error);
      return new Response(JSON.stringify({ error: "Download failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const text = await blob.text();
    return new Response(text, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Datasets are content-hash addressed and immutable -> safe to cache privately
        "Cache-Control": "private, max-age=3600, immutable",
      },
    });
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), {
        status: e.status,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    console.error("dataset-fetch error:", e);
    return new Response(JSON.stringify({ error: "Download failed. Please try again." }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});