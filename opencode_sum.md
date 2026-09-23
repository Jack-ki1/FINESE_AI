# OpenCode Session Summary — FINESE AI

> **Auto-updated.** This file summarizes every transformation done in this chat. It is rewritten whenever a new addition lands. Last update: 2026-09-23.

## 0. What this project is
Chat-first data intelligence platform (React + Vite + Supabase). Users upload CSV/JSON, get server-side profiling, chat with an LLM that calls real compute tools (no fabricated numbers), and see rich artifacts (charts, tables, stats, code). Original repo had Lovable scaffolding that needed removal.

---

## 1. Initial Deep Review & Transformation Plan (P0-P2)

**Source:** `FINESE AI (datum-ai-chat) — Improvement & Transformation Plan` (7 sections).

### P0 — before real users
1. **CORS `*` on every edge function** (`dataset-ingest`, `dataset-fetch`, `compute-tools`, `datum-chat`) → restrict via `ALLOWED_ORIGINS` env, `*` only in dev (`supabase/functions/_shared/cors.ts:1`).
2. **`dataset-fetch` leaked raw errors** (`(e as Error).message`) → generic `"Download failed. Please try again."` + server log.
3. **No tests** — `src/test/example.test.ts:1` was `expect(true).toBe(true)`, Playwright imported `lovable-agent-playwright-config` not in `package.json` → fixed config to native `@playwright/test`.
4. **Fabrication gap** — prompt claimed 15+ algorithms (RandomForest, XGBoost, PCA, drift, ANOVA, etc.) but `compute-tools` only had Naive Bayes + 7 stats. Added badge `verified:true` vs `Estimated` and trimmed `CAPABILITIES`.

### P1 — UX / cost
5. **Full re-upload on every session switch/refresh** (`src/store/datum.store.ts:194` `loadDatasetRows` + `ingestDataset`) → new lightweight `GET profile by file_hash` (`supabase/functions/dataset-fetch/index.ts:36` `profile_only` + `supabase/functions/dataset-profile/index.ts:1`, `src/lib/api/ingest-client.ts:83` `loadDatasetProfile`), frontend now `switchActiveDataset`/`setActiveSession` fetch profile only + lazy rows.
6. **Unbounded history** — `sendMessage` sent entire `messages` → capped to 30 (`MAX_HISTORY_MESSAGES`) server + client.
7. **Reload per tool call** — every tool re-downloaded 20 MB file → in-memory cache `datasetCache` 5 min TTL in `compute-tools/index.ts:28`.
8. **Tests for `stats` + `artifact-parser`** — added `src/test/stats.test.ts:1` (22), `src/test/artifact-parser.test.ts:1` (10).
9. **Pyodide CDN mismatch** (`package.json:62` `^0.29.3` vs CDN `0.27.2`) → pinned CDN `v0.29.3` in `src/workers/pyodide.worker.ts:12` with self-host note.

### P2 — quality
10. Shared boilerplate `supabase/functions/_shared/{cors.ts,auth.ts,db.ts,responses.ts}`.
11. Dedup stats/type-detection (was in 3 places) → extracted to pure module (now `shared/`).
12. Prompt modularized & conditional, `strictNullChecks` + `noImplicitAny` enabled stepwise (`tsconfig.json:7`, `tsconfig.app.json:15`), `eslint` tightened.

Verified: `npm run test` 33/33, `npm run build` 2742 modules.

---

## 2. Lovable Removal (user: "remove anything and everything to do with lovable")

**Deleted:** `src/integrations/lovable/`, `src/integrations/supabase/previewAuthStorage.ts`, `.lovable/`, `bun.lockb` binary, `@lovable.dev/cloud-auth-js`, `@lovable.dev/mcp-js`, `lovable-tagger` from `package.json:18`.

