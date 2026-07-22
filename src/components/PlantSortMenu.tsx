import { Menu } from "@mantine/core";
import IconSortLines from "@/components/icons/IconSortLines";

export type DashboardSort = "humidity-low" | "humidity-high" | "name" | "last-seen";

const DEFAULT_SORT: DashboardSort = "humidity-low";

const SORT_OPTIONS: { value: DashboardSort; label: string }[] = [
  { value: "humidity-low", label: "Humidity (lowest first)" },
  { value: "humidity-high", label: "Humidity (highest first)" },
  { value: "last-seen", label: "Last seen (recent first)" },
  { value: "name", label: "Name (A-Z)" },
];

interface PlantSortMenuProps {
  value: DashboardSort;
  onChange: (value: DashboardSort) => void;
}

export default function PlantSortMenu({ value, onChange }: PlantSortMenuProps) {
  const isNonDefault = value !== DEFAULT_SORT;

  return (
    <Menu shadow="sm" width={220} position="bottom-end">
      <Menu.Target>
        <button
          type="button"
          className={`filter-icon-btn${isNonDefault ? " filter-icon-btn--active" : ""}`}
          aria-label="Sort plants"
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
