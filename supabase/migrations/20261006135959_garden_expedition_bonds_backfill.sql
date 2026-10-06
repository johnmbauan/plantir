-- Backfill sanctuary rows for users who already have unlocks, and keep
-- creature bonds in sync when a new achievement is earned.
-- Also set replica identity with valid Postgres syntax.

ALTER TABLE public.user_expeditions REPLICA IDENTITY FULL;

INSERT INTO public.user_creature_bonds (user_id, achievement_key, bond_points, bond_level)
SELECT ua.user_id, ua.achievement_key, 0, 1
FROM public.user_achievements ua
ON CONFLICT (user_id, achievement_key) DO NOTHING;

INSERT INTO public.user_sanctuary (user_id, intro_completed, last_celebrated_tier)
SELECT
  ua.user_id,
  true,
  CASE
    WHEN count(*) >= 13 THEN 4
    WHEN count(*) >= 9 THEN 3
    WHEN count(*) >= 5 THEN 2
    WHEN count(*) >= 1 THEN 1
    ELSE 0
  END
FROM public.user_achievements ua
GROUP BY ua.user_id
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_user_achievement_bond()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_creature_bonds (user_id, achievement_key, bond_points, bond_level)
  VALUES (NEW.user_id, NEW.achievement_key, 0, 1)
  ON CONFLICT (user_id, achievement_key) DO NOTHING;

  INSERT INTO public.user_sanctuary (user_id, intro_completed)
  VALUES (NEW.user_id, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_user_achievement_bond() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_user_achievement_bond ON public.user_achievements;

CREATE TRIGGER on_user_achievement_bond
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_achievement_bond();
