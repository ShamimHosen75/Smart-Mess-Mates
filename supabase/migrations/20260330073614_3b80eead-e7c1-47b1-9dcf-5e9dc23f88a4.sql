
-- Create advances table
CREATE TABLE public.advances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id uuid NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  advance_date date NOT NULL DEFAULT CURRENT_DATE,
  note text NOT NULL DEFAULT '',
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as expenses)
CREATE POLICY "Users can view advances in their mess"
  ON public.advances FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR mess_id = get_user_mess_id(auth.uid()));

CREATE POLICY "Admins can insert advances"
  ON public.advances FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) AND mess_id = get_user_mess_id(auth.uid())));

CREATE POLICY "Admins can update advances"
  ON public.advances FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) AND mess_id = get_user_mess_id(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) AND mess_id = get_user_mess_id(auth.uid())));

CREATE POLICY "Admins can delete advances"
  ON public.advances FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) AND mess_id = get_user_mess_id(auth.uid())));

-- Updated_at trigger
CREATE TRIGGER set_advances_updated_at
  BEFORE UPDATE ON public.advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to sync members.advance_contributed
CREATE OR REPLACE FUNCTION public.sync_member_advance_total()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _member_id uuid;
  _total numeric;
BEGIN
  _member_id := COALESCE(NEW.member_id, OLD.member_id);

  SELECT COALESCE(SUM(amount), 0) INTO _total
  FROM public.advances
  WHERE member_id = _member_id;

  UPDATE public.members
  SET advance_contributed = _total, updated_at = now()
  WHERE id = _member_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_advance_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.advances
  FOR EACH ROW EXECUTE FUNCTION sync_member_advance_total();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.advances;
