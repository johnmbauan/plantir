-- Add cached plant species data sourced from external providers (OpenPlantbook first),
-- then link user plants to a cached species row.

CREATE TABLE public.plant_species (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL,
  "sourceSpeciesId" text NOT NULL,
  "scientificName" text,
  "displayName" text,
  "commonNames" text[] NOT NULL DEFAULT '{}',
  "imageUrl" text,
  "minSoilMoisture" smallint,
  "maxSoilMoisture" smallint,
  "minEnvHumidity" smallint,
  "maxEnvHumidity" smallint,
  "minTemperatureCelsius" smallint,
  "maxTemperatureCelsius" smallint,
  sunlight text,
  soil text,
  watering text,
  fertilization text,
  pruning text,
  "rawPayload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "sourceUpdatedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "plant_species_source_sourceSpeciesId_key" UNIQUE (source, "sourceSpeciesId"),
  CONSTRAINT "plant_species_minSoilMoisture_range" CHECK (
    "minSoilMoisture" IS NULL OR ("minSoilMoisture" >= 0 AND "minSoilMoisture" <= 100)
  ),
  CONSTRAINT "plant_species_maxSoilMoisture_range" CHECK (
    "maxSoilMoisture" IS NULL OR ("maxSoilMoisture" >= 0 AND "maxSoilMoisture" <= 100)
  ),
  CONSTRAINT "plant_species_soilMoisture_order" CHECK (
    "minSoilMoisture" IS NULL OR "maxSoilMoisture" IS NULL OR "minSoilMoisture" <= "maxSoilMoisture"
  )
);

COMMENT ON TABLE public.plant_species IS 'Cached plant species data sourced from external providers such as OpenPlantbook.';

CREATE INDEX "plant_species_scientificName_idx"
  ON public.plant_species ("scientificName");

CREATE INDEX "plant_species_displayName_idx"
  ON public.plant_species ("displayName");

ALTER TABLE public.plants
  ADD COLUMN "species_id" bigint REFERENCES public.plant_species(id) ON DELETE SET NULL;

CREATE INDEX "plants_species_id_idx"
  ON public.plants ("species_id");

CREATE POLICY "authenticated users can read plant_species"
  ON public.plant_species
  FOR SELECT TO authenticated
  USING (true);
