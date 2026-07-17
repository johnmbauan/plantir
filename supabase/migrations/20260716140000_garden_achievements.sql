-- Garden achievement system: schema, RLS, seed catalog.
-- Evaluation logic lives in the garden-achievements edge function.

-- ============================================================
-- calibrated_at on humidity sensor config
-- ============================================================

ALTER TABLE public.humidity_sensors_config
  ADD COLUMN IF NOT EXISTS calibrated_at timestamptz NULL;

-- ============================================================
-- achievement_definitions (static catalog)
-- ============================================================

CREATE TABLE public.achievement_definitions (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  garden_element text NOT NULL,
  pos_x numeric NOT NULL DEFAULT 50,
  pos_y numeric NOT NULL DEFAULT 50,
  sort_order int NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read achievement_definitions"
  ON public.achievement_definitions
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- user_achievements (INSERT only via service role / edge function)
-- ============================================================

CREATE TABLE public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL REFERENCES public.achievement_definitions(key) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_key)
);

CREATE INDEX user_achievements_user_id_idx ON public.user_achievements (user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own achievements"
  ON public.user_achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- user_garden_progress (writes via edge function service role)
-- ============================================================

CREATE TABLE public.user_garden_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_dashboard_visit date,
  last_all_healthy_date date,
  healthy_streak_days int NOT NULL DEFAULT 0,
  client_events jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.user_garden_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own garden progress"
  ON public.user_garden_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- Seed MVP + phase-2 hidden definitions
-- ============================================================

INSERT INTO public.achievement_definitions
  (key, name, description, garden_element, pos_x, pos_y, sort_order, is_hidden)
VALUES
  ('hello_my_name_is', 'Sprout Wars: A New Leaf', 'Create your first plant.', 'sprout', 48, 62, 10, false),
  ('stalking_fern_legally', 'Sensor and Sensibility', 'Register your first sensor.', 'sensor_mushroom', 62, 58, 20, false),
  ('matchmaker_of_moisture', 'When Harry Met Ivy', 'Link a sensor to a plant.', 'vine_link', 55, 52, 30, false),
  ('dirt_whisperer_initiate', 'Lost in Calibration', 'Finish calibrating a sensor.', 'magnifier', 38, 55, 40, false),
  ('plant_texted_back', 'The Pothos Always Rings Twice', 'Save notification settings or connect Telegram.', 'bell_flower', 72, 48, 50, false),
  ('fully_rooted_not_emotionally', 'Everything Everywhere Grow at Once', 'Plant, linked sensor, and calibration — setup complete.', 'garden_gnome', 28, 60, 60, false),
  ('hydration_hero', 'There Will Be Water', 'Water a plant within 48 hours of a watering alert.', 'watering_can', 42, 42, 70, false),
  ('back_from_the_mulch', 'Back to the Moisture', 'Bring an offline plant back online.', 'ghost_orchid', 68, 38, 80, false),
  ('juice_box_refiller', 'Battery Returns', 'Recharge a sensor after low battery.', 'battery_bush', 22, 48, 90, false),
  ('all_green_no_envy', 'LOTR: The Two Flowers', 'At least two monitored plants, all healthy at once.', 'clover_cluster', 50, 35, 100, false),
  ('accidental_collector', 'For a Few Dahlias More', 'Own 4 plants.', 'fern_pot', 78, 58, 110, false),
  ('latin_name_dropper', 'The Bulb Identity', 'Assign a species to a plant.', 'label_stake', 33, 38, 120, false),
  ('influencer_garden', 'Picture of Dorstenia Gray', 'Add photos to 3 plants.', 'camera_sunflower', 85, 45, 130, false),
  ('cloud_oracle', 'Rain (forecast) Man', 'Set your weather city.', 'rain_cloud', 18, 28, 140, false),
  ('face_of_the_garden', 'Being Jonquil Malkovich', 'Set a nickname and profile photo.', 'mirror_pond', 58, 72, 150, false),
  ('seven_days_without_drama', 'Seven Happy Days', 'Keep all monitored plants healthy for 7 days in a row.', 'week_wreath', 45, 25, 200, true),
  ('photosynthesis_stan', '30 Days of Light', 'Keep all monitored plants healthy for 30 days in a row.', 'month_sun', 55, 22, 210, true),
  ('the_comeback_kid', 'The Soil-shank Redemption', 'Bring a plant back to healthy after 3+ dry days.', 'phoenix_fern', 30, 30, 220, true),
  ('inbox_compost', 'Inbox Clear', 'Mark all notifications as read.', 'compost_bin', 80, 70, 230, true),
  ('time_traveler', 'Month History', 'Open a plant''s 30-day history chart.', 'hourglass_leaf', 15, 55, 240, true),
  ('midnight_mulcher', 'Alert Hour Visit', 'Open the dashboard near your daily alert hour.', 'moon_mushroom', 88, 32, 250, true);

-- ============================================================
-- Daily healthy-streak snapshot via edge function (pg_cron + pg_net)
-- ============================================================

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'garden-healthy-streak-daily';

SELECT cron.schedule(
  'garden-healthy-streak-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/garden-achievements',
    headers := jsonb_build_object(
      'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'api_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"action":"snapshot_streaks"}'::jsonb
  ) AS request_id;
  $$
);
