import type { PlantStatus } from "@/types";

export const STATUS_CONFIG: Record<PlantStatus, { label: string; color: string; barColor: string }> = {
  HEALTHY: { label: "Healthy", color: "green", barColor: "var(--green-400)" },
  WATERING_NEEDED: { label: "Needs water", color: "orange", barColor: "var(--terracotta-500)" },
  OFFLINE: { label: "Offline", color: "gray", barColor: "#9ca3af" },
};
