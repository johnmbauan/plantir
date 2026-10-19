-- Drop finished expeditions so the journal starts on chaptered stories.
-- Bond points stay. Teams still out (status = active) stay, and will freeze
-- a chaptered outcome when they return.

DELETE FROM public.user_discoveries;

DELETE FROM public.notifications
WHERE type = 'expedition_returned';

DELETE FROM public.user_expeditions
WHERE status IN ('welcomed', 'cancelled', 'ready');
