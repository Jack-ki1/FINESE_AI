// Free-model cross-provider failover chain.
//
// The old FALLBACK_MODELS mechanism only retries *model names* against one
// already-chosen provider base URL — if that provider rate-limits (e.g. Groq
// 30 RPM), the request just fails. This chain retries across *providers*:
// fastest + most generous free limits first, tried in order until one
// succeeds. A 429/5xx moves to the next link; a 400/401 stops immediately
// (a real bug — don't burn the whole chain on it).

export interface ChainLink {
  provider: string;
  baseUrl: string;
  model: string;
  envKey: string;
}

// Order matters: fastest + most generous free limits first.
export const FREE_CHAIN: ChainLink[] = [
  { provider: "groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", envKey: "GROQ_API_KEY" },
  { provider: "cerebras", baseUrl: "https://api.cerebras.ai/v1", model: "llama3.1-70b", envKey: "CEREBRAS_API_KEY" },
  { provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.1-8b-instruct:free", envKey: "OPENROUTER_API_KEY" },
  { provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.0-flash", envKey: "GOOGLE_API_KEY" },
  { provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", model: "qwen/qwen3-8b", envKey: "NVIDIA_API_KEY" },
];

export interface FailoverAttempt {
  provider: string;
  status: number;
  message: string;
}

export interface FailoverResult {
  response: Response;
  usedProvider: string;
  usedModel: string;
  failedAttempts: FailoverAttempt[];
}

function isRateLimitOrServerError(status: number) {
  return status === 429 || status >= 500;
}

function resolveKey(link: ChainLink, extraKeys?: Record<string, string>): string {
  const userKey = extraKeys?.[link.provider]?.trim();
  if (userKey) return userKey;
  return Deno.env.get(link.envKey) || "";
}

function extraHeaders(provider: string): Record<string, string> {
  // OpenRouter requires/strongly prefers these; harmless elsewhere except
  // providers that reject unknown headers — so only send for openrouter.
  if (provider === "openrouter") {
    return {
      "HTTP-Referer": Deno.env.get("APP_URL") || "https://finese.ai",
      "X-Title": "FINESE AI",
    };
  }
  return {};
}

export async function callWithFreeFailover(
  body: Record<string, unknown>,
  opts: { signal?: AbortSignal; extraKeys?: Record<string, string>; startIndex?: number } = {},
): Promise<FailoverResult> {
  const n = FREE_CHAIN.length;
  const start = ((opts.startIndex || 0) % n + n) % n;
  const failedAttempts: FailoverAttempt[] = [];

  for (let i = 0; i < n; i++) {
    const link = FREE_CHAIN[(start + i) % n];
    const key = resolveKey(link, opts.extraKeys);
    if (!key) continue; // skip providers with no key configured anywhere

    const { model: _drop, ...rest } = body;
    const payload = { ...rest, model: link.model };
    let resp: Response;
    try {
      resp = await fetch(`${link.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...extraHeaders(link.provider),
        },
        body: JSON.stringify(payload),
        signal: opts.signal,
      });
    } catch (err) {
      // Network-level failure (DNS, reset) — retryable, try next link.
      failedAttempts.push({ provider: link.provider, status: 0, message: String(err).slice(0, 300) });
      continue;
    }

    if (resp.ok) {
      return { response: resp, usedProvider: link.provider, usedModel: link.model, failedAttempts };
    }
    if (isRateLimitOrServerError(resp.status)) {
      const text = await resp.text().catch(() => "");
      failedAttempts.push({ provider: link.provider, status: resp.status, message: text.slice(0, 300) });
      continue; // try the next free provider in the chain
    }
    // Non-retryable (bad request, bad auth) — stop, don't burn the chain.
    const text = await resp.text().catch(() => "");
    throw new Error(`${link.provider} returned ${resp.status}: ${text.slice(0, 300)}`);
  }

  const last = failedAttempts[failedAttempts.length - 1];
  if (!failedAttempts.length) {
    throw new Error(
      "No free provider keys configured. Add GROQ_API_KEY / CEREBRAS_API_KEY / OPENROUTER_API_KEY / GOOGLE_API_KEY / NVIDIA_API_KEY to the FINESE-chat function secrets, or supply your own key in Settings → AI.",
    );
  }
  throw new Error(`All free providers exhausted. Last error: ${last.provider} (${last.status}) — ${last.message}`);
}
