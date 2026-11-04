
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_suspended_idx ON public.profiles (is_suspended);
