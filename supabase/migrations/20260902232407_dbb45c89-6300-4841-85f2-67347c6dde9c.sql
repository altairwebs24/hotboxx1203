GRANT SELECT ON public.admin_emails TO authenticated;
DROP POLICY IF EXISTS "admins read own allowlist row" ON public.admin_emails;
CREATE POLICY "admins read own allowlist row"
ON public.admin_emails FOR SELECT TO authenticated
USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));