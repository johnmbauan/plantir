-- Add user_id to devices so devices can be owned by a user independently of
-- being assigned to a plant.
-- Existing rows are backfilled with the same seed user used for plants.

ALTER TABLE public.devices
  ADD COLUMN "user_id" uuid NOT NULL
    DEFAULT '0a1c8ed9-f21d-44cf-9b82-7b8dc0d97f35'::uuid
    REFERENCES auth.users(id);

-- Drop the default so future inserts must supply user_id explicitly.
ALTER TABLE public.devices
  ALTER COLUMN "user_id" DROP DEFAULT;
