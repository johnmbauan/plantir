import { useEffect, useRef, useState } from "react";
import IconSearch from "@/components/icons/IconSearch";

interface PlantFilterSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlantFilterSearch({ value, onChange }: PlantFilterSearchProps) {
  const [open, setOpen] = useState(value.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleBlur() {
    if (!value) setOpen(false);
  }

  function clear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className={`filter-search${open ? " filter-search--open" : ""}`}>
      <button
        type="button"
        className="filter-search__icon-btn"
        onClick={() => setOpen(true)}
        aria-label="Search plants"
      >
        <IconSearch />
      </button>
      <input
        ref={inputRef}
        className="filter-search__input"
        placeholder="Search plants…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
      />
      {value && (
        <button
          type="button"
          className="filter-search__clear"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
