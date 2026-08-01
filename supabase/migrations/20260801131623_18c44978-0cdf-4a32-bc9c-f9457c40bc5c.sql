CREATE TABLE public.app_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'error' CHECK (level IN ('info','warn','error')),
  source text NOT NULL DEFAULT 'client',
  message text NOT NULL,
  context jsonb,
  path text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.app_logs TO authenticated;
GRANT ALL ON public.app_logs TO service_role;

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_logs_owner_insert ON public.app_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY app_logs_owner_select ON public.app_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX app_logs_created_at_idx ON public.app_logs (created_at DESC);
CREATE INDEX app_logs_user_level_idx ON public.app_logs (user_id, level);