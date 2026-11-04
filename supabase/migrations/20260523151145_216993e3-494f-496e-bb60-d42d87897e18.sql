
-- 1. Tighten receipts storage policies (scope to mess + admin role)
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

CREATE POLICY "Mess admins can upload receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = public.get_user_mess_id(auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

CREATE POLICY "Mess admins can delete receipts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'receipts'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR (
      (storage.foldername(name))[1] = public.get_user_mess_id(auth.uid())::text
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_role(auth.uid(), 'moderator'::public.app_role)
      )
    )
  )
);

CREATE POLICY "Mess members can view receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR (storage.foldername(name))[1] = public.get_user_mess_id(auth.uid())::text
  )
);

-- 2. Tighten messes SELECT
DROP POLICY IF EXISTS "Authenticated users can view messes" ON public.messes;
CREATE POLICY "Users can view their own mess"
ON public.messes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR id = public.get_user_mess_id(auth.uid())
);

-- 3. Restrict user_roles management to super_admins only (prevent admin self-escalation)
DROP POLICY IF EXISTS "Super admins and admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 4. Revoke direct EXECUTE on SECURITY DEFINER helpers from API roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_mess_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_profile_approved() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_member_advance_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_member_meal_totals() FROM PUBLIC, anon, authenticated;
