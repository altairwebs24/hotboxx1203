GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (
        SELECT 1 FROM public.admin_emails ae
        WHERE lower(ae.email) = lower(coalesce(
          nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', ''))
      );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "admins upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "admins update menu images" ON storage.objects;
DROP POLICY IF EXISTS "admins delete menu images" ON storage.objects;

CREATE POLICY "admins upload menu images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin(auth.uid()));

CREATE POLICY "admins update menu images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin(auth.uid()));

CREATE POLICY "admins delete menu images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin(auth.uid()));