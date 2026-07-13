-- On invite, GoTrue inserts auth.users with invited_at set.
-- Tag user_metadata so the SPA can force password setup before app access.
CREATE OR REPLACE FUNCTION public.handle_invited_user_password_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invited_at IS NOT NULL THEN
    NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
      || '{"needs_password_setup": true}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_invited_password_setup ON auth.users;

CREATE TRIGGER on_auth_user_invited_password_setup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invited_user_password_setup();
