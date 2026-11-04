
-- Add is_approved column to profiles (existing users are approved, new ones default to false)
ALTER TABLE public.profiles ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

-- Approve all existing users
UPDATE public.profiles SET is_approved = true;

-- Allow unapproved users to still read their own profile (already covered by existing policy)
-- Admins and managers can view all profiles for approval
CREATE POLICY "Admins and managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'moderator')
);

-- Admins and managers can update any profile (for approval)
CREATE POLICY "Admins and managers can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'moderator')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'moderator')
);
