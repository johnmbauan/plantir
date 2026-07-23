import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
  mockStorageFrom,
} from '@/test/mocks/supabase';
import {
  createPlant,
  updatePlant,
  deletePlant,
  uploadPlantImage,
  deletePlantImage,
} from './management';

describe('plantService/management', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('createPlant', () => {
    it('inserts a plant for the authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });
      await expect(createPlant('New Plant', null)).resolves.toBeUndefined();
    });

    it('inserts a plant with species id when provided', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });

      await expect(createPlant('New Plant', null, 7)).resolves.toBeUndefined();
    });
  });

  describe('updatePlant', () => {
    it('updates plant for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });
      await expect(updatePlant(1, 'Renamed', 'http://img')).resolves.toBeUndefined();
    });

    it('updates plant species id when provided', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });

      await expect(updatePlant(1, 'Renamed', 'http://img', 7)).resolves.toBeUndefined();
    });
  });

  describe('deletePlant', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(deletePlant(1)).rejects.toThrow('Not authenticated');
    });

    it('deletes plant for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });
      await expect(deletePlant(1)).resolves.toBeUndefined();
    });
  });

  describe('plant images', () => {
    it('uploads image and returns public URL', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/plant.jpg' } }),
      });

      const file = new File(['x'], 'plant.jpg', { type: 'image/jpeg' });
      await expect(uploadPlantImage(file)).resolves.toBe('https://cdn/plant.jpg');
    });

    it('skips delete for non-storage URLs', async () => {
      mockAuthenticatedUser();
      await expect(deletePlantImage('https://example.com/img.jpg')).resolves.toBeUndefined();
    });

    it('deletes image from storage when URL matches bucket', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      });

      const url = 'https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg';
      await expect(deletePlantImage(url)).resolves.toBeUndefined();
    });
  });
});
