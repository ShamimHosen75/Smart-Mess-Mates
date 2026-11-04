
-- Create messes table
CREATE TABLE public.messes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view messes (needed for selection)
CREATE POLICY "Authenticated users can view messes"
  ON public.messes FOR SELECT TO authenticated USING (true);

-- Only admins can create/update/delete messes
CREATE POLICY "Admins can insert messes"
  ON public.messes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messes"
  ON public.messes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete messes"
  ON public.messes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add mess_id to profiles
ALTER TABLE public.profiles ADD COLUMN mess_id uuid REFERENCES public.messes(id) ON DELETE SET NULL;

-- Add mess_id to members
ALTER TABLE public.members ADD COLUMN mess_id uuid REFERENCES public.messes(id) ON DELETE CASCADE;

-- Create a default mess and assign all existing data to it
INSERT INTO public.messes (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Default Mess');

-- Assign existing members and profiles to default mess
UPDATE public.members SET mess_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET mess_id = '00000000-0000-0000-0000-000000000001' WHERE is_approved = true;

-- Update members RLS to be mess-scoped (drop old, create new)
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
CREATE POLICY "Users can view members in their mess"
  ON public.members FOR SELECT TO authenticated
  USING (
    mess_id IN (SELECT p.mess_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- Update handle_profile_approved to include mess_id
CREATE OR REPLACE FUNCTION public.handle_profile_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
    INSERT INTO public.members (profile_id, name, mess_id)
    VALUES (NEW.id, COALESCE(NEW.full_name, 'New Member'), NEW.mess_id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Add updated_at trigger to messes
CREATE TRIGGER update_messes_updated_at
  BEFORE UPDATE ON public.messes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
