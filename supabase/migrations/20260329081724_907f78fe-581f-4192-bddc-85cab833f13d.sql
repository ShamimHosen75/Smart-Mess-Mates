-- Update messes RLS: only super_admin can create/update/delete messes
DROP POLICY IF EXISTS "Admins can insert messes" ON public.messes;
DROP POLICY IF EXISTS "Admins can update messes" ON public.messes;
DROP POLICY IF EXISTS "Admins can delete messes" ON public.messes;

CREATE POLICY "Super admins can insert messes"
  ON public.messes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update messes"
  ON public.messes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete messes"
  ON public.messes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Update user_roles: super_admin can also manage roles (not just admin)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins and admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));