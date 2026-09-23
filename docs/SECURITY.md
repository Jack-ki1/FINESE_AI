# Security

## CORS
`ALLOWED_ORIGINS` env var restricts `Access-Control-Allow-Origin`. When unset, defaults to `*` (dev only) with warning. Set to comma-separated allow-list in production.

## Auth
All edge functions require Bearer JWT and verify via `supabase.auth.getUser`. Row Level Security (RLS) enforces `user_id = auth.uid()` on `datasets` and storage paths `<user_id>/<file_hash>.json`. `dataset_profiles` is keyed by `file_hash` only (shared profile for identical content) — intentional, documented.

## Error Handling
All functions return generic messages to clients; details stay in server logs. `dataset-fetch` previously leaked `(e).message` — now generic.

## Validation
`dataset-ingest` checks row count (250k) and payload size (25MB) and warns on schema drift (inconsistent column sets) via `advanced.warnings`.

## Notes
- `dataset_profiles.file_hash` is not per-user; identical content shares a profile row. This is intentional (identical bytes → identical profile) but worth documenting for future migrations.
- MCP `supabase/functions/mcp` is standalone (no external deps) and implements minimal JSON-RPC; no auth required for public sample data tools.
