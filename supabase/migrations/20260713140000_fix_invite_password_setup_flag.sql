-- Fix invite password-setup flag: BEFORE INSERT can be overwritten by GoTrue on confirm.
-- Use AFTER INSERT/UPDATE and backfill invited users missing the flag.

CREATE OR REPLACE FUNCTION public.flag_invited_user_password_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invited_at IS NOT NULL
     AND (NEW.raw_user_meta_data->>'needs_password_setup') IS NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
      || '{"needs_password_setup": true}'::jsonb
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_invited_password_setup ON auth.users;

CREATE TRIGGER on_auth_user_invited_password_setup
  AFTER INSERT OR UPDATE OF invited_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.flag_invited_user_password_setup();

-- Backfill invited users created before this fix was applied.
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || '{"needs_password_setup": true}'::jsonb
WHERE invited_at IS NOT NULL
  AND (raw_user_meta_data->>'needs_password_setup') IS NULL;