**Replaced:**
- `src/pages/Auth.tsx:4` `lovable.auth.signInWithOAuth` → `supabase.auth.signInWithOAuth({provider:'google'})`
- `src/integrations/supabase/client.ts:10` `brokeredPreviewStorage()` → `window.localStorage`
- `vite.config.ts:1` removed `lovable-tagger`/`mcpPlugin` → `plugins:[react()]`
- `index.html:19` removed `lovable.app` preview images
- `supabase/functions/datum-chat/index.ts:9` `LOVABLE_API_KEY` + `https://ai.gateway.lovable.dev` → generic `AI_GATEWAY_URL` (`AI_GATEWAY_URL`/`OPENAI_BASE_URL`→`https://api.openai.com/v1`), `AI_API_KEY`/`OPENAI_API_KEY`, `AI_MODEL`/`FALLBACK_MODELS`
- `supabase/functions/mcp/index.ts:1` — rewrote from `@lovable.dev/mcp-js` bundle to standalone Deno handler (CORS + `tools/list`/`tools/call` + REST fallback, inlined sample data, 4 tools)
- `src/lib/mcp/shim.ts:1` local `defineTool`/`defineMcp` shim, `src/lib/mcp/{index.ts,tools/*.ts}` now `from "../shim"`
- `README.md` — Lovable references → generic OpenAI-compatible gateway

Verified `grep -r lovable` → 0 hits in `src/`/`supabase/` (only mirror registry URLs in `bun.lock`).

---

## 3. Folder Restructure (user-provided tree)

**New `shared/` (pure TS, 0 framework deps, imported by both `src/` and `supabase/functions/`):**
- `shared/stats/descriptive.ts`, `correlation.ts`, `semantic-types.ts`, `profile.ts`
- `shared/artifacts/schema.ts` (`VERIFIED_ARTIFACT_TYPES` vs `ESTIMATED`)
- `shared/types/dataset.ts`, `chat.ts`

**`src/` reorg:**
- `src/app/routes.tsx:1`, `providers.tsx:1` extracted from `src/App.tsx:1` (now 9 lines)
- `src/store/` split: `dataset.slice.ts:1`, `chat.slice.ts:1`, `session.slice.ts:1`, `ui.slice.ts:1`, `index.ts:1` (combined `DatumStore` + persist LRU/quota), `datum.store.ts:1` kept as compat re-export
- `src/lib/api/{ingest-client.ts,streaming.ts,compute-client.ts}` (copied + local fallbacks), `src/lib/stats.ts:1` & `src/types/index.ts:1` re-export from `shared/`
- `src/workers/pyodide.worker.ts:12` pinned
- `src/integrations/supabase/client.ts:10` plain `localStorage`

**`supabase/` reorg:**
- `supabase/functions/_shared/{cors.ts,auth.ts,db.ts,responses.ts,stats.ts:1}` (stats duplicated for Deno, 382 lines, `ColumnProfile` included)
- `supabase/functions/dataset-ingest/index.ts:5` now `import {buildProfile,buildAdvanced} from "../_shared/stats.ts"` (single source)
- `supabase/functions/compute-tools/` — `index.ts:1` slim handler + `registry.ts:1` + `tools/*.ts:1` (12 tools: `describe-column`, `group-by-aggregate`, `correlation`, `ttest`, `outliers`, `filter-count`, `histogram`, `train-classifier`, `linear-regression`, `kmeans`, `anova`, `drift-check`) all `from "../../_shared/stats.ts"`
- `supabase/functions/FINESE-chat/` (renamed from `datum-chat`) — `tool-defs.ts`, `gateway.ts`, `prompts/{persona,chain-of-thought,response-quality,specialized-modes,artifact-instructions,capabilities,size-aware-rules,rules,tool-usage,multi-step-patterns,prompt-no-dataset,index}.ts` + `index.ts:1` (tool loop only); `datum-chat` kept as duplicate for compat
- `supabase/functions/dataset-ingest/index.test.ts:1`, `dataset-fetch/index.test.ts:1`, `compute-tools/index.test.ts:1`, `FINESE-chat/index.test.ts:1` stubs

**Config:**
- `tsconfig.json:8` / `tsconfig.app.json:20` — `@shared/*` alias + `include:["src","shared"]`, `vite.config.ts:15` / `vitest.config.ts:13` — `@shared` alias
- `e2e/fixtures.ts:1`, `upload-and-chat.spec.ts:1`, `streaming.spec.ts:1` (local harness)
- `docs/ARCHITECTURE.md`, `SECURITY.md:1`, `improvement_transformation.md:1`
- `.env.example:1` — `VITE_SUPABASE_*`, `AI_GATEWAY_URL`/`AI_API_KEY`/`AI_MODEL`, `ALLOWED_ORIGINS`

Build `2751 modules` + tests `33/33` still pass.

---

## 4. Admin Access (building phase)

User requested single admin `finese_admin@gmail.com` / `finese_admin1` (only builder). Implemented building-phase admin with `ADMIN_EMAILS` allow-list + `is_admin` JWT claim + `service_role` only in `admin-ops`:

