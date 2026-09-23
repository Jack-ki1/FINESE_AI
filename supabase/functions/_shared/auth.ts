import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

// OPEN MODE for building phase: allow mock token "open-mode-jwt" without Supabase roundtrip
export async function requireUser(req: Request): Promise<{ userId: string; token: string }> {
  const auth = req.headers.get("Authorization");
  // Building-phase open mode: no auth header → dev user (if OPEN_MODE)
  if (Deno.env.get("OPEN_MODE") === "true" && (!auth || !auth.startsWith("Bearer "))) {
    return { userId: "00000000-0000-4000-a000-000000000001", token: "open-mode-jwt" };
  }
  if (!auth?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = auth.slice(7);
  // Mock token for open mode (created by frontend fallback) — accept even without env for building
  if (token === "open-mode-jwt" || token === "mock-admin-jwt") {
    return { userId: "00000000-0000-4000-a000-000000000001", token };
  }
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeadersJson() },
    });
  }
  return { userId: data.user.id, token };
}

function corsHeadersJson(): string {
  return "application/json";
}

export function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function getAnonClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
}
