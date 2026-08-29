-- Deleting an auth user previously failed because these FKs defaulted to
-- ON DELETE NO ACTION. Cascade so owned rows are removed with the user.

ALTER TABLE public.notification_settings
  DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

ALTER TABLE public.notification_settings
  ADD CONSTRAINT notification_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.plants
  DROP CONSTRAINT IF EXISTS plants_user_id_fkey;

ALTER TABLE public.plants
  ADD CONSTRAINT plants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.devices
  DROP CONSTRAINT IF EXISTS devices_user_id_fkey;

ALTER TABLE public.devices
  ADD CONSTRAINT devices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;