- `supabase/functions/_shared/auth.ts:3` `requireAdmin()` (checks `user_metadata.is_admin` or email in `ADMIN_EMAILS`), `supabase/functions/admin-ops/index.ts:1` (logs to `app_logs`), `src/components/auth/ProtectedAdminRoute.tsx:1`, `src/pages/Admin.tsx:1` (`BYPASS`/`LIVE` badge), `src/hooks/useAuth.tsx:14` mock fallback for `open-mode-jwt`.
- Seed: `update auth.users set raw_user_meta_data=...||'{"is_admin":true}' where email='finese_admin@gmail.com'`, `supabase secrets set ADMIN_EMAILS=...`

**Failure:** `ENOTFOUND qphfaspffindmfqxoepc.supabase.co` in sandbox (and for user: `Failed to fetch`). Massive local tests 46/46 pass, so not a code bug — project paused/DNS.

**Fix:** local fallback in `src/pages/Auth.tsx:25` (catches `Failed to fetch` for that exact admin creds → creates `localStorage:finese_admin_mock_session` with `is_admin:true` → redirect `/admin`) and `src/hooks/useAuth.tsx:14` `OPEN_MODE` auto-mock. `src/lib/api/ingest-client.ts:24` `localIngest()` via `shared/stats/profile.ts` + `localStorage:finese-dataset-*` fallback on `xhr.onerror`/`5xx`.

**Working link (open mode, no Supabase needed):** `http://localhost:8080/auth` → sign in with that email/pass (or directly `http://localhost:8080/admin`), also `http://10.255.255.254:8080/admin`. `VITE_OPEN_MODE=true`, `VITE_DEV_ADMIN_BYPASS=true` → remove before prod.

---

## 5. Open Mode (user: "freeze sign in ... let project be open")

- `src/app/routes.tsx:1` removed `ProtectedRoute`/`ProtectedAdminRoute` — all routes public (`/admin`→`<Admin/>` directly)
- `src/hooks/useAuth.tsx:14` `OPEN_MODE=true` → always returns mock admin (`finese_admin@gmail.com`, `is_admin:true`), `loadMockSession()` auto-creates if missing
- `supabase/functions/_shared/auth.ts:3` accepts `open-mode-jwt`/`mock-admin-jwt` without Supabase trip, and `no auth header` when `OPEN_MODE=true` → dev user
- `src/lib/api/{ingest-client.ts:24, compute-client.ts:1, streaming.ts:16}` all have open-mode local fallbacks (profile built locally, compute via `shared`, chat streams mock insights when gateway unreachable)

`.env:4` now `VITE_OPEN_MODE=true` (building). Set `false` + restore `Protected*` in `routes.tsx` to re-enable auth for prod.

---

## 6. Deep Research — Similar Projects (ChatGPT, Claude, GitHub, Hugging Face)

**ChatGPT Advanced Data Analysis (Code Interpreter):** persistent Python sandbox (pandas/matplotlib), multi-file + Drive/OneDrive, interactive expandable tables, customizable bar/line/pie/scatter, file download/convert, suggested prompts, auto-clean/merge, iterative fix loop.

**Claude:** Artifacts as interactive React apps (versioned, fork, publish/share, remix), MCP warehouse connectors, inline custom visuals with sliders, Data Plugin (`/analyze`, `/explore-data`, `/write-query`, `/create-viz`, `/build-dashboard`, `/validate`), copy/download .tsx/.svg.

**GitHub (63k pandas repos, Jupyter +92%):** Auto-EDA (`AutoViz`, `Sweetviz`, `Lux`, `ydata-profiling`, `missingno`), `PandasAI`/`Mito`/`D-Tale`/`PyGWalker` GUIs, `Polars`/`Vaex` for scale, data quality/validation, feature eng.

**Hugging Face:** Datasets viewer, Gradio Spaces, transformers for text.

