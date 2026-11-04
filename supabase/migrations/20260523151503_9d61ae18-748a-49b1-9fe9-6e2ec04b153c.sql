
DO $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'shamimdevs75@gmail.com';

  IF _user_id IS NULL THEN
    _user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      _user_id,
      'authenticated',
      'authenticated',
      'shamimdevs75@gmail.com',
      crypt('@Developer96', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      _user_id,
      jsonb_build_object('sub', _user_id::text, 'email', 'shamimdevs75@gmail.com', 'email_verified', true),
      'email',
      _user_id::text,
      now(), now(), now()
    );
  END IF;

  -- Ensure profile exists and is approved
  INSERT INTO public.profiles (user_id, full_name, is_approved)
  VALUES (_user_id, 'Super Admin', true)
  ON CONFLICT (user_id) DO UPDATE SET is_approved = true;

  -- Ensure super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'super_admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
