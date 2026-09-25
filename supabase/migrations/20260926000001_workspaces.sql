create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
revoke all on public.workspaces from anon; grant select,insert,update,delete on public.workspaces to authenticated; grant all on public.workspaces to service_role;
revoke all on public.workspace_members from anon; grant select,insert,update,delete on public.workspace_members to authenticated; grant all on public.workspace_members to service_role;
create policy "ws_owner_select" on public.workspaces for select to authenticated using (owner_id = auth.uid() or exists (select 1 from public.workspace_members m where m.workspace_id = id and m.user_id = auth.uid()));
create policy "ws_member_insert" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "wm_select" on public.workspace_members for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
create policy "wm_insert" on public.workspace_members for insert to authenticated with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
-- add workspace_id to datasets (nullable for backward compat)
alter table public.datasets add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.datasets add column if not exists user_id uuid references auth.users(id);
create index if not exists idx_datasets_workspace on public.datasets(workspace_id);
