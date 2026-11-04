
DO $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'shamimdevs75@gmail.com' LIMIT 1;
  IF _uid IS NULL THEN
    RAISE NOTICE 'Super admin auth user not found; skipping.';
    RETURN;
  END IF;

  UPDATE public.profiles
     SET is_approved = true,
         is_suspended = false
   WHERE user_id = _uid;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
