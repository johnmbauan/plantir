import { useCallback, useEffect, useMemo, useState } from "react";
import type { AchievementKey } from "@/constants/achievements";
import {
  bootstrapSanctuary,
  fetchSanctuaryState,
  type SanctuaryState,
  type UserExpedition,
} from "@/services/expeditionService";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/services/notificationService";

export function useSanctuaryState() {
  const [state, setState] = useState<SanctuaryState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      await bootstrapSanctuary();
      setState(await fetchSanctuaryState());
    } catch (err) {
      console.error("Failed to load sanctuary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = () => {
      void fetchSanctuaryState().then(setState).catch((err) => console.error(err));
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    const hasActive = state?.expeditions.some((row) => row.status === "active");
    if (!hasActive) return;
    const timer = window.setInterval(() => {
      void fetchSanctuaryState().then(setState).catch((err) => console.error(err));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [state]);

  const openExpedition = useMemo(
    () => state?.expeditions.find((row) => row.status === "active" || row.status === "ready") ?? null,
    [state],
  );

  const travelingKeys = useMemo<AchievementKey[]>(() => {
    if (!openExpedition || openExpedition.status !== "active") return [];
    return openExpedition.team;
  }, [openExpedition]);

  return { loading, state, refresh, openExpedition, travelingKeys };
}

export function expeditionsForCreature(
  expeditions: UserExpedition[],
  key: AchievementKey,
): UserExpedition[] {
  return expeditions.filter((row) => row.team.includes(key) && row.status === "welcomed");
}
