const ENV_GATEWAY = (Deno.env.get("AI_GATEWAY_URL") || Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
const ENV_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "";
const ENV_MODEL = Deno.env.get("AI_MODEL") || Deno.env.get("FALLBACK_MODELS") || "gpt-4o-mini";
export const FALLBACK_MODELS = ENV_MODEL.split(",").map((s) => s.trim()).filter(Boolean);
export const PRIMARY_MODEL = FALLBACK_MODELS[0] || "gpt-4o-mini";
export const FUNCTIONS_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;

// Resolve provider → baseUrl for OpenAI-compatible gateways
function providerBaseUrl(provider?: string, custom?: string) {
  if (custom) return custom.replace(/\/$/, "");
  switch (provider) {
    case 'openrouter': return 'https://openrouter.ai/api/v1';
    case 'groq': return 'https://api.groq.com/openai/v1';
    case 'huggingface': return 'https://router.huggingface.co/v1';
    case 'ollama': return 'http://localhost:11434/v1';
    case 'google': return 'https://generativelanguage.googleapis.com/v1beta/openai';
    case 'anthropic': return 'https://api.anthropic.com/v1';
    case 'openai': return 'https://api.openai.com/v1';
    default: return ENV_GATEWAY;
  }
}

export function getAIConfig(aiConfig?: any) {
  if (aiConfig && aiConfig.provider) {
    const base = providerBaseUrl(aiConfig.provider, aiConfig.baseUrl);
    const key = aiConfig.apiKey || ENV_KEY;
    const model = aiConfig.model || PRIMARY_MODEL;
    const fallbacks = aiConfig.model ? [aiConfig.model] : FALLBACK_MODELS;
    return { AI_GATEWAY_URL: base, AI_API_KEY: key, PRIMARY_MODEL: model, FALLBACK_MODELS: fallbacks, FUNCTIONS_BASE };
  }
  return { AI_GATEWAY_URL: ENV_GATEWAY, AI_API_KEY: ENV_KEY, PRIMARY_MODEL, FALLBACK_MODELS, FUNCTIONS_BASE };
}

export async function callChatCompletions(model: string, messages: any[], tools?: any[], stream = false, aiConfig?: any) {
  const { AI_GATEWAY_URL, AI_API_KEY } = getAIConfig(aiConfig);
  // For free tier (openrouter/groq/hf) allow empty key in building phase — will try without auth and fallback to mock if 401
  if (!AI_API_KEY && !(aiConfig?.useFree)) throw new Error("AI_API_KEY (or OPENAI_API_KEY) is not configured — pick a free model or add your key in Settings → AI");
  const body: any = { model, messages, stream };
  if (tools) { body.tools = tools; body.tool_choice = "auto"; }
  // Temperature/top_p from settings if provided
  if (aiConfig?.temperature !== undefined) body.temperature = aiConfig.temperature;
  if (aiConfig?.topP !== undefined) body.top_p = aiConfig.topP;
  if (aiConfig?.maxTokens !== undefined) body.max_tokens = aiConfig.maxTokens;
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if (AI_API_KEY) headers["Authorization"] = `Bearer ${AI_API_KEY}`;
  const resp = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return resp;
}

export async function runTool(name: string, args: any, file_hash: string, userJwt: string) {
  const resp = await fetch(`${FUNCTIONS_BASE}/compute-tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userJwt}` },
    body: JSON.stringify({ tool: name, args, file_hash }),
  });
  const json = await resp.json().catch(() => ({ error: "tool response parse failed" }));
  return json.result ?? json.error ?? json;
}
