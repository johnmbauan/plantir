import { Group, Text } from "@mantine/core";
import { formatValue } from "./utils";

interface Props {
  title: string;
  latest: number;
  min: number;
  max: number;
  unit: string;
}

export default function HistoryChartHeader({ title, latest, min, max, unit }: Props) {
  return (
    <Group justify="space-between" mb="xs">
      <Text size="sm" fw={600}>{title}</Text>
      <Text size="xs" c="dimmed">
        Latest {formatValue(latest, unit)} · Min {formatValue(min, unit)} · Max {formatValue(max, unit)}
      </Text>
    </Group>
  );
}
