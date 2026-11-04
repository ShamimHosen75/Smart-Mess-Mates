CREATE OR REPLACE FUNCTION public.recalculate_all_totals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _members_updated integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can recalculate totals';
  END IF;

  WITH meal_agg AS (
    SELECT member_id,
      COALESCE(SUM(total_meals), 0) AS total,
      COALESCE(SUM((CASE WHEN lunch THEN lunch_value ELSE 0 END)
                 + (CASE WHEN breakfast THEN breakfast_value ELSE 0 END)
                 + custom_count), 0) AS day,
      COALESCE(SUM(CASE WHEN dinner THEN dinner_value ELSE 0 END), 0) AS night
    FROM public.meal_entries GROUP BY member_id
  ), adv_agg AS (
    SELECT member_id, COALESCE(SUM(amount), 0) AS total FROM public.advances GROUP BY member_id
  ), upd AS (
    UPDATE public.members m
    SET total_meals = COALESCE(ma.total, 0),
        day_meals = COALESCE(ma.day, 0),
        night_meals = COALESCE(ma.night, 0),
        advance_contributed = COALESCE(aa.total, 0),
        updated_at = now()
    FROM (SELECT id FROM public.members) x
    LEFT JOIN meal_agg ma ON ma.member_id = x.id
    LEFT JOIN adv_agg aa ON aa.member_id = x.id
    WHERE m.id = x.id
    RETURNING m.id
  )
  SELECT count(*) INTO _members_updated FROM upd;

  RETURN jsonb_build_object('members_updated', _members_updated, 'recalculated_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_all_totals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_all_totals() TO authenticated;