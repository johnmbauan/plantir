import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import IconSearch from "@/components/icons/IconSearch";

interface PlantFilterSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchLabel?: string;
}

export default function PlantFilterSearch({
  value,
  onChange,
  placeholder,
  searchLabel,
}: PlantFilterSearchProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("plantFilter.searchPlantsPlaceholder");
  const resolvedSearchLabel = searchLabel ?? t("plantFilter.searchPlantsAria");

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
    <div className={`filter-search${open ? " filter-search--open" : ""}`} data-testid="filter-search">
      <button
        type="button"
        className="filter-search__icon-btn"
        onClick={() => setOpen(true)}
        aria-label={resolvedSearchLabel}
      >
        <IconSearch />
      </button>
      <input
        ref={inputRef}
        className="filter-search__input"
        placeholder={resolvedPlaceholder}
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
          aria-label={t("plantFilter.clearSearchAria")}
        >
          ×
        </button>
      )}
    </div>
  );
}
