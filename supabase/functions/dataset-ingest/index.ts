// Dataset ingest: hash → store → profile → cache
// Receives the parsed rows (client parses small files), hashes content,
// stores raw file in Storage, computes server-side profile, caches in DB.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { buildProfile, buildAdvanced } from "../_shared/stats.ts";

interface IngestPayload {
  file_name: string;
  file_ext: string;
  // Parsed rows, sent as JSON. (For huge files we'd switch to direct Storage upload.)
  rows: Record<string, any>[];
}

// Keep these in sync with src/lib/constants.ts on the client.
const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024; // 25MB JSON body ceiling
const MAX_ROWS = 250_000;

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
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

    const payload: IngestPayload = await req.json();
    if (!payload?.rows?.length) {
      return new Response(JSON.stringify({ error: "rows is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (payload.rows.length > MAX_ROWS) {
      return new Response(JSON.stringify({ error: `Too many rows (${payload.rows.length}). Max is ${MAX_ROWS}.` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Schema consistency check: warn if column sets vary across rows (drifting CSV)
    const expectedCols = new Set(Object.keys(payload.rows[0] || {}));
    let inconsistentRows = 0;
    for (let i = 1; i < Math.min(payload.rows.length, 1000); i++) {
      const cols = Object.keys(payload.rows[i] || {});
      if (cols.length !== expectedCols.size || cols.some((c) => !expectedCols.has(c))) {
        inconsistentRows++;
        if (inconsistentRows === 1) {
          console.warn(`dataset-ingest: schema drift detected at row ${i} — expected [${[...expectedCols].join(",")}] got [${cols.join(",")}]`);
        }
      }
    }

    const fileName = payload.file_name || "dataset";
    const fileExt = (payload.file_ext || "csv").toLowerCase();
    const rowsJson = JSON.stringify(payload.rows);
    if (rowsJson.length > MAX_PAYLOAD_BYTES) {
      return new Response(JSON.stringify({ error: `Payload too large (${(rowsJson.length / 1024 / 1024).toFixed(1)}MB). Max is ${Math.round(MAX_PAYLOAD_BYTES / 1024 / 1024)}MB.` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const file_hash = await sha256(rowsJson);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Cache hit? Scoped to this user (file_hash is unique per user).
    const { data: ownedDataset } = await supa
      .from("datasets")
      .select("*")
      .eq("file_hash", file_hash)
      .eq("user_id", user_id)
      .maybeSingle();
    const { data: existingProfile } = ownedDataset ? await supa
      .from("dataset_profiles")
      .select("*")
      .eq("file_hash", file_hash)
      .maybeSingle() : { data: null } as any;

    if (ownedDataset && existingProfile) {
      return new Response(
        JSON.stringify({
          file_hash,
          file_name: ownedDataset.file_name,
          row_count: ownedDataset.row_count,
          col_count: ownedDataset.col_count,
          profile: existingProfile.profile,
          correlations: existingProfile.correlations,
          advanced: existingProfile.advanced,
          health_score: existingProfile.health_score,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute profile server-side
    const profile = buildProfile(payload.rows);
    const { correlations, advanced: baseAdvanced } = buildAdvanced(payload.rows, profile);
    const advanced = {
      ...baseAdvanced,
      ...(inconsistentRows > 0 ? { warnings: [`Schema drift: ${inconsistentRows} rows have inconsistent columns`] } : {}),
    };
    const totalCells = profile.reduce((s: number, p: any) => s + p.total, 0);
    const nullCells = profile.reduce((s: number, p: any) => s + p.nullCount, 0);
    const health_score =
      totalCells > 0 ? Math.round((1 - nullCells / totalCells) * 100) : 100;

    // Store raw file in Storage — namespaced by user for privacy
    const storage_path = `${user_id}/${file_hash}.json`;
    const blob = new Blob([rowsJson], { type: "application/json" });
    await supa.storage.from("datasets").upload(storage_path, blob, { upsert: true });

    // Register
    await supa.from("datasets").upsert(
      {
        file_hash,
        user_id,
        file_name: fileName,
        storage_path,
        file_ext: fileExt,
        row_count: payload.rows.length,
        col_count: profile.length,
        size_bytes: rowsJson.length,
      },
      { onConflict: "file_hash,user_id" }
    );

    await supa.from("dataset_profiles").upsert(
      {
        file_hash,
        profile,
        correlations,
        advanced,
        health_score,
      },
      { onConflict: "file_hash" }
    );

    return new Response(
      JSON.stringify({
        file_hash,
        file_name: fileName,
        row_count: payload.rows.length,
        col_count: profile.length,
        profile,
        correlations,
        advanced,
        health_score,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    if (e instanceof Response) {
      const body = await e.text().catch(() => "");
      return new Response(body || JSON.stringify({ error: "Unauthorized" }), {
        status: e.status,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    console.error("dataset-ingest error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to ingest dataset. Please try again." }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});