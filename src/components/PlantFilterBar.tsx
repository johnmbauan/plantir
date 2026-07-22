import type { PlantStatus } from "@/types";
import FilterChip from "@/components/shared/FilterChip";
import IconLeaf from "@/components/icons/IconLeaf";
import IconDrop from "@/components/icons/IconDrop";
import IconOffline from "@/components/icons/IconOffline";
import IconBattery from "@/components/icons/IconBattery";
import IconRefresh from "@/components/icons/IconRefresh";
import PlantFilterSearch from "@/components/PlantFilterSearch";
import PlantSortMenu, { type DashboardSort } from "@/components/PlantSortMenu";

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
  sortBy: DashboardSort;
  refreshing?: boolean;
  onToggleFilter: (status: PlantStatus) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: DashboardSort) => void;
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
      <div className="dashboard-summary">
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
      </div>

      <div className="filter-toolbar">
        <PlantFilterSearch value={search} onChange={onSearchChange} />
        <PlantSortMenu value={sortBy} onChange={onSortChange} />
        <button
          type="button"
          className={`filter-icon-btn${refreshing ? " filter-icon-btn--spinning" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard"
        >
          <IconRefresh />
        </button>
      </div>
    </>
  );
}
