-- Make devices.plantId nullable so it can be set to NULL when a plant is deleted
ALTER TABLE "public"."devices"
  ALTER COLUMN "plantId" DROP NOT NULL;

-- Change FK from RESTRICT to SET NULL
ALTER TABLE "public"."devices"
  DROP CONSTRAINT IF EXISTS "devices_plantId_fkey",
  DROP CONSTRAINT IF EXISTS "devices_plant_id_fkey";

ALTER TABLE "public"."devices"
  ADD CONSTRAINT "devices_plantId_fkey"
  FOREIGN KEY ("plantId") REFERENCES "public"."plants"("id")
  ON UPDATE RESTRICT ON DELETE SET NULL;
