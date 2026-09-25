alter table public.compute_jobs add column if not exists user_id uuid references auth.users(id);
create index if not exists idx_cj_user on public.compute_jobs(user_id, created_at);
