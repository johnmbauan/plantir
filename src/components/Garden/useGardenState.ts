import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAllDefinitions,
  fetchGardenState,
  type AchievementDefinition,
  type EarnedAchievement,
} from "@/services/achievementService";
import { getGardenTier, type GardenTier } from "@/constants/achievements";

export interface UseGardenStateResult {
  loading: boolean;
  allDefinitions: AchievementDefinition[];
  earned: EarnedAchievement[];
  earnedCount: number;
  tier: GardenTier;
  newlyUnlockedKeys: string[];
  refresh: () => Promise<void>;
}

export function useGardenState(): UseGardenStateResult {
  const [loading, setLoading] = useState(true);
  const [allDefinitions, setAllDefinitions] = useState<AchievementDefinition[]>([]);
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [defs, state] = await Promise.all([
        fetchAllDefinitions(),
        fetchGardenState(),
      ]);
      setAllDefinitions(defs);
      setEarned(state.earned);
    } catch (err) {
      console.error("Failed to load garden:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const tier = useMemo(() => getGardenTier(earned.length), [earned.length]);

  return {
    loading,
    allDefinitions,
    earned,
    earnedCount: earned.length,
    tier,
    newlyUnlockedKeys: [],
    refresh,
  };
}
