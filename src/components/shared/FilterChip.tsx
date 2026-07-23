import { forwardRef } from "react";
import "./FilterChip.css";

export interface FilterChipProps {
  icon: React.ReactNode;
  label: string;
  variant: "healthy" | "watering" | "offline" | "recharge" | "snooze" | "calibration" | "edit" | "danger";
  count?: number;
  active?: boolean;
  iconOnly?: boolean;
  /** When iconOnly, reveal the label on hover. Defaults to true. */
  expandLabel?: boolean;
  rightSection?: React.ReactNode;
  onClick?: () => void;
}

const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(function FilterChip(
  {
    icon,
    count,
    label,
    variant,
    active = false,
    iconOnly = false,
    expandLabel = true,
    rightSection,
    onClick,
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "filter-chip",
        `filter-chip--${variant}`,
        active ? "filter-chip--active" : "",
        !onClick ? "filter-chip--static" : "",
        iconOnly ? "filter-chip--icon-only" : "",
        iconOnly && expandLabel ? "filter-chip--expand-label" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="filter-chip__icon">{icon}</span>
      <span className="filter-chip__text">
        {count !== undefined ? `${count} ` : ""}
        {label}
      </span>
      {rightSection && <span className="filter-chip__right">{rightSection}</span>}
    </button>
  );
});

export default FilterChip;
