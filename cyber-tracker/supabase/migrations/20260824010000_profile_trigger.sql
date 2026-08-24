-- ============================================================
-- Auto-create profile on Supabase Auth user creation
-- ============================================================
-- This trigger fires whenever a new row is inserted into
-- auth.users (i.e., when someone signs up). It creates a
-- corresponding row in the public.profiles table.
--
-- The trigger uses SECURITY DEFINER so it bypasses RLS,
-- which is necessary because auth.users inserts happen
-- outside normal user request context.
--
-- It is idempotent: if a profile already exists for this
-- user, it does nothing (no duplicates).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it already exists (safe for re-runs)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
