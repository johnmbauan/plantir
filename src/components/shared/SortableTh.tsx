import { Group, Table, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconSelector } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { SortDirection } from "@/utils/sort";

interface SortableThProps {
  label: string;
  columnKey: string;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  w?: number | string;
}

export function SortableTh({
  label,
  columnKey,
  activeKey,
  direction,
  onSort,
  className,
  w,
}: SortableThProps) {
  const { t } = useTranslation();
  const isActive = activeKey === columnKey;
  const Icon = isActive
    ? direction === "asc"
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;

  return (
    <Table.Th className={className} w={w}>
      <UnstyledButton
        onClick={() => onSort(columnKey)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort(columnKey);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={t("sortable.sortBy", { label })}
        style={{ width: "100%", cursor: "pointer" }}
      >
        <Group gap={4} wrap="nowrap">
          {label}
          <Icon
            size={14}
            style={{ opacity: isActive ? 1 : 0.35, flexShrink: 0 }}
          />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}
