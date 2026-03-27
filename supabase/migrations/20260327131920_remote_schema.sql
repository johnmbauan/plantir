alter table "public"."devices" drop constraint "devices_plantId_fkey";

alter table "public"."humidity_measurements" drop constraint "humidity_measurements_plant_id_fkey";

alter table "public"."devices" drop column "created_at";

alter table "public"."devices" drop column "updated_at";

alter table "public"."devices" add column "createdAt" timestamp with time zone not null default now();

alter table "public"."devices" add column "updatedAt" timestamp with time zone not null default now();

alter table "public"."devices" enable row level security;

alter table "public"."humidity_measurements" drop column "created_at";

alter table "public"."humidity_measurements" drop column "humidity_percentage";

alter table "public"."humidity_measurements" drop column "plant_id";

alter table "public"."humidity_measurements" drop column "updated_at";

alter table "public"."humidity_measurements" add column "createdAt" timestamp with time zone not null default now();

alter table "public"."humidity_measurements" add column "humidityPercentage" bigint not null;

alter table "public"."humidity_measurements" add column "plantId" bigint not null;

alter table "public"."humidity_measurements" add column "updatedAt" timestamp with time zone not null default now();

alter table "public"."humidity_sensors_config" drop column "created_at";

alter table "public"."humidity_sensors_config" drop column "updated_at";

alter table "public"."humidity_sensors_config" add column "createdAt" timestamp with time zone not null default now();

alter table "public"."humidity_sensors_config" add column "updatedAt" timestamp with time zone not null default now();

alter table "public"."humidity_sensors_config" enable row level security;

alter table "public"."plants" drop column "created_at";

alter table "public"."plants" drop column "image_url";

alter table "public"."plants" drop column "updated_at";

alter table "public"."plants" add column "createdAt" timestamp with time zone not null default now();

alter table "public"."plants" add column "imageUrl" text;

alter table "public"."plants" add column "updatedAt" timestamp with time zone not null default now();

alter table "public"."devices" add constraint "devices_plant_id_fkey" FOREIGN KEY ("plantId") REFERENCES public.plants(id) ON UPDATE RESTRICT ON DELETE CASCADE not valid;

alter table "public"."devices" validate constraint "devices_plant_id_fkey";

alter table "public"."humidity_measurements" add constraint "humidity_measurements_plant_id_fkey" FOREIGN KEY ("plantId") REFERENCES public.plants(id) ON UPDATE RESTRICT ON DELETE CASCADE not valid;

alter table "public"."humidity_measurements" validate constraint "humidity_measurements_plant_id_fkey";


