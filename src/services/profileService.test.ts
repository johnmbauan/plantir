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
  fetchProfile,
  upsertProfile,
  uploadAvatar,
  deleteAvatar,
} from './profileService';

describe('profileService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('fetchProfile', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchProfile()).rejects.toThrow('Not authenticated');
    });

    it('returns profile data', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        profiles: {
          data: { nickname: 'GreenThumb', avatar_url: 'https://cdn/avatar.jpg' },
          error: null,
        },
      });

      await expect(fetchProfile()).resolves.toEqual({
        nickname: 'GreenThumb',
        avatar_url: 'https://cdn/avatar.jpg',
      });
    });
  });

  describe('upsertProfile', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(upsertProfile('Nick', null)).rejects.toThrow('Not authenticated');
    });

    it('upserts profile for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ profiles: { data: null, error: null } });

      await expect(upsertProfile('Nick', 'https://cdn/avatar.jpg')).resolves.toBeUndefined();
    });
  });

  describe('avatar storage', () => {
    it('uploads avatar and returns public URL', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/avatar.jpg' } }),
      });

      const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
      await expect(uploadAvatar(file)).resolves.toBe('https://cdn/avatar.jpg');
    });

    it('skips delete for non-storage URLs', async () => {
      mockAuthenticatedUser();
      await expect(deleteAvatar('https://example.com/img.jpg')).resolves.toBeUndefined();
    });

    it('deletes avatar from storage when URL matches bucket', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      });

      const url = 'https://x.supabase.co/storage/v1/object/public/avatars/user-1/abc.jpg';
      await expect(deleteAvatar(url)).resolves.toBeUndefined();
    });
  });
});
