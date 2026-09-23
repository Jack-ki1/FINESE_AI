# Improvement & Transformation Plan

This document tracks the P0/P1/P2 roadmap from the review and the migration to the new folder structure.

## Folder Structure
See `FINESE_AI/` tree in the main prompt. Key changes:
- `shared/` — pure TS (stats, types, artifacts) used by both frontend and edge functions
- `src/app/` — routes.tsx + providers.tsx (was inline in App.tsx)
- `src/store/` — split into dataset/chat/session/ui slices + index
- `src/lib/api/` — streaming, ingest-client, compute-client
- `supabase/functions/_shared/` — cors, auth, db, responses
- `supabase/functions/compute-tools/registry.ts` + `tools/*.ts`
- `supabase/functions/FINESE-chat/` — tool-defs, gateway, prompts/* (renamed from datum-chat; datum-chat remains as deprecated wrapper)

## Completed
- CORS allow-list, generic errors, shared stats, artifact badges, prompt trimming, history cap, dataset cache, localStorage quota handling, Pyodide 0.29.3, TS strictNullChecks, removed Lovable deps.

## Remaining
- Supabase _shared stats now re-exports from shared/ (single source of truth)
- E2E harness uses local fixtures (no external package)
- Pyodide self-hosting: change `src/workers/pyodide.worker.ts` indexURL to serve from `/pyodide/` assets if you vendor the npm package; currently pinned CDN 0.29.3 as interim.
