import { describe, it, expect } from 'vitest';
import { buildPlant } from '@/test/builders/plant';
import type { PlantSpeciesSummary } from '@/types';
import { plantThumbnailUrl, speciesLabel } from '@/utils/plantDisplay';

function buildSpecies(overrides: Partial<PlantSpeciesSummary> = {}): PlantSpeciesSummary {
  return {
    id: 10,
    source: 'perenual',
    sourceSpeciesId: '42',
    scientificName: 'Monstera deliciosa',
    displayName: 'Swiss cheese plant',
    imageUrl: 'https://cdn/species.jpg',
    minSoilMoisture: null,
    maxSoilMoisture: null,
    minTemperatureCelsius: null,
    maxTemperatureCelsius: null,
    ...overrides,
  };
}

describe('speciesLabel', () => {
  it('returns null when species is missing', () => {
    expect(speciesLabel(buildPlant({ species: undefined }))).toBeNull();
  });

  it('prefers displayName, then scientificName, then sourceSpeciesId', () => {
    expect(speciesLabel(buildPlant({ species: buildSpecies() }))).toBe('Swiss cheese plant');
    expect(
      speciesLabel(
        buildPlant({
          species: buildSpecies({ displayName: null, scientificName: 'Ficus lyrata' }),
        }),
      ),
    ).toBe('Ficus lyrata');
    expect(
      speciesLabel(
        buildPlant({
          species: buildSpecies({
            displayName: null,
            scientificName: null,
            sourceSpeciesId: 'source-9',
          }),
        }),
      ),
    ).toBe('source-9');
  });
});

describe('plantThumbnailUrl', () => {
  it('prefers a plant Storage thumbnail over species image', () => {
    expect(
      plantThumbnailUrl(
        buildPlant({
          image_url:
            'https://x.supabase.co/storage/v1/object/public/plant-images/user/abc.jpg',
          species: buildSpecies({ imageUrl: 'https://cdn/species.jpg' }),
        }),
      ),
    ).toBe('https://x.supabase.co/storage/v1/object/public/plant-images/user/abc_thumb.jpg');
  });

  it('leaves non-storage plant URLs unchanged', () => {
    expect(
      plantThumbnailUrl(
        buildPlant({
          image_url: 'https://cdn/plant.jpg',
          species: buildSpecies({ imageUrl: 'https://cdn/species.jpg' }),
        }),
      ),
    ).toBe('https://cdn/plant.jpg');
  });

  it('falls back to species image, then null', () => {
    expect(
      plantThumbnailUrl(
        buildPlant({
          image_url: null,
          species: buildSpecies({ imageUrl: 'https://cdn/species.jpg' }),
        }),
      ),
    ).toBe('https://cdn/species.jpg');
    expect(plantThumbnailUrl(buildPlant({ image_url: null, species: null }))).toBeNull();
  });
});
