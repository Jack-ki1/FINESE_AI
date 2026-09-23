# FINESE AI — architecture

The project has two clearly separated halves. Nothing in the frontend talks to the
database directly; every data/AI operation goes through a backend function.

## Frontend (`src/`)

| Folder | Responsibility |
| --- | --- |
| `src/pages` | Routed screens (chat, data viewer, auth, prompts) |
| `src/components` | Presentation: layout shell, chat, artifacts, data viewer, UI kit |
| `src/store` | Client state (Zustand, persisted) |
| `src/hooks` | Auth session, viewport helpers |
| `src/lib` | Client-side helpers: parsing, streaming client, ingest client, formatting |
| `src/workers` | Off-main-thread file parsing and Pyodide execution |
| `src/integrations` | Generated backend client (do not edit) |

Rules:
- Components never call the backend client directly — they go through `src/lib/*-client.ts` or the store.
- No statistics that the AI reports are computed in the UI; the UI only renders what the backend verified.

## Backend (`supabase/`)

| Function | Responsibility |
| --- | --- |
| `dataset-ingest` | Validates size/row caps (zod) + schema drift, stores dataset, builds column profile, caches in DB — rate-limited |
| `dataset-fetch` | Authenticated, cacheable read proxy for stored datasets; supports `profile_only` lightweight fetch — validated + rate-limited |
| `dataset-profile` | Lightweight alias — returns cached profile without downloading rows (used for session switching) — validated + rate-limited |
| `compute-tools` | 12 verified tools (describe, group-by, correlation, t-test, ANOVA, outliers, filter-count, histogram, classifier, regression, k-means, drift) + zod validation, rate limiting, per-file cache |
| `FINESE-chat` | AI orchestration + tool-calling loop (6 rounds, history cap 30, SSRF-safe gateway, zod validation, rate limiting); streams via SSE — single function (datum-chat removed) |
| `mcp` | MCP server for external agents — requires `MCP_API_KEY` or Supabase JWT, rate-limited, zod-validated |
| `_shared` | Shared helpers: CORS allow-list (`ALLOWED_ORIGINS` env), `auth` (strict JWT), `stats` (single source via `shared/`), `schemas` (zod), `rate-limit` (in-memory) |

Rules:
- Every function requires a valid JWT via `requireUser()` (no magic tokens) and verifies row ownership; service-role bypasses RLS only after auth.
- All inputs validated with `zod` via `_shared/schemas.ts` before touching DB/compute.
- Rate limiting per user/IP on every function (`_shared/rate-limit.ts`) — chat 20/min, compute 40/min, ingest 10/min.
- CORS `Access-Control-Allow-Origin` restricted via `ALLOWED_ORIGINS` env var (defaults to `*` only when not set — dev mode).
- SSRF-safe AI gateway: custom `baseUrl` requires own `apiKey`, never borrows server `AI_API_KEY`; provider allow-list only.
- All tables use owner-only RLS; storage objects live under `<user_id>/`.
- Errors returned to clients are generic; details stay in server logs.
- Verified artifacts (`verified:true`, teal solid) = server-computed; Estimated (`verified:false`, ochre dashed) = AI-generated; Offline preview (local JS) = dashed ochre with "Offline preview" label, never marked Verified.

## Responsive behaviour

- Layout is mobile-first: below 768px the session list and changelog become
  overlay drawers, the top bar collapses to icons, and the chat uses full width.
- Heights use `100dvh` so mobile browser chrome does not clip the input bar.
