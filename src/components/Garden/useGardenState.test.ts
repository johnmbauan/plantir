import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { AchievementDefinition, EarnedAchievement } from '@/services/achievementService';

const mockEvaluateAchievements = vi.fn();
const mockFetchAllDefinitions = vi.fn();
const mockFetchGardenState = vi.fn();
const mockShowUnlockToasts = vi.fn();

vi.mock('@/services/achievementService', () => ({
  evaluateAchievements: (...args: unknown[]) => mockEvaluateAchievements(...args),
  fetchAllDefinitions: (...args: unknown[]) => mockFetchAllDefinitions(...args),
  fetchGardenState: (...args: unknown[]) => mockFetchGardenState(...args),
  showUnlockToasts: (...args: unknown[]) => mockShowUnlockToasts(...args),
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
    mockEvaluateAchievements.mockReset();
    mockFetchAllDefinitions.mockReset();
    mockFetchGardenState.mockReset();
    mockShowUnlockToasts.mockReset();

    mockEvaluateAchievements.mockResolvedValue([]);
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
      // 6 earned → Greenfingers tier (visualStage: 'garden')
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
    it('calls evaluate, fetchAllDefinitions, and fetchGardenState exactly once on mount', async () => {
      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockEvaluateAchievements).toHaveBeenCalledTimes(1);
      expect(mockFetchAllDefinitions).toHaveBeenCalledTimes(1);
      expect(mockFetchGardenState).toHaveBeenCalledTimes(1);
    });
  });

  describe('toast behaviour', () => {
    it('shows toasts when achievements are newly unlocked (default toastOnEvaluate=true)', async () => {
      mockEvaluateAchievements.mockResolvedValue([sproutDef]);
      mockFetchGardenState.mockResolvedValue({ earned: [earnedSprout], earnedCount: 1 });

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockShowUnlockToasts).toHaveBeenCalledWith([sproutDef]);
    });

    it('records newly unlocked keys for animation', async () => {
      mockEvaluateAchievements.mockResolvedValue([sproutDef]);
      mockFetchGardenState.mockResolvedValue({ earned: [earnedSprout], earnedCount: 1 });

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.newlyUnlockedKeys).toEqual(['hello_my_name_is']);
    });

    it('does not show toasts when toastOnEvaluate is false', async () => {
      mockEvaluateAchievements.mockResolvedValue([sproutDef]);

      const { result } = renderHook(() => useGardenState({ toastOnEvaluate: false }));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockShowUnlockToasts).not.toHaveBeenCalled();
      expect(result.current.newlyUnlockedKeys).toEqual([]);
    });

    it('does not show toasts when evaluate returns nothing new', async () => {
      mockEvaluateAchievements.mockResolvedValue([]);

      const { result } = renderHook(() => useGardenState());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockShowUnlockToasts).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('re-runs all three fetches and updates state', async () => {
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
  });
});
