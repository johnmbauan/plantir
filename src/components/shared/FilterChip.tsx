import "./FilterChip.css";

export interface FilterChipProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  variant: "healthy" | "watering" | "offline" | "recharge";
  active: boolean;
  onClick: () => void;
}

export default function FilterChip({ icon, count, label, variant, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-chip filter-chip--${variant}${active ? " filter-chip--active" : ""}`}
    >
      <span className="filter-chip__icon">{icon}</span>
      <span className="filter-chip__text">
        {count} {label}
      </span>
    </button>
  );
}
