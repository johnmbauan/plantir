import { Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";
import IconSortLines from "@/components/icons/IconSortLines";

export type DashboardSort = "humidity-low" | "humidity-high" | "name" | "last-seen";

const DEFAULT_SORT: DashboardSort = "humidity-low";

interface PlantSortMenuProps {
  value: DashboardSort;
  onChange: (value: DashboardSort) => void;
}

export default function PlantSortMenu({ value, onChange }: PlantSortMenuProps) {
  const { t } = useTranslation();
  const isNonDefault = value !== DEFAULT_SORT;

  const SORT_OPTIONS: { value: DashboardSort; label: string }[] = [
    { value: "humidity-low", label: t("plantFilter.sortHumidityLow") },
    { value: "humidity-high", label: t("plantFilter.sortHumidityHigh") },
    { value: "last-seen", label: t("plantFilter.sortLastSeen") },
    { value: "name", label: t("plantFilter.sortName") },
  ];

  return (
    <Menu shadow="sm" width={220} position="bottom-end">
      <Menu.Target>
        <button
          type="button"
          className={`filter-icon-btn${isNonDefault ? " filter-icon-btn--active" : ""}`}
          aria-label={t("plantFilter.sortAria")}
        >
          <IconSortLines />
          {isNonDefault && <span className="filter-icon-btn__dot" />}
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        {SORT_OPTIONS.map((option) => (
          <Menu.Item
            key={option.value}
            onClick={() => onChange(option.value)}
            style={value === option.value ? { color: "var(--green-700)", fontWeight: 600 } : undefined}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
