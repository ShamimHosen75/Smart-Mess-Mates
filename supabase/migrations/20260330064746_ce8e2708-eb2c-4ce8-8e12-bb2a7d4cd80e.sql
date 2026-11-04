
-- Create meal_entries table to store per-member daily meal records
CREATE TABLE public.meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  breakfast boolean NOT NULL DEFAULT false,
  lunch boolean NOT NULL DEFAULT false,
  dinner boolean NOT NULL DEFAULT false,
  breakfast_value numeric NOT NULL DEFAULT 0.5,
  lunch_value numeric NOT NULL DEFAULT 1,
  dinner_value numeric NOT NULL DEFAULT 1,
  custom_count numeric NOT NULL DEFAULT 0,
  total_meals numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view meal entries in their mess
CREATE POLICY "Users can view meal entries in their mess"
ON public.meal_entries FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR mess_id = get_user_mess_id(auth.uid())
);

-- RLS: Admins/moderators can insert meal entries
CREATE POLICY "Admins can insert meal entries"
ON public.meal_entries FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

-- RLS: Admins/moderators can update meal entries
CREATE POLICY "Admins can update meal entries"
ON public.meal_entries FOR UPDATE TO authenticated
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

-- RLS: Admins/moderators can delete meal entries
CREATE POLICY "Admins can delete meal entries"
ON public.meal_entries FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
    AND mess_id = get_user_mess_id(auth.uid())
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_meal_entries_updated_at
  BEFORE UPDATE ON public.meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to recalculate member meal totals from meal_entries
CREATE OR REPLACE FUNCTION public.sync_member_meal_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _member_id uuid;
  _total numeric;
  _day numeric;
  _night numeric;
BEGIN
  _member_id := COALESCE(NEW.member_id, OLD.member_id);

  SELECT
    COALESCE(SUM(total_meals), 0),
    COALESCE(SUM(CASE WHEN lunch THEN lunch_value ELSE 0 END + CASE WHEN breakfast THEN breakfast_value ELSE 0 END + custom_count), 0),
    COALESCE(SUM(CASE WHEN dinner THEN dinner_value ELSE 0 END), 0)
  INTO _total, _day, _night
  FROM public.meal_entries
  WHERE member_id = _member_id;

  UPDATE public.members
  SET total_meals = _total,
      day_meals = _day,
      night_meals = _night,
      updated_at = now()
  WHERE id = _member_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to sync on insert/update/delete
CREATE TRIGGER sync_meal_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_member_meal_totals();

-- Enable realtime for meal_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_entries;
