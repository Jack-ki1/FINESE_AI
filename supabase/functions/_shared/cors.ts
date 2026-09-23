// Shared CORS helper — restricts Access-Control-Allow-Origin to configured domains.
// Set ALLOWED_ORIGINS env var as comma-separated list e.g. "https://app.example.com,https://example.com"
// If not set, defaults to "*" in development but logs a warning.
export function getCorsHeaders(req: Request): Record<string, string> {
  const allowedEnv = Deno.env.get("ALLOWED_ORIGINS");
  const requestOrigin = req.headers.get("Origin") || "";

  let allowOrigin = "*";
  if (allowedEnv) {
    const allowed = allowedEnv.split(",").map((s) => s.trim()).filter(Boolean);
    if (allowed.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    } else if (requestOrigin) {
      // Origin not in allow-list — do not echo it, but we still need to respond.
      // We return the first allowed origin so browser blocks mismatched origins.
      // For non-browser callers (no Origin header) we return the first allowed.
      allowOrigin = allowed[0] || "*";
    } else {
      allowOrigin = allowed[0] || "*";
    }
  } else if (requestOrigin) {
    // No allow-list configured — warn once and allow all (dev mode).
    console.warn("[cors] ALLOWED_ORIGINS not set — allowing all origins (*)");
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}

// Static wildcard headers for backwards-compat / OPTIONS preflight when no request context.
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin",
};
