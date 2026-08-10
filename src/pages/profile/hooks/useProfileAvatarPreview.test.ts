import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProfileAvatarPreview } from './useProfileAvatarPreview';

describe('useProfileAvatarPreview', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns saved avatar URLs when no pending file', () => {
    const { result } = renderHook(() =>
      useProfileAvatarPreview(
        null,
        'https://x.supabase.co/storage/v1/object/public/avatars/user/abc.jpg',
        false,
      ),
    );

    expect(result.current).toEqual({
      leafSrc: 'https://x.supabase.co/storage/v1/object/public/avatars/user/abc_thumb.jpg',
      expandSrc: 'https://x.supabase.co/storage/v1/object/public/avatars/user/abc.jpg',
    });
  });

  it('returns null when avatar is marked removed', () => {
    const { result } = renderHook(() =>
      useProfileAvatarPreview(null, 'https://cdn/avatar.jpg', true),
    );
    expect(result.current).toEqual({ leafSrc: null, expandSrc: null });
  });

  it('prefers file preview over saved avatar URL', () => {
    const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
    const { result } = renderHook(() =>
      useProfileAvatarPreview(file, 'https://cdn/avatar.jpg', false),
    );

    expect(result.current).toEqual({
      leafSrc: 'blob:preview',
      expandSrc: 'blob:preview',
    });
  });
});
