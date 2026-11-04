
-- Update profiles SELECT policy: admins see only their mess, super_admin sees all
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
CREATE POLICY "Admins and managers can view profiles in their mess"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND (
        is_approved = false
        OR mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
      )
    )
  );

-- Update profiles UPDATE policy: admins can only update profiles in their mess
DROP POLICY IF EXISTS "Admins and managers can update all profiles" ON public.profiles;
CREATE POLICY "Admins and managers can update profiles in their mess"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND (
        mess_id IS NULL
        OR mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND (
        mess_id IS NULL
        OR mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
      )
    )
  );

-- Update members policies: scope admin/moderator to their own mess
DROP POLICY IF EXISTS "Admins and managers can insert members" ON public.members;
CREATE POLICY "Admins and managers can insert members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and managers can update members" ON public.members;
CREATE POLICY "Admins and managers can update members"
  ON public.members FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and managers can delete members" ON public.members;
CREATE POLICY "Admins and managers can delete members"
  ON public.members FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
      AND mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
    )
  );
