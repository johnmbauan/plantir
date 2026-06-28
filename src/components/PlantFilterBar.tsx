import { TextInput, Group, Badge, Select, ActionIcon, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { PlantStatus } from "@/types";

interface PlantCounts {
  healthy: number;
  wateringNeeded: number;
  offline: number;
  rechargeNeeded: number;
}

interface PlantFilterBarProps {
  counts: PlantCounts;
  activeFilter: PlantStatus | "all";
  search: string;
  sortBy: "humidity-low" | "humidity-high" | "name" | "last-seen";
  refreshing?: boolean;
  onToggleFilter: (status: PlantStatus) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: "humidity-low" | "humidity-high" | "name" | "last-seen") => void;
  onRefresh: () => void;
}

export default function PlantFilterBar({
  counts,
  activeFilter,
  search,
  sortBy,
  refreshing,
  onToggleFilter,
  onSearchChange,
  onSortChange,
  onRefresh,
}: PlantFilterBarProps) {
  return (
    <>
      <Group gap="sm" className="dashboard-summary">
        <Badge
          color="green"
          variant={activeFilter === "HEALTHY" ? "filled" : "light"}
          size="lg"
          className={`dashboard-filter-badge${activeFilter === "HEALTHY" ? " dashboard-filter-badge--active" : ""}`}
          onClick={() => onToggleFilter("HEALTHY")}
        >
          ✅ {counts.healthy} healthy
        </Badge>
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

      <Group gap="sm" align="end" wrap="wrap">
        <TextInput
          placeholder="Search plants…"
          value={search}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          style={{ maxWidth: 320, flex: 1, minWidth: 240 }}
          styles={{ input: { borderColor: "var(--green-100)" } }}
        />
        <Select
          aria-label="Sort plants"
          placeholder="Sort by"
          value={sortBy}
          onChange={(value) => {
            if (!value) return;
            onSortChange(value as "humidity-low" | "humidity-high" | "name" | "last-seen");
          }}
          allowDeselect={false}
          data={[
            { value: "humidity-low", label: "Humidity (lowest first)" },
            { value: "humidity-high", label: "Humidity (highest first)" },
            { value: "last-seen", label: "Last seen (recent first)" },
            { value: "name", label: "Name (A-Z)" },
          ]}
          styles={{
            root: { minWidth: 240 },
            input: {
              borderColor: "var(--green-100)",
              backgroundColor: "white",
              color: "var(--green-700)",
            },
            dropdown: {
              borderColor: "var(--green-100)",
            },
          }}
        />
        <Tooltip label="Refresh">
          <ActionIcon
            variant="default"
            size={42}
            aria-label="Refresh dashboard"
            onClick={onRefresh}
            loading={refreshing}
            styles={{ root: { borderColor: "var(--green-100)" } }}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </>
  );
}
