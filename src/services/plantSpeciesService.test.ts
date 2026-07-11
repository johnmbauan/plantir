import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach } from 'vitest';
import { mockInvoke, resetSupabaseMocks } from '@/test/mocks/supabase';
import { fetchPlantSpeciesDetail, searchPlantSpecies } from './plantSpeciesService';

describe('plantSpeciesService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('searchPlantSpecies', () => {
    it('returns empty array for short query and skips invoke', async () => {
      await expect(searchPlantSpecies('a')).resolves.toEqual([]);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('calls edge function with trimmed query', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          results: [{ source: 'openplantbook', sourceSpeciesId: 'ficus_lyrata', scientificName: 'Ficus lyrata', displayName: 'Fiddle leaf fig', imageUrl: null }],
        },
        error: null,
      });

      const results = await searchPlantSpecies('  ficus  ', 5);

      expect(mockInvoke).toHaveBeenCalledWith('plant-species-search', {
        body: { q: 'ficus', limit: 5 },
      });
      expect(results).toHaveLength(1);
    });

    it('throws payload error from edge function response', async () => {
      mockInvoke.mockResolvedValue({ data: { error: 'rate limited' }, error: null });

      await expect(searchPlantSpecies('ficus')).rejects.toThrow('rate limited');
    });
  });

  describe('fetchPlantSpeciesDetail', () => {
    it('throws when sourceSpeciesId is blank', async () => {
      await expect(fetchPlantSpeciesDetail('   ')).rejects.toThrow('sourceSpeciesId is required');
    });

    it('returns normalized species detail from edge function', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          species: {
            id: 1,
            source: 'openplantbook',
            sourceSpeciesId: 'ficus_lyrata',
            scientificName: 'Ficus lyrata',
            displayName: 'Fiddle leaf fig',
            imageUrl: null,
            minSoilMoisture: 30,
            maxSoilMoisture: 55,
            commonNames: ['Fiddle leaf fig'],
            minEnvHumidity: null,
            maxEnvHumidity: null,
            minTemperatureCelsius: null,
            maxTemperatureCelsius: null,
            sunlight: null,
            soil: null,
            watering: null,
            fertilization: null,
            pruning: null,
            sourceUpdatedAt: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        },
        error: null,
      });

      const species = await fetchPlantSpeciesDetail(' ficus_lyrata ');

      expect(mockInvoke).toHaveBeenCalledWith('plant-species-detail', {
        body: { sourceSpeciesId: 'ficus_lyrata' },
      });
      expect(species.sourceSpeciesId).toBe('ficus_lyrata');
      expect(species.minSoilMoisture).toBe(30);
    });

    it('throws when detail payload is invalid', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null });

      await expect(fetchPlantSpeciesDetail('ficus_lyrata')).rejects.toThrow('Invalid species detail response');
    });
  });
});
