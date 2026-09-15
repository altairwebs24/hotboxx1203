CREATE TABLE public.admin_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_push_tokens TO authenticated;
GRANT ALL ON public.admin_push_tokens TO service_role;

ALTER TABLE public.admin_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage own push tokens"
ON public.admin_push_tokens FOR ALL TO authenticated
USING (auth.uid() = user_id AND public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_admin_push_tokens_updated_at
BEFORE UPDATE ON public.admin_push_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();