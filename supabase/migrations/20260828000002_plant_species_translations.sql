create table plant_species_translations (
  id            bigint generated always as identity primary key,
  species_id    bigint not null references plant_species(id) on delete cascade,
  locale        text not null,
  soil          text,
  sunlight      text,
  watering      text,
  fertilization text,
  pruning       text,
  translated_at timestamptz not null default now(),
  unique(species_id, locale)
);

-- Allow authenticated users to read translations for any species.
alter table plant_species_translations enable row level security;

create policy "Authenticated users can read translations"
  on plant_species_translations for select
  to authenticated
  using (true);

-- Only service role can insert/update (translations are written by edge functions).
create policy "Service role can manage translations"
  on plant_species_translations for all
  to service_role
  using (true)
  with check (true);
