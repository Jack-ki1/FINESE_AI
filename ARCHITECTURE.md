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
| `dataset-ingest` | Validates size/row caps, stores the dataset, builds the column profile |
| `dataset-fetch` | Authenticated, cacheable read proxy for stored datasets |
| `compute-tools` | Real statistics and ML (correlation, t-test, classifier holdout evaluation) |
| `datum-chat` | AI orchestration + tool calling; streams responses |
| `mcp` | Public MCP server for external agents |

Rules:
- Every function requires a valid session token and verifies row ownership.
- All tables use owner-only row level security; storage objects live under `<user_id>/`.
- Errors returned to the client are generic; details stay in server logs.

## Responsive behaviour

- Layout is mobile-first: below 768px the session list and changelog become
  overlay drawers, the top bar collapses to icons, and the chat uses full width.
- Heights use `100dvh` so mobile browser chrome does not clip the input bar.
