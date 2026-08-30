-- Persist onboarding progress so completed steps stay complete even if the
-- user later deletes a plant or device.

CREATE TABLE public.user_onboarding (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_plants_at timestamptz,
  completed_devices_at timestamptz,
  completed_location_at timestamptz,
  completed_notifications_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users manage own user_onboarding"
  ON public.user_onboarding
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- auth trigger: create onboarding row on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_onboarding (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_onboarding() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_onboarding ON auth.users;

CREATE TRIGGER on_auth_user_created_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_onboarding();

-- ============================================================
-- Backfill existing users from current data
-- ============================================================

INSERT INTO public.user_onboarding (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_onboarding o WHERE o.user_id = u.id
);

UPDATE public.user_onboarding AS o
SET
  completed_plants_at = COALESCE(o.completed_plants_at, p.first_at),
  updated_at = now()
FROM (
  SELECT user_id, min("createdAt") AS first_at
  FROM public.plants
  GROUP BY user_id
) AS p
WHERE o.user_id = p.user_id;

UPDATE public.user_onboarding AS o
SET
  completed_devices_at = COALESCE(o.completed_devices_at, d.first_at),
  updated_at = now()
FROM (
  SELECT user_id, min("createdAt") AS first_at
  FROM public.devices
  GROUP BY user_id
) AS d
WHERE o.user_id = d.user_id;

UPDATE public.user_onboarding AS o
SET
  completed_location_at = COALESCE(o.completed_location_at, now()),
  updated_at = now()
FROM public.notification_settings AS ns
WHERE o.user_id = ns.user_id
  AND ns.weather_lat IS NOT NULL
  AND ns.weather_lng IS NOT NULL;

UPDATE public.user_onboarding AS o
SET
  completed_notifications_at = COALESCE(o.completed_notifications_at, now()),
  updated_at = now()
WHERE o.completed_notifications_at IS NULL
  AND (
    EXISTS (
      SELECT 1
      FROM public.user_achievements ua
      WHERE ua.user_id = o.user_id
        AND ua.achievement_key = 'plant_texted_back'
    )
    OR (
      o.completed_plants_at IS NOT NULL
      AND o.completed_devices_at IS NOT NULL
      AND o.completed_plants_at <= now() - interval '3 days'
    )
  );
