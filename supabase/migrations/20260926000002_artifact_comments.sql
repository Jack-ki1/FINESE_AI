create table if not exists public.artifact_comments (
  id uuid primary key default gen_random_uuid(),
  file_hash text not null,
  artifact_type text not null,
  artifact_title text,
  message_id text,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.artifact_comments enable row level security;
revoke all on public.artifact_comments from anon; grant select,insert,update,delete on public.artifact_comments to authenticated; grant all on public.artifact_comments to service_role;
create policy "ac_select" on public.artifact_comments for select to authenticated using (true);
create policy "ac_insert" on public.artifact_comments for insert to authenticated with check (user_id = auth.uid());
create policy "ac_delete" on public.artifact_comments for delete to authenticated using (user_id = auth.uid());
create index if not exists idx_ac_file on public.artifact_comments(file_hash);
