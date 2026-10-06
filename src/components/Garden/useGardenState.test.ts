import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { AchievementDefinition, EarnedAchievement } from '@/services/achievementService';

const mockFetchAllDefinitions = vi.fn();
const mockFetchGardenState = vi.fn();

vi.mock('@/services/achievementService', () => ({
  fetchAllDefinitions: (...args: unknown[]) => mockFetchAllDefinitions(...args),
  fetchGardenState: (...args: unknown[]) => mockFetchGardenState(...args),
}));

import { useGardenState } from './useGardenState';

const sproutDef: AchievementDefinition = {
  key: 'hello_my_name_is',
  name: 'Sprout Wars',
  description: 'Create your first plant.',
  garden_element: 'sprout',
  sort_order: 1,
  is_hidden: false,
};

const sensorDef: AchievementDefinition = {
  key: 'stalking_fern_legally',
  name: 'Stalking Fern',
  description: 'Connect your first sensor.',
  garden_element: 'sensor_mushroom',
  sort_order: 2,
  is_hidden: false,
};

const earnedSprout: EarnedAchievement = {
  ...sproutDef,
  unlocked_at: '2026-01-01T00:00:00Z',
};

describe('useGardenState', () => {
  beforeEach(() => {
    mockFetchAllDefinitions.mockReset();
    mockFetchGardenState.mockReset();

    mockFetchAllDefinitions.mockResolvedValue([sproutDef]);
    mockFetchGardenState.mockResolvedValue({ earned: [], earnedCount: 0 });
  });

  describe('initial loading', () => {
    it('starts in loading state', () => {
      const { result } = renderHook(() => useGardenState());
      expect(result.current.loading).toBe(true);
    });

    it('resolves to loading=false once all fetches complete', async () => {
      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });

  describe('data population', () => {
    it('exposes all definitions from the catalog', async () => {
      mockFetchAllDefinitions.mockResolvedValue([sproutDef, sensorDef]);

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.allDefinitions).toEqual([sproutDef, sensorDef]);
    });

    it('exposes earned achievements from the garden state', async () => {
      mockFetchGardenState.mockResolvedValue({ earned: [earnedSprout], earnedCount: 1 });

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.earned).toEqual([earnedSprout]);
      expect(result.current.earnedCount).toBe(1);
    });

    it('derives the correct tier from earnedCount', async () => {
      const sixEarned = Array.from({ length: 6 }, (_, i) => ({
        ...earnedSprout,
        key: `key_${i}` as typeof earnedSprout.key,
      }));
      mockFetchGardenState.mockResolvedValue({ earned: sixEarned, earnedCount: 6 });

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.tier.visualStage).toBe('garden');
      expect(result.current.earnedCount).toBe(6);
    });
  });

  describe('parallel fetching', () => {
    it('calls fetchAllDefinitions and fetchGardenState exactly once on mount', async () => {
      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockFetchAllDefinitions).toHaveBeenCalledTimes(1);
      expect(mockFetchGardenState).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('re-runs the catalog and garden fetches and updates state', async () => {
      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockFetchAllDefinitions.mockResolvedValue([sproutDef, sensorDef]);
      mockFetchGardenState.mockResolvedValue({ earned: [earnedSprout], earnedCount: 1 });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.allDefinitions).toHaveLength(2);
      expect(result.current.earned).toEqual([earnedSprout]);
    });

    it("keeps newlyUnlockedKeys empty because garden load does not evaluate", async () => {
      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.newlyUnlockedKeys).toEqual([]);
    });
  });

  describe("errors", () => {
    it("logs and stops loading when a fetch fails", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetchGardenState.mockRejectedValue(new Error("offline"));

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
