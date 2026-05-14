import { TextInput, Group, Badge } from "@mantine/core";
import type { PlantStatus } from "@/types";

interface PlantCounts {
  wateringNeeded: number;
  offline: number;
  rechargeNeeded: number;
}

interface PlantFilterBarProps {
  counts: PlantCounts;
  activeFilter: PlantStatus | "all";
  search: string;
  onToggleFilter: (status: PlantStatus) => void;
  onSearchChange: (value: string) => void;
}

export default function PlantFilterBar({
  counts,
  activeFilter,
  search,
  onToggleFilter,
  onSearchChange,
}: PlantFilterBarProps) {
  return (
    <>
      <Group gap="sm" className="dashboard-summary">
        <Badge
          color="orange"
          variant={activeFilter === "WATERING_NEEDED" ? "filled" : "light"}
          size="lg"
          className={`dashboard-filter-badge${activeFilter === "WATERING_NEEDED" ? " dashboard-filter-badge--active" : ""}`}
          onClick={() => onToggleFilter("WATERING_NEEDED")}
        >
          💧 {counts.wateringNeeded} need watering
        </Badge>
        <Badge
          color="gray"
          variant={activeFilter === "OFFLINE" ? "filled" : "light"}
          size="lg"
          className={`dashboard-filter-badge${activeFilter === "OFFLINE" ? " dashboard-filter-badge--active" : ""}`}
          onClick={() => onToggleFilter("OFFLINE")}
        >
          ⚠️ {counts.offline} offline
        </Badge>
        <Badge
          color="red"
          variant={activeFilter === "RECHARGE_NEEDED" ? "filled" : "light"}
          size="lg"
          className={`dashboard-filter-badge${activeFilter === "RECHARGE_NEEDED" ? " dashboard-filter-badge--active" : ""}`}
          onClick={() => onToggleFilter("RECHARGE_NEEDED")}
        >
          🔋 {counts.rechargeNeeded} need recharge
        </Badge>
      </Group>

      <TextInput
        placeholder="Search plants…"
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        style={{ maxWidth: 320 }}
        styles={{ input: { borderColor: "var(--green-100)" } }}
      />
    </>
  );
}
