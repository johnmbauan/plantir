-- Rinomina del campo plant_id in plantId nella tabella devices in modo idempotente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'devices'
          AND column_name = 'plant_id'
    ) THEN
        ALTER TABLE "public"."devices"
            RENAME COLUMN "plant_id" TO "plantId";
    END IF;
END $$;

-- Aggiornamento dei vincoli per riflettere il nuovo nome del campo
ALTER TABLE ONLY "public"."devices"
    DROP CONSTRAINT IF EXISTS "devices_plant_id_fkey";

ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "public"."plants"("id") ON UPDATE RESTRICT ON DELETE CASCADE;