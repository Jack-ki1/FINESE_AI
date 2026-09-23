// Simple in-memory sliding-window rate limiter for Deno edge functions.
// Not durable across cold starts, but cheap and effective as a first gate.
// For stronger guarantees use a Postgres/Supabase or Redis backing store.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function cleanBuckets() {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  cleanBuckets();
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitOrThrow(req: Request, userId: string | null, opts: { limit: number; windowMs: number; prefix: string }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
  const key = userId ? `${opts.prefix}:user:${userId}` : `${opts.prefix}:ip:${ip}`;
  const res = checkRateLimit(key, opts.limit, opts.windowMs);
  if (!res.allowed) {
    const retryAfter = Math.ceil((res.resetAt - Date.now()) / 1000);
    throw new Response(JSON.stringify({ error: "Rate limited — please try again shortly.", retryAfter }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    });
  }
  return res;
}

// Presets
export const LIMITS = {
  chat: { limit: 20, windowMs: 60_000, prefix: "chat" },
  compute: { limit: 40, windowMs: 60_000, prefix: "compute" },
  ingest: { limit: 10, windowMs: 60_000, prefix: "ingest" },
  fetch: { limit: 60, windowMs: 60_000, prefix: "fetch" },
  mcp: { limit: 30, windowMs: 60_000, prefix: "mcp" },
} as const;
