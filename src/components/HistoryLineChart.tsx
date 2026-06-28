import { Box, Group, Text } from "@mantine/core";
import type { MeasurementPoint } from "@/types";

interface Props {
  title: string;
  points: MeasurementPoint[];
  color: string;
  unit: string;
}

const CHART_WIDTH = 540;
const CHART_HEIGHT = 130;
const CHART_PADDING = 12;

function formatValue(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}

export default function HistoryLineChart({ title, points, color, unit }: Props) {
  if (points.length === 0) {
    return (
      <Box p="sm" style={{ border: "1px dashed var(--mantine-color-gray-4)", borderRadius: 8 }}>
        <Text size="sm" c="dimmed">{title}: no measurements in this time range.</Text>
      </Box>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = points[points.length - 1];
  const range = max - min || 1;

  const polyline = points.map((point, index) => {
    const x = CHART_PADDING + (index / Math.max(points.length - 1, 1)) * (CHART_WIDTH - CHART_PADDING * 2);
    const y = CHART_PADDING + (1 - (point.value - min) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <Box p="sm" style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 8 }}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600}>{title}</Text>
        <Text size="xs" c="dimmed">
          Latest {formatValue(latest.value, unit)} · Min {formatValue(min, unit)} · Max {formatValue(max, unit)}
        </Text>
      </Group>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" height={CHART_HEIGHT}>
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
      </svg>
    </Box>
  );
}
