-- Free-model reliability leaderboard (§3.3) + catalog health log (§3.6).
--
-- model_benchmarks: one row per (provider, model) — "does this free model
-- correctly call FINESE's own tools and produce parseable output", measured by
-- the model-benchmark edge function, not marketed. Public read (it backs the
-- public /free-models page); writes via service_role only.
create table if not exists public.model_benchmarks (
  provider text not null,
  model text not null,
  tool_call_accuracy numeric,      -- 0..1 fraction of contract checks passed
  avg_latency_ms integer,
  runs integer not null default 0,
  last_status text,               -- 'ok' | 'rate_limited' | 'error' | 'stale'
  last_error text,
  updated_at timestamptz not null default now(),
  primary key (provider, model)
);

alter table public.model_benchmarks enable row level security;

drop policy if exists "model_benchmarks public read" on public.model_benchmarks;
create policy "model_benchmarks public read"
  on public.model_benchmarks for select
  using (true);

-- catalog_health_log: weekly /models pings per provider (§3.6) — catches
-- silently-stale catalog entries (deprecated model IDs, tightened limits)
-- before a user does. Owner/admin read; service_role writes.
create table if not exists public.catalog_health_log (
  id bigint generated always as identity primary key,
  provider text not null,
  status text not null,            -- 'ok' | 'error'
  detail text,
  checked_at timestamptz not null default now()
);
create index if not exists idx_chl_provider on public.catalog_health_log(provider, checked_at desc);

alter table public.catalog_health_log enable row level security;

drop policy if exists "catalog_health_log owner read" on public.catalog_health_log;
create policy "catalog_health_log owner read"
  on public.catalog_health_log for select
  using (auth.uid() is not null);
