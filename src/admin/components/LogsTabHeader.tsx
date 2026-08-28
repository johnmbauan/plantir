import { Group, Select, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { RefreshButton } from "@/admin/components/RefreshButton";

interface SelectOption {
  value: string;
  label: string;
}

interface LogsTabHeaderProps {
  serialOptions: SelectOption[];
  ownerOptions: SelectOption[];
  selectedSerial: string | null;
  selectedOwner: string | null;
  selectedLevel: string | null;
  onSerialChange: (value: string | null) => void;
  onOwnerChange: (value: string | null) => void;
  onLevelChange: (value: string | null) => void;
  onRefresh: () => void;
}

export function LogsTabHeader({
  serialOptions,
  ownerOptions,
  selectedSerial,
  selectedOwner,
  selectedLevel,
  onSerialChange,
  onOwnerChange,
  onLevelChange,
  onRefresh,
}: LogsTabHeaderProps) {
  const { t } = useTranslation();
  const levelOptions: SelectOption[] = [
    { value: "", label: t("admin.filters.allLevels") },
    { value: "error", label: t("admin.logs.levelError") },
    { value: "warning", label: t("admin.logs.levelWarning") },
    { value: "info", label: t("admin.logs.levelInfo") },
  ];

  return (
    <Group justify="space-between">
      <Text size="lg" fw={600}>{t("admin.logs.title")}</Text>
      <Group gap="xs">
        <Select
          data={serialOptions}
          value={selectedSerial ?? ""}
          onChange={(v) => onSerialChange(v || null)}
          placeholder={t("admin.filters.allDevices")}
          style={{ width: 200 }}
          clearable
        />
        <Select
          data={ownerOptions}
          value={selectedOwner ?? ""}
          onChange={(v) => onOwnerChange(v || null)}
          placeholder={t("admin.filters.allOwners")}
          style={{ width: 220 }}
          clearable
        />
        <Select
          data={levelOptions}
          value={selectedLevel ?? ""}
          onChange={(v) => onLevelChange(v || null)}
          placeholder={t("admin.filters.allLevels")}
          style={{ width: 140 }}
          clearable
        />
        <RefreshButton onClick={onRefresh} label={t("admin.logs.refreshLabel")} />
      </Group>
    </Group>
  );
}