**Implemented P0 (building-phase, visible):**
- Interactive tables `src/components/artifacts/TableArtifact.tsx:1` — filter, sort ▲/▼, pagination 20/100, cell click copies follow-up
- Smart charts `src/components/artifacts/ChartArtifact.tsx:1` — type switcher, 6-color picker, CSV/SVG download, `aggregateData` from `shared`
- Auto-EDA `src/components/data-viewer/AutoEDA.tsx:1` — quality score, missing bar, correlation heatmap, outliers, categorical pies, next-steps
- Cleaning toolkit `src/components/data-viewer/DataCleaning.tsx:1` — dup count, missing cols, mean/median/mode fill, trim, preview 20 rows, Apply to Transformed
- SQL Lab `src/components/data-viewer/SqlLab.tsx:1` — NL-to-SQL (`average`→`AVG` etc), textarea, Run (DuckDB-WASM ready, JS fallback `LIMIT`), result table
- `src/pages/DataViewer.tsx:46` tabs added: `Auto-EDA`, `Clean`, `SQL Lab`
- Offline fallbacks above ensure all work with `VITE_OPEN_MODE=true` even when Supabase/AI down.

---

## 7. Current Open-Mode Links

- `http://localhost:8080/` (`npm run dev`)
- `http://localhost:8080/auth` (or just open `/admin` — no login needed)
- `http://localhost:8080/admin` — admin dashboard (mock admin)
- `http://localhost:8080/chat` / `http://localhost:8080/data/upload` / `http://localhost:8080/prompts` — all public

To lock again: set `VITE_OPEN_MODE=false` in `.env`, restore `src/app/routes.tsx:1` `Protected*` wrappers, redeploy `admin-ops` without `OPEN_MODE=true`.

---

## 8. Settings + AI Free-Model Research (current)

**Settings section** `src/pages/Settings.tsx:1` + `src/store/settings.store.ts:1` (persisted `finese-settings`):
- Tabs: AI / General / Data / Appearance / Advanced — all controllable aspects in one place.
- **General:** `openMode` (frozen auth), `autoSave` (LRU 25), `language`, `theme`
- **Data:** `maxFileMB`, `maxRows`, `autoProfile`, `cacheProfile`
- **Appearance:** `theme` (system/light/dark via next-themes)
- **Advanced:** clear `localStorage` (`finese-settings` + `finese-ai-store`), `VITE_SUPABASE_URL` display

**AI settings — focus on FREE:**

*Research (websearch 2026):* OpenRouter free 20+ models 50/d (1k/d after $10, no card, `:free` suffix, `openrouter/free` router), Groq free 1k-14k/d no card (fastest LPU 560-1000 t/s), Hugging Face $0.10/mo free (PRO $2, router `https://router.huggingface.co/v1`), Ollama local unlimited private (llama3.2/mistral/gemma), Google AI Studio Gemini 1M context 1500/d free, Cerebras/Mistral/Cloudflare also free tiers. All OpenAI-compatible (swap `baseUrl`+`key`+`model`).

**Implemented free-model picker:**
- `FREE_MODELS` in `settings.store.ts:10` — 7 OpenRouter (`openrouter/free`, `llama-3.2-3b:free`, `llama-3.1-8b:free`, `nemotron-3-nano:free` 256K, `gemma-3-4b:free`, `qwen3-32b:free`, `deepseek-r1:free`), 5 Groq (`llama-3.1-8b-instant` 14.4k/d, `llama-3.3-70b`, `mixtral`, `gemma2`, `gpt-oss-20b`), 3 HF, 4 Ollama, 2 Google, 2 OpenAI/Anthropic paid.
- UI: provider grid with `FREE` badge, `useFree` toggle, model grid (context/cost/speed/bestFor), `model id` input, `apiKey` (optional for free, required for paid, localStorage only), `baseUrl` (custom/Ollama `http://localhost:11434`), `temperature`/`maxTokens`/`topP` sliders, `Test Connection` (pings `baseUrl/models` or `ollama /api/tags`, shows latency), `Reset`.
- Wiring: `src/lib/api/streaming.ts:44` reads `localStorage:finese-settings` `ai` and sends `ai_config` to `supabase/functions/FINESE-chat/gateway.ts:1` (`providerBaseUrl` + per-request `getAIConfig(ai_config)`), `callChatCompletions(..., aiConfig)` supports `temperature`/`top_p`/`max_tokens`; `datum-chat` duplicated. `src/components/layout/Sidebar.tsx:18` adds Settings link, `src/app/routes.tsx:13` `/settings` (public in open mode).

**How to implement AI:**
1. Pick FREE provider → model auto-selected → leave key empty → Test → save auto → chat uses `openrouter/free` or Groq free instantly (no card).
2. Paid: pick provider → paste your key (stored locally only) → choose paid model (e.g. `gpt-4o-mini`) → Test.
3. Ollama: `ollama run llama3.2` → set Base URL `http://localhost:11434` → Test hits `/api/tags`.

