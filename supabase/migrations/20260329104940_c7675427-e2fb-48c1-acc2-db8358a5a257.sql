
CREATE OR REPLACE FUNCTION public.get_user_mess_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mess_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

DROP POLICY IF EXISTS "Admins and managers can view profiles in their mess" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can update profiles in their mess" ON public.profiles;

CREATE POLICY "Admins and managers can view profiles in their mess"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND (
      is_approved = false
      OR mess_id = get_user_mess_id(auth.uid())
    )
  )
);

CREATE POLICY "Admins and managers can update profiles in their mess"
ON public.profiles FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND (mess_id IS NULL OR mess_id = get_user_mess_id(auth.uid()))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND (mess_id IS NULL OR mess_id = get_user_mess_id(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can view members in their mess" ON public.members;
DROP POLICY IF EXISTS "Admins and managers can insert members" ON public.members;
DROP POLICY IF EXISTS "Admins and managers can update members" ON public.members;
DROP POLICY IF EXISTS "Admins and managers can delete members" ON public.members;

CREATE POLICY "Users can view members in their mess"
ON public.members FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR mess_id = get_user_mess_id(auth.uid())
);

CREATE POLICY "Admins and managers can insert members"
ON public.members FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

CREATE POLICY "Admins and managers can update members"
ON public.members FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

CREATE POLICY "Admins and managers can delete members"
ON public.members FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);
