import { Group, Select, Text } from "@mantine/core";
import { RefreshButton } from "@/admin/components/RefreshButton";

interface SelectOption {
  value: string;
  label: string;
}

const LEVEL_OPTIONS: SelectOption[] = [
  { value: "", label: "All levels" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

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
  return (
    <Group justify="space-between">
      <Text size="lg" fw={600}>Device Logs</Text>
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
          data={LEVEL_OPTIONS}
          value={selectedLevel ?? ""}
          onChange={(v) => onLevelChange(v || null)}
          placeholder="All levels"
          style={{ width: 140 }}
          clearable
        />
        <RefreshButton onClick={onRefresh} label="Refresh logs" />
      </Group>
    </Group>
  );
}
