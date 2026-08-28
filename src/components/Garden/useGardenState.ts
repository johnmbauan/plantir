import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  evaluateAchievements,
  fetchAllDefinitions,
  fetchGardenState,
  showUnlockToasts,
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

export function useGardenState(options?: { toastOnEvaluate?: boolean }): UseGardenStateResult {
  const { t } = useTranslation();
  const toastOnEvaluate = options?.toastOnEvaluate ?? true;
  const [loading, setLoading] = useState(true);
  const [allDefinitions, setAllDefinitions] = useState<AchievementDefinition[]>([]);
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);
  const [newlyUnlockedKeys, setNewlyUnlockedKeys] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [newly, defs, state] = await Promise.all([
        evaluateAchievements(),
        fetchAllDefinitions(),
        fetchGardenState(),
      ]);
      if (toastOnEvaluate && newly.length > 0) {
        showUnlockToasts(newly, t);
        setNewlyUnlockedKeys(newly.map((a) => a.key));
      }
      setAllDefinitions(defs);
      setEarned(state.earned);
    } catch (err) {
      console.error("Failed to load garden:", err);
    } finally {
      setLoading(false);
    }
  }, [toastOnEvaluate, t]);

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
    newlyUnlockedKeys,
    refresh,
  };
}
