
-- Reset super admin password and ensure access
UPDATE auth.users
SET encrypted_password = crypt('@Developer96', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'shamimdevs75@gmail.com';

-- Grant execute on security definer helper functions used in RLS policies
GRANT EXECUTE ON FUNCTION public.get_user_mess_id(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
