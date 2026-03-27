-- Rinomina del campo sleep_duration_seconds in sleepDurationSeconds nella tabella humidity_sensors_config in modo idempotente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'humidity_sensors_config'
          AND column_name = 'sleep_duration_seconds'
    ) THEN
        ALTER TABLE "public"."humidity_sensors_config"
            RENAME COLUMN "sleep_duration_seconds" TO "sleepDurationSeconds";
    END IF;
END $$;