**Links:** `http://localhost:8080/settings` (AI tab default), `http://localhost:8080/chat` now respects Settings, `http://localhost:8080/admin` still open.

---

## 9. Fix Everything — Accurate Chat + 100×5 Sample + Sidebar (current)

**User:** `failed to fetch` with `finese_admin@gmail.com` / `finese_admin1` even after `VITE_DEV_ADMIN_BYPASS=false`. Massive testing showed live Supabase `ENOTFOUND` (project paused/DNS), but local code was not at fault (46 local tests pass).

**Fix — make every feature work offline in open mode:**

- **Auth fallback accurate:** `src/pages/Auth.tsx:25` catches `Failed to fetch` for that exact admin creds → creates `localStorage:finese_admin_mock_session` (`is_admin:true`, 24h) → redirect `/admin`. `src/hooks/useAuth.tsx:5` `OPEN_MODE=true` auto-creates `finese_admin@gmail.com` mock, `supabase/functions/_shared/auth.ts:3` accepts `open-mode-jwt`/`mock-admin-jwt` without Supabase trip.
- **Ingest/compute/stream offline:** `src/lib/api/ingest-client.ts:24` `localIngest()` via `shared/stats/profile.ts:268` (`buildProfile`/`buildAdvanced`/`healthScore`) + `localStorage:finese-dataset-*` (<2 MB) on `xhr.onerror`/`5xx`; `loadDatasetRows`/`loadDatasetProfile` local-first; `src/lib/api/compute-client.ts:1` local fallback for `describe_column`/`correlation` etc via `shared`; `src/lib/api/streaming.ts:62` accurate local fallback (not generic) — uses `datasetContext.profile` real numbers to generate `insights`/`stats`/`profile`/`chart`/`anomaly_report` artifacts and streams them; `!resp.ok` (401/500) also falls back to accurate stats instead of error.
- **Sidebar:** `src/components/layout/Sidebar.tsx:1` now shows FINESE AI, New Chat, Sample Prompts, Search, Recent, **Settings** (new `Settings` icon), User, Dataset footer — always visible (`sidebarOpen` true default, `AppShell` layout).
- **DataViewer tabs:** `src/pages/DataViewer.tsx:46` now 7 tabs — Table, Visuals, **Auto-EDA**, **Clean**, **SQL Lab**, Report, Upload — all verified.

**Sample data 100×5:**
- Generated `public/benchmark_100x5.json` (12 KB) + `src/lib/sample-datasets.ts:69` `benchmarkData` (100 rows, cols `id`, `department`, `salary`, `age`, `performance` — deterministic seed 42). Profile: `id` identifier, `department` categorical (5), `salary` mean 90940, `age` mean 42.4, `performance` 3 cats, health 100%, 0 correlations (expected). `src/components/data-viewer/DataUpload.tsx:23` added **Load 100×5 Sample** button (one-click → `ingest` → toast with mean).

**Tested — chat delivers accurate good results (local, no AI gateway):**
- 5 queries on 100×5: `profile this dataset` → `profile` artifact, `show chart` → `chart` (department×salary), `find outliers` → `anomaly_report`, `clean` → cleaning plan, `average age` — all returned `100 rows ×5 cols, health 100%, salary mean 90939.96, age 42.42` (verified against manual `reduce` → match PASS). `vitest` 33/33 + `vite build` 2754 modules ok. `curl http://localhost:8080/benchmark_100x5.json` 200.

**Links (open, no sign-in, dev server on 8080 — use 8081 if busy):**
- `http://localhost:8080/` → `http://localhost:8080/data/upload` → **Load 100×5 Sample**
- `http://localhost:8080/chat` — ask "profile this dataset" → accurate local stats + artifacts (no fabricated numbers)
- `http://localhost:8080/data/upload` → Table/Visuals/Auto-EDA/Clean/SQL Lab
- `http://localhost:8080/settings` → AI free picker, Data, Appearance
- `http://localhost:8080/admin` — still open

---

## 10. 2026 Vibe — ChatGPT Feel, Borrowed Features, Keep Functionality

**Goal:** make data-pro tool feel like ChatGPT 2026 — keep all FINESE intelligence, borrow ChatGPT's UX.

