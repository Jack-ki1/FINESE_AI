-- Semantic layer: metric_definitions — one row per user-defined metric
create table if not exists public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  expression text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.metric_definitions enable row level security;

revoke all on public.metric_definitions from anon;
grant select, insert, update, delete on public.metric_definitions to authenticated;
grant all on public.metric_definitions to service_role;

create policy "metric_definitions_owner_select" on public.metric_definitions
  for select to authenticated using (user_id = auth.uid());
create policy "metric_definitions_owner_insert" on public.metric_definitions
  for insert to authenticated with check (user_id = auth.uid());
create policy "metric_definitions_owner_update" on public.metric_definitions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "metric_definitions_owner_delete" on public.metric_definitions
  for delete to authenticated using (user_id = auth.uid());

create index if not exists metric_definitions_user_name_idx on public.metric_definitions(user_id, name);
