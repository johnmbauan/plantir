import { Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import FilterChip from "@/components/shared/FilterChip";
import IconLeaf from "@/components/icons/IconLeaf";
import IconDrop from "@/components/icons/IconDrop";
import IconOffline from "@/components/icons/IconOffline";
import IconBattery from "@/components/icons/IconBattery";
import type { PlantStatus } from "@/types";

const STATUS_LABEL_KEY: Record<PlantStatus, string> = {
  HEALTHY: "plantStatus.healthy",
  WATERING_NEEDED: "plantStatus.needsWater",
  OFFLINE: "plantStatus.offline",
  RECHARGE_NEEDED: "plantStatus.needsRecharge",
};

type Variant = "healthy" | "watering" | "offline" | "recharge";

const STATUS_VARIANT: Record<PlantStatus, Variant> = {
  HEALTHY: "healthy",
  WATERING_NEEDED: "watering",
  OFFLINE: "offline",
  RECHARGE_NEEDED: "recharge",
};

const STATUS_ICON: Record<PlantStatus, React.ReactNode> = {
  HEALTHY: <IconLeaf size={13} />,
  WATERING_NEEDED: <IconDrop size={13} />,
  OFFLINE: <IconOffline size={13} />,
  RECHARGE_NEEDED: <IconBattery size={13} />,
};

/** HEALTHY is icon-only by default and expands on hover; attention statuses always show their label. */
const ALWAYS_EXPANDED: PlantStatus[] = ["WATERING_NEEDED", "OFFLINE", "RECHARGE_NEEDED"];

interface PlantStatusChipsProps {
  statuses: PlantStatus[];
  size?: "xs" | "sm" | "md";
  expanded?: boolean;
}

export function PlantStatusChips({ statuses, expanded = false }: PlantStatusChipsProps) {
  const { t } = useTranslation();
  return (
    <Group gap={4}>
      {statuses.map((s) => {
        const alwaysExpanded = ALWAYS_EXPANDED.includes(s);
        const isIconOnly = !alwaysExpanded && !expanded;
        return (
          <FilterChip
            key={s}
            variant={STATUS_VARIANT[s]}
            icon={STATUS_ICON[s]}
            label={t(STATUS_LABEL_KEY[s])}
            iconOnly={isIconOnly}
            expandLabel={isIconOnly}
          />
        );
      })}
    </Group>
  );
}

export default PlantStatusChips;
