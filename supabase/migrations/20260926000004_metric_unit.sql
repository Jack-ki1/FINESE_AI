alter table public.metric_definitions add column if not exists unit text;
alter table public.metric_definitions add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
