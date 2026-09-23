# Security

## Auth
All edge functions use `supabase/functions/_shared/auth.ts::requireUser` — strict `supabase.auth.getUser(token)` only. No magic bypass tokens (`open-mode-jwt`/`mock-admin-jwt` removed). Frontend `useAuth` returns real Supabase session only; `/admin` is gated by `ProtectedAdminRoute` checking `user_metadata.is_admin` or `VITE_ADMIN_EMAILS` allow-list. `signInWithPassword` plaintext credentials removed from client bundle.

## SSRF / AI Key
`FINESE-chat/gateway.ts::getAIConfig` — custom `baseUrl` requires caller-supplied `apiKey`; server `AI_API_KEY` is never sent to a client-chosen endpoint. `baseUrl` validated (`https:` or `http://localhost` only) and allow-listed providers only (`openrouter`, `groq`, `huggingface`, `ollama`, `google`, `anthropic`, `openai`).

## MCP
`supabase/functions/mcp` requires `Authorization: Bearer <MCP_API_KEY>` or a valid Supabase JWT. Per-caller rate limit 30/min. No anonymous access.

## Input Validation
Every function validates with `zod` via `_shared/schemas.ts` (`ingestSchema`, `datasetFetchSchema`, `computeToolsSchema`, `chatRequestSchema`, `mcpCallSchema`). Invalid shapes rejected with 400.

## Rate Limiting
In-memory sliding window via `_shared/rate-limit.ts` — chat 20/min, compute 40/min, ingest 10/min, fetch 60/min, mcp 30/min per user/IP. Returns 429 with `Retry-After`.

## CORS
`ALLOWED_ORIGINS` env var restricts `Access-Control-Allow-Origin`. When unset, defaults to `*` (dev only) with warning. Set to comma-separated allow-list in production.

## RLS
Row Level Security enforces `user_id = auth.uid()` on `datasets` and `storage.objects` `<user_id>/`. `dataset_profiles` is keyed by `file_hash` only (shared profile for identical content) — intentional.

## Secrets
`.env` is gitignored and removed from history (`git rm --cached .env`). Rotate `SUPABASE_ANON_KEY`/`SERVICE_ROLE_KEY` and `AI_API_KEY` if they were previously committed. Use `.env.example` with placeholders.

## Dependencies
`xlsx` remains client-side only; evaluate migrating to `exceljs` due to SheetJS CVE history. Run `npm audit` in CI.
