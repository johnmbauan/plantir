import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfileAvatarPreview } from './useProfileAvatarPreview';

describe('useProfileAvatarPreview', () => {
  it('returns saved avatar URL when no pending file', () => {
    const { result } = renderHook(() =>
      useProfileAvatarPreview(null, 'https://cdn/avatar.jpg', false),
    );

    expect(result.current).toBe('https://cdn/avatar.jpg');
  });

  it('returns null when avatar is marked removed', () => {
    const { result } = renderHook(() =>
      useProfileAvatarPreview(null, 'https://cdn/avatar.jpg', true),
    );

    expect(result.current).toBeNull();
  });

  it('prefers file preview over saved avatar URL', async () => {
    const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() =>
      useProfileAvatarPreview(file, 'https://cdn/avatar.jpg', false),
    );

    await waitFor(() => {
      expect(result.current).toMatch(/^blob:/);
    });
  });
});
