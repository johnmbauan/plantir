import type { PlantStatus } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import FilterChip from "@/components/shared/FilterChip";
import type { FilterChipProps } from "@/components/shared/FilterChip";
import IconLeaf from "@/components/icons/IconLeaf";
import IconDrop from "@/components/icons/IconDrop";
import IconOffline from "@/components/icons/IconOffline";
import IconBattery from "@/components/icons/IconBattery";

const STATUS_CHIP: Record<PlantStatus, { variant: FilterChipProps["variant"]; icon: React.ReactNode }> = {
  HEALTHY: { variant: "healthy", icon: <IconLeaf size={12} /> },
  WATERING_NEEDED: { variant: "watering", icon: <IconDrop size={12} /> },
  OFFLINE: { variant: "offline", icon: <IconOffline size={12} /> },
  RECHARGE_NEEDED: { variant: "recharge", icon: <IconBattery size={12} /> },
};

export default function PlantStatusChips({
  statuses,
  expanded = false,
}: {
  statuses: PlantStatus[];
  /** When true, all chips show their label (used in Plants Center). */
  expanded?: boolean;
}) {
  return statuses.map((s) => (
    <FilterChip
      key={s}
      variant={STATUS_CHIP[s].variant}
      icon={STATUS_CHIP[s].icon}
      label={STATUS_CONFIG[s].label}
      iconOnly={!expanded && s === "HEALTHY"}
    />
  ));
}
