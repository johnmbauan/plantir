import "./FilterChip.css";

export interface FilterChipProps {
  icon: React.ReactNode;
  label: string;
  variant: "healthy" | "watering" | "offline" | "recharge" | "snooze";
  count?: number;
  active?: boolean;
  iconOnly?: boolean;
  rightSection?: React.ReactNode;
  onClick?: () => void;
}

export default function FilterChip({ icon, count, label, variant, active = false, iconOnly = false, rightSection, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`filter-chip filter-chip--${variant}${active ? " filter-chip--active" : ""}${!onClick ? " filter-chip--static" : ""}${iconOnly ? " filter-chip--icon-only" : ""}`}
    >
      <span className="filter-chip__icon">{icon}</span>
      <span className="filter-chip__text">
        {count !== undefined ? `${count} ` : ""}{label}
      </span>
      {rightSection && <span className="filter-chip__right">{rightSection}</span>}
    </button>
  );
}
