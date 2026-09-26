// Client-side mirror of the server failover chain order
// (supabase/functions/FINESE-chat/free-model-chain.ts).
//
// NOTE: the edge file is server-only (uses Deno.env) and must never be
// imported into the browser bundle. This mirror carries only the display
// metadata (provider + model + why). If you reorder the server chain,
// reorder this list to match.

export const FREE_CHAIN_META: { provider: string; model: string; why: string }[] = [
  { provider: 'groq', model: 'llama-3.3-70b-versatile', why: 'Fastest LPU, most generous free limits' },
  { provider: 'cerebras', model: 'llama3.1-70b', why: 'Wafer-Scale speed, 1M tokens/day free' },
  { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct:free', why: 'Widest free selection, no card' },
  { provider: 'google', model: 'gemini-2.0-flash', why: '1M context, 1500 free requests/day' },
  { provider: 'nvidia', model: 'qwen/qwen3-8b', why: '40 RPM free, 1M context options' },
];