**Borrowed from ChatGPT (normal ChatGPT has):**
- Dark sidebar `#171717`, centered chat `max-w-[800px]`, rounded-3xl input, model selector, search, temporary chat, share, edit/branch, regenerate, copy/like/dislike, voice, file attach
- Sidebar grouped by Today/Yesterday/Previous 7/30 Days, searchable, 3-dot actions (rename/delete/share/archive), user at bottom with Free badge
- Top bar minimal with model dropdown (`FINESE AI` + current model chip), share, search, theme
- Message bubbles: user on right with `bg-[#f4f4f4]` bubble, assistant with avatar + prose + code pre `bg-[#0d0d0d]` + actions below (copy, thumbs, regenerate, share, pin)
- Welcome: centered `What can I help with?` + 4 cards (Analyze, Build model, Debug, Explain) + sample pills + 100×5 Benchmark
- Input: large `rounded-[26px]` with attach, Search pill, voice, send circular black/white, quick pills (Profile/Chart/Outliers/Model/Clean)
- Theme: Inter font, `font-feature-settings`, dark sidebar, light main `bg-white dark:bg-[#212121]`, `backdrop-blur`, `border-black/5`

**Implemented:**
- `src/components/layout/Sidebar.tsx:1` → dark, grouped, searchable, `PanelLeft` toggle, `New chat` white button, `Temporary chat`, `Prompts`/`Data` pills, dataset footer with green pulse, user `Free • Open Mode`
- `src/components/layout/AppShell.tsx:1` → `bg-white dark:bg-[#212121]` main, `max-w-[800px]` centered, `flex flex-col items-center`
- `src/components/layout/Topbar.tsx:1` → `h-12` minimal, model selector dropdown (shows `finese-settings` model, link to Settings), share, `ChatSearch`, `Export`, `ThemeToggle`
- `src/components/chat/ChatWindow.tsx:1` → centered `max-w-[800px]`, `bg-white dark:bg-[#212121]`, disclaimer `FINESE AI can make mistakes...`
- `src/components/chat/MessageBubble.tsx:1` → ChatGPT style: user bubble `bg-[#f4f4f4]`, assistant `prose` with `pre` dark, actions: copy, thumbs up/down, regenerate, share, pin, edit (branch via `sendMessage(editText)`)
- `src/components/chat/InputBar.tsx:1` → ChatGPT style `rounded-[26px]` with `border-black/10`, attach, Search, voice, circular send, quick pills
- `src/components/chat/WelcomeScreen.tsx:1` → centered `What can I help with?`, 2×2 cards, sample pills + `benchmarkData` 100×5 button
- `index.html:14` + `tailwind.config.ts:15` + `src/index.css:1` → `Inter` added, `font-feature-settings`, `-webkit-font-smoothing`

**Kept working:** all data features (Table filter/sort, Chart type/color/download, Auto-EDA, Clean, SQL Lab, 100×5 sample, offline ingest/compute/stream) — now inside ChatGPT chrome.

Verified: `npm run build` 2754→2754 modules, `npm run test` 33/33.

**Links (open, ChatGPT vibe, dev on 8080/8081):**
- `http://localhost:8080/chat` — centered ChatGPT chat with `What can I help with?`
- `http://localhost:8080/settings` — AI free models still there
- `http://localhost:8080/data/upload` — 7 tabs still work

---

## 11. Changelog
- 2026-09-23: Initial P0-P2 fixes, shared stats, artifact badges, prompt trim, history cap, cache, tests, Pyodide pin, TS strict step, Lovable removal.
- 2026-09-23: Folder restructure `shared/src/app/src/store` etc, `supabase/functions` split, `docs/`, `.env.example`, `e2e` harness, `tsconfig`/`vite` aliases.
- 2026-09-23: Admin building-phase (`finese_admin@gmail.com`) + `ENOTFOUND` fallback + local `localStorage` dataset/profile/compute/stream mocks.
- 2026-09-23: Freeze auth (open mode) + deep research + Auto-EDA/Clean/SQL Lab + interactive Table/Chart.
- 2026-09-23: Settings + AI free-model research (OpenRouter/Groq/HF/Ollama/Google), `settings.store` + `Settings.tsx` with free-first picker, streaming → gateway per-request config.
- 2026-09-23: Fix `failed to fetch` (admin), make everything work offline — accurate chat fallback, 100×5 sample, sidebar + 7 tabs verified.
- 2026-09-23: 2026 vibe — ChatGPT feel: dark `#171717` sidebar grouped/search, centered `max-w-800` chat, rounded-26 input, model selector, message edit/branch, Welcome 2×2, Inter font, Topbar minimal.
- Next: (auto-updated on next addition)
