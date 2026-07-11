import { Group, Select, Text } from "@mantine/core";
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
  return (
    <Group justify="space-between">
      <Text size="lg" fw={600}>All Devices</Text>
      <Group gap="xs">
        <Select
          data={serialOptions}
          value={selectedSerial ?? ""}
          onChange={(v) => onSerialChange(v || null)}
          placeholder="All devices"
          style={{ width: 200 }}
          clearable
        />
        <Select
          data={ownerOptions}
          value={selectedOwner ?? ""}
          onChange={(v) => onOwnerChange(v || null)}
          placeholder="All owners"
          style={{ width: 220 }}
          clearable
        />
        <Select
          data={plantOptions}
          value={selectedPlant ?? ""}
          onChange={(v) => onPlantChange(v || null)}
          placeholder="All plants"
          style={{ width: 180 }}
          clearable
        />
        <RefreshButton onClick={onRefresh} label="Refresh devices" />
      </Group>
    </Group>
  );
}
