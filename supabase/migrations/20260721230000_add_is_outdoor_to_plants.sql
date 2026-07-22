-- Mark plants as outdoor so watering alerts can include rain-forecast notes.

ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS "is_outdoor" boolean NOT NULL DEFAULT false;
