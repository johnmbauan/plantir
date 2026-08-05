import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { FirmwareChannel, FirmwareRelease } from '@/admin/adminService';

const mockFetchFirmwareReleases = vi.fn();
const mockFetchFirmwareChannels = vi.fn();

vi.mock('@/admin/adminService', () => ({
  fetchFirmwareReleases: (...args: unknown[]) => mockFetchFirmwareReleases(...args),
  fetchFirmwareChannels: (...args: unknown[]) => mockFetchFirmwareChannels(...args),
}));

import { useFirmwareTab } from './useFirmwareTab';

const releases: FirmwareRelease[] = [{
  id: 1,
  board: 'esp32c6',
  version: 2,
  semver: '1.2.0',
  binary_url: 'https://cdn/firmware.bin',
  label: null,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
}];

const channels: FirmwareChannel[] = [{
  board: 'esp32c6',
  release_id: 1,
  updatedAt: '2026-08-01T00:00:00Z',
  release: releases[0],
}];

describe('useFirmwareTab', () => {
  beforeEach(() => {
    mockFetchFirmwareReleases.mockReset();
    mockFetchFirmwareChannels.mockReset();
  });

  it('loads releases and channels on mount', async () => {
    mockFetchFirmwareReleases.mockResolvedValue(releases);
    mockFetchFirmwareChannels.mockResolvedValue(channels);

    const { result } = renderHook(() => useFirmwareTab());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.releases).toEqual(releases);
    expect(result.current.channels).toEqual(channels);
    expect(mockFetchFirmwareReleases).toHaveBeenCalledTimes(1);
    expect(mockFetchFirmwareChannels).toHaveBeenCalledTimes(1);
  });

  it('refresh reloads releases and channels', async () => {
    mockFetchFirmwareReleases.mockResolvedValue(releases);
    mockFetchFirmwareChannels.mockResolvedValue(channels);

    const { result } = renderHook(() => useFirmwareTab());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const nextReleases = [{ ...releases[0], version: 3, semver: '1.3.0' }];
    mockFetchFirmwareReleases.mockResolvedValue(nextReleases);
    mockFetchFirmwareChannels.mockResolvedValue([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.releases).toEqual(nextReleases);
    expect(result.current.channels).toEqual([]);
    expect(mockFetchFirmwareReleases).toHaveBeenCalledTimes(2);
    expect(mockFetchFirmwareChannels).toHaveBeenCalledTimes(2);
  });
});
