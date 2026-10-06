-- Sanctuary expeditions and creature bonds.
-- User progress is written only by the garden-expeditions edge function.

-- ============================================================
-- Plain achievement titles (drop movie-pun catalog names)
-- ============================================================

UPDATE public.achievement_definitions SET name = 'First Plant' WHERE key = 'hello_my_name_is';
UPDATE public.achievement_definitions SET name = 'First Sensor' WHERE key = 'stalking_fern_legally';
UPDATE public.achievement_definitions SET name = 'Sensor Linked' WHERE key = 'matchmaker_of_moisture';
UPDATE public.achievement_definitions SET name = 'Sensor Calibrated' WHERE key = 'dirt_whisperer_initiate';
UPDATE public.achievement_definitions SET name = 'Notifications Ready' WHERE key = 'plant_texted_back';
UPDATE public.achievement_definitions SET name = 'Setup Complete' WHERE key = 'fully_rooted_not_emotionally';
UPDATE public.achievement_definitions SET name = 'Watered in Time' WHERE key = 'hydration_hero';
UPDATE public.achievement_definitions SET name = 'Sensor Back Online' WHERE key = 'back_from_the_mulch';
UPDATE public.achievement_definitions SET name = 'Battery Recharged' WHERE key = 'juice_box_refiller';
UPDATE public.achievement_definitions SET name = 'Two Healthy Plants' WHERE key = 'all_green_no_envy';
UPDATE public.achievement_definitions SET name = 'Four Plants' WHERE key = 'accidental_collector';
UPDATE public.achievement_definitions SET name = 'Species Assigned' WHERE key = 'latin_name_dropper';
UPDATE public.achievement_definitions SET name = 'Three Plant Photos' WHERE key = 'influencer_garden';
UPDATE public.achievement_definitions SET name = 'Weather City Set' WHERE key = 'cloud_oracle';
UPDATE public.achievement_definitions SET name = 'Profile Complete' WHERE key = 'face_of_the_garden';
UPDATE public.achievement_definitions SET name = 'Seven Healthy Days' WHERE key = 'seven_days_without_drama';
UPDATE public.achievement_definitions SET name = 'Thirty Healthy Days' WHERE key = 'photosynthesis_stan';
UPDATE public.achievement_definitions SET name = 'Recovered After Drought' WHERE key = 'the_comeback_kid';
UPDATE public.achievement_definitions SET name = 'Inbox Cleared' WHERE key = 'inbox_compost';
UPDATE public.achievement_definitions SET name = 'Month History Viewed' WHERE key = 'time_traveler';
UPDATE public.achievement_definitions SET name = 'Alert Hour Visit' WHERE key = 'midnight_mulcher';

-- ============================================================
-- Notification types and expedition opt-in
-- ============================================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'watering',
    'offline',
    'achievement',
    'onboardingCompleted',
    'expedition_returned',
    'bond_level',
    'personal_expedition'
  ));

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS expedition_notifications_enabled boolean NOT NULL DEFAULT false;

-- ============================================================
-- user_creature_bonds
-- ============================================================

CREATE TABLE public.user_creature_bonds (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL REFERENCES public.achievement_definitions(key) ON DELETE CASCADE,
  bond_points int NOT NULL DEFAULT 0,
  bond_level int NOT NULL DEFAULT 1 CHECK (bond_level BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_key)
);

CREATE INDEX user_creature_bonds_user_id_idx ON public.user_creature_bonds (user_id);

ALTER TABLE public.user_creature_bonds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own creature bonds"
  ON public.user_creature_bonds
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- user_bond_events
-- ============================================================

CREATE TABLE public.user_bond_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL REFERENCES public.achievement_definitions(key) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('expedition', 'care', 'milestone')),
  points int NOT NULL,
  reason_code text NOT NULL,
  subject_id text NOT NULL DEFAULT 'once',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key, reason_code, subject_id)
);

CREATE INDEX user_bond_events_user_id_idx ON public.user_bond_events (user_id, created_at DESC);

ALTER TABLE public.user_bond_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own bond events"
  ON public.user_bond_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- user_expeditions
-- ============================================================

CREATE TABLE public.user_expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id text NOT NULL,
  duration_key text NOT NULL,
  team text[] NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  returns_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'ready', 'welcomed', 'cancelled')),
  outcome jsonb,
  externally_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_expeditions_user_id_idx ON public.user_expeditions (user_id, created_at DESC);

CREATE UNIQUE INDEX user_expeditions_one_open_idx
  ON public.user_expeditions (user_id)
  WHERE status IN ('active', 'ready');

ALTER TABLE public.user_expeditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own expeditions"
  ON public.user_expeditions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.user_expeditions ENABLE REPLICA IDENTITY FULL;

-- ============================================================
-- user_discoveries
-- ============================================================

CREATE TABLE public.user_discoveries (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discovery_id text NOT NULL,
  expedition_id uuid REFERENCES public.user_expeditions(id) ON DELETE SET NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, discovery_id)
);

CREATE INDEX user_discoveries_user_id_idx ON public.user_discoveries (user_id);

ALTER TABLE public.user_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own discoveries"
  ON public.user_discoveries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- user_sanctuary
-- ============================================================

CREATE TABLE public.user_sanctuary (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intro_completed boolean NOT NULL DEFAULT false,
  visible_decoration_ids text[] NOT NULL DEFAULT '{}',
  last_celebrated_tier int NOT NULL DEFAULT 0,
  last_welcomed_expedition_id uuid REFERENCES public.user_expeditions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sanctuary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own sanctuary"
  ON public.user_sanctuary
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- Unique return notifications (one per expedition)
-- ============================================================

CREATE UNIQUE INDEX notifications_expedition_returned_unique_idx
  ON public.notifications (user_id, ((payload->>'expeditionId')))
  WHERE type = 'expedition_returned';

-- ============================================================
-- Cron: finish due expeditions every 2 minutes
-- ============================================================

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'garden-expeditions-complete-due';

SELECT cron.schedule(
  'garden-expeditions-complete-due',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/garden-expeditions',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"action":"complete_due"}'::jsonb
  ) AS request_id;
  $$
);
