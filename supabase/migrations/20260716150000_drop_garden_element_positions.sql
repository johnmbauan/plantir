-- Layout lives on the frontend (GARDEN_LAYOUT). Drop unused position columns.
ALTER TABLE public.achievement_definitions
  DROP COLUMN IF EXISTS pos_x,
  DROP COLUMN IF EXISTS pos_y;
