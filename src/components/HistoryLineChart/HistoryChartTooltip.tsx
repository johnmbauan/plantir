import { Box, Text } from "@mantine/core";
import type { PlotPoint } from "./types";
import { CHART_HEIGHT, CHART_WIDTH, formatHoverDate, formatValue } from "./utils";

interface Props {
  point: PlotPoint;
  unit: string;
}

export default function HistoryChartTooltip({ point, unit }: Props) {
  const leftPercent = (point.x / CHART_WIDTH) * 100;
  const topPercent = (point.y / CHART_HEIGHT) * 100;
  const nearRight = point.x > CHART_WIDTH * 0.7;
  const nearLeft = point.x < CHART_WIDTH * 0.3;

  return (
    <Box
      style={{
        position: "absolute",
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        transform: nearRight
          ? "translate(calc(-100% - 10px), -50%)"
          : nearLeft
            ? "translate(10px, -50%)"
            : "translate(-50%, calc(-100% - 10px))",
        pointerEvents: "none",
        background: "var(--mantine-color-body)",
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: 6,
        padding: "4px 8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        whiteSpace: "nowrap",
        zIndex: 1,
      }}
    >
      <Text size="xs" fw={600}>{formatValue(point.value, unit)}</Text>
      <Text size="xs" c="dimmed">{formatHoverDate(point.createdAt)}</Text>
    </Box>
  );
}
