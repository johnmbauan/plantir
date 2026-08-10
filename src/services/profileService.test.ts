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

vi.mock('@/utils/imageVariants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/imageVariants')>();
  return {
    ...actual,
    prepareImageVariants: vi.fn(async () => ({
      full: new File(['full'], 'id.jpg', { type: 'image/jpeg' }),
      thumb: new File(['thumb'], 'id_thumb.jpg', { type: 'image/jpeg' }),
    })),
  };
});

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
    it('uploads full and thumb variants and returns the full public URL', async () => {
      mockAuthenticatedUser();
      const upload = vi.fn().mockResolvedValue({ error: null });
      const getPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://x.supabase.co/storage/v1/object/public/avatars/user-1/abc.jpg',
        },
      });
      mockStorageFrom.mockReturnValue({ upload, getPublicUrl });

      const file = new File(['x'], 'avatar.png', { type: 'image/png' });
      await expect(uploadAvatar(file)).resolves.toBe(
        'https://x.supabase.co/storage/v1/object/public/avatars/user-1/abc.jpg',
      );
      expect(upload).toHaveBeenCalledTimes(2);
      expect(upload.mock.calls[1][0]).toMatch(/_thumb\.jpg$/);
    });

    it('rolls back the full object when thumb upload fails', async () => {
      mockAuthenticatedUser();
      const remove = vi.fn().mockResolvedValue({ error: null });
      const upload = vi
        .fn()
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: new Error('Thumb failed') });
      mockStorageFrom.mockReturnValue({ upload, getPublicUrl: vi.fn(), remove });

      const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
      await expect(uploadAvatar(file)).rejects.toThrow('Thumb failed');
      expect(remove).toHaveBeenCalledWith([expect.stringMatching(/\.jpg$/)]);
    });

    it('skips delete for non-storage URLs', async () => {
      mockAuthenticatedUser();
      await expect(deleteAvatar('https://example.com/img.jpg')).resolves.toBeUndefined();
    });

    it('skips delete when there is no public URL', async () => {
      mockAuthenticatedUser();
      await expect(deleteAvatar(null)).resolves.toBeUndefined();
    });

    it('skips delete when the session user is missing', async () => {
      mockUnauthenticated();
      const url = 'https://x.supabase.co/storage/v1/object/public/avatars/user-1/abc.jpg';
      await expect(deleteAvatar(url)).resolves.toBeUndefined();
    });

    it('deletes full and thumb objects when URL matches bucket', async () => {
      mockAuthenticatedUser();
      const remove = vi.fn().mockResolvedValue({ error: null });
      mockStorageFrom.mockReturnValue({ remove });

      const url = 'https://x.supabase.co/storage/v1/object/public/avatars/user-1/abc.jpg';
      await expect(deleteAvatar(url)).resolves.toBeUndefined();
      expect(remove).toHaveBeenCalledWith(['user-1/abc.jpg', 'user-1/abc_thumb.jpg']);
    });
  });
});
