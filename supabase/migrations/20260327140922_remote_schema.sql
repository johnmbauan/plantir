alter table "public"."humidity_measurements" drop constraint "humidity_measurements_plant_id_fkey";

alter table "public"."humidity_measurements" drop column "plantId";

alter table "public"."humidity_measurements" add column "deviceId" bigint not null;

alter table "public"."humidity_measurements" add constraint "humidity_measurements_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES public.devices(id) ON UPDATE RESTRICT ON DELETE CASCADE not valid;

alter table "public"."humidity_measurements" validate constraint "humidity_measurements_deviceId_fkey";


