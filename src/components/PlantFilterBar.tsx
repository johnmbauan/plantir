import { TextInput, Group, Select, ActionIcon, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { PlantStatus } from "@/types";
import FilterChip from "@/components/shared/FilterChip";

// ── SVG icons ────────────────────────────────────────────────────────────────

function IconLeaf({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Curved asymmetric leaf */}
      <path d="M3.5 12.5 C3.5 12.5 3 7 8 4.5 C13 2 13 2 13 2 C13 2 12.5 6.5 9 9 C7 10.5 4.5 11.5 3.5 12.5Z" />
      {/* Center vein */}
      <path d="M3.5 12.5 C5 10.5 7 8.5 10 6" />
    </svg>
  );
}

function IconDrop({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Teardrop — pointed top, full round bottom */}
      <path d="M8 2 C8 2 4 7.5 4 10.5 C4 12.4 5.8 14 8 14 C10.2 14 12 12.4 12 10.5 C12 7.5 8 2 8 2Z" />
    </svg>
  );
}

function IconOffline({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* WiFi dot */}
      <circle cx="8" cy="13" r="1.1" fill="currentColor" stroke="none" />
      {/* Inner arc */}
      <path d="M5.5 10.5 C6.3 9.7 7.1 9.4 8 9.4 C8.9 9.4 9.7 9.7 10.5 10.5" />
      {/* Outer arc */}
      <path d="M3.5 8 C5 6.6 6.4 6 8 6 C9.6 6 11 6.6 12.5 8" />
      {/* Diagonal strike */}
      <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" strokeWidth="1.6" />
    </svg>
  );
}

function IconBattery({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Battery body */}
      <rect x="1" y="5.5" width="11.5" height="5" rx="1.5" />
      {/* Terminal */}
      <path d="M12.5 7.5 L15 7.5 L15 8.5 L12.5 8.5" />
      {/* Low-charge fill (leftmost ~20%) */}
      <rect x="2.5" y="7" width="2.5" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Types & props ─────────────────────────────────────────────────────────────

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
        <FilterChip
          icon={<IconLeaf />}
          count={counts.healthy}
          label="healthy"
          variant="healthy"
          active={activeFilter === "HEALTHY"}
          onClick={() => onToggleFilter("HEALTHY")}
        />
        <FilterChip
          icon={<IconDrop />}
          count={counts.wateringNeeded}
          label="need watering"
          variant="watering"
          active={activeFilter === "WATERING_NEEDED"}
          onClick={() => onToggleFilter("WATERING_NEEDED")}
        />
        <FilterChip
          icon={<IconOffline />}
          count={counts.offline}
          label="offline"
          variant="offline"
          active={activeFilter === "OFFLINE"}
          onClick={() => onToggleFilter("OFFLINE")}
        />
        <FilterChip
          icon={<IconBattery />}
          count={counts.rechargeNeeded}
          label="need recharge"
          variant="recharge"
          active={activeFilter === "RECHARGE_NEEDED"}
          onClick={() => onToggleFilter("RECHARGE_NEEDED")}
        />
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
