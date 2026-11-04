-- Allow super_admin to see ALL members across all messes
DROP POLICY IF EXISTS "Users can view members in their mess" ON public.members;

CREATE POLICY "Users can view members in their mess"
  ON public.members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR mess_id IN (SELECT p.mess_id FROM profiles p WHERE p.user_id = auth.uid())
  );