
-- Create members table linked to profiles
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  is_guest boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  total_meals numeric NOT NULL DEFAULT 0,
  day_meals numeric NOT NULL DEFAULT 0,
  night_meals numeric NOT NULL DEFAULT 0,
  personal_purchases numeric NOT NULL DEFAULT 0,
  advance_contributed numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view members
CREATE POLICY "Authenticated users can view members"
  ON public.members FOR SELECT
  TO authenticated
  USING (true);

-- Admins and managers can insert/update/delete members
CREATE POLICY "Admins and managers can insert members"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and managers can update members"
  ON public.members FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and managers can delete members"
  ON public.members FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Trigger to update updated_at
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: auto-add member when profile is approved
CREATE OR REPLACE FUNCTION public.handle_profile_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When is_approved changes from false to true, create a member record
  IF NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
    INSERT INTO public.members (profile_id, name)
    VALUES (NEW.id, COALESCE(NEW.full_name, 'New Member'))
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on profiles table for auto-add
CREATE TRIGGER on_profile_approved
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_approved();

-- Seed existing hardcoded members (not linked to profiles, profile_id will be null-safe via a dummy approach)
-- Instead, let's insert existing members without profile_id link since they're legacy data
-- We'll remove the NOT NULL constraint on profile_id to allow manual members
ALTER TABLE public.members ALTER COLUMN profile_id DROP NOT NULL;

-- Seed the existing hardcoded members
INSERT INTO public.members (name, role, is_guest, is_active, total_meals, day_meals, night_meals, personal_purchases, advance_contributed) VALUES
  ('Abdullah', 'admin', false, true, 16.5, 16, 1, 0, 0),
  ('Khokon', 'member', false, true, 27, 20, 14, 1365, 0),
  ('Nijam', 'member', false, true, 23, 17, 12, 800, 0),
  ('Nur Jaman', 'manager', false, true, 27.5, 20, 15, 0, 0),
  ('Tonoy', 'member', false, true, 9, 9, 0, 0, 0),
  ('Mojammel', 'member', false, true, 26.5, 19, 15, 0, 0),
  ('Office Guest', 'member', true, true, 2, 2, 0, 0, 0);

-- Also create member for the already-approved test user
INSERT INTO public.members (profile_id, name)
SELECT p.id, p.full_name
FROM public.profiles p
WHERE p.is_approved = true
  AND NOT EXISTS (
    SELECT 1 FROM public.members m WHERE m.name = p.full_name
  );
