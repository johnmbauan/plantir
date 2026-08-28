import { Group, Select, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { RefreshButton } from "@/admin/components/RefreshButton";

interface SelectOption {
  value: string;
  label: string;
}

interface DevicesTabHeaderProps {
  serialOptions: SelectOption[];
  ownerOptions: SelectOption[];
  plantOptions: SelectOption[];
  selectedSerial: string | null;
  selectedOwner: string | null;
  selectedPlant: string | null;
  onSerialChange: (value: string | null) => void;
  onOwnerChange: (value: string | null) => void;
  onPlantChange: (value: string | null) => void;
  onRefresh: () => void;
}

export function DevicesTabHeader({
  serialOptions,
  ownerOptions,
  plantOptions,
  selectedSerial,
  selectedOwner,
  selectedPlant,
  onSerialChange,
  onOwnerChange,
  onPlantChange,
  onRefresh,
}: DevicesTabHeaderProps) {
  const { t } = useTranslation();

  return (
    <Group justify="space-between">
      <Text size="lg" fw={600}>{t("admin.devices.title")}</Text>
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
          data={plantOptions}
          value={selectedPlant ?? ""}
          onChange={(v) => onPlantChange(v || null)}
          placeholder={t("admin.filters.allPlants")}
          style={{ width: 180 }}
          clearable
        />
        <RefreshButton onClick={onRefresh} label={t("admin.devices.refreshLabel")} />
      </Group>
    </Group>
  );
}
