-- Change devices.plantId FK from CASCADE to RESTRICT
-- so that deleting a plant with active devices is blocked at the DB level.
ALTER TABLE "public"."devices"
  DROP CONSTRAINT IF EXISTS "devices_plantId_fkey",
  DROP CONSTRAINT IF EXISTS "devices_plant_id_fkey";

ALTER TABLE "public"."devices"
  ADD CONSTRAINT "devices_plantId_fkey"
  FOREIGN KEY ("plantId") REFERENCES "public"."plants"("id")
  ON UPDATE RESTRICT ON DELETE RESTRICT;
