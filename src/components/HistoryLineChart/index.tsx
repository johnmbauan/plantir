import { Box } from "@mantine/core";
import type { HistoryLineChartProps } from "./types";
import { toPlotPoints } from "./utils";
import { useHistoryChartHover } from "./useHistoryChartHover";
import HistoryChartEmpty from "./HistoryChartEmpty";
import HistoryChartHeader from "./HistoryChartHeader";
import HistoryChartCanvas from "./HistoryChartCanvas";

export default function HistoryLineChart({ title, points, color, unit }: HistoryLineChartProps) {
  if (points.length === 0) {
    return <HistoryChartEmpty title={title} />;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = points[points.length - 1];
  const range = max - min || 1;
  const plotPoints = toPlotPoints(points, min, range);

  return (
    <HistoryLineChartBody
      title={title}
      color={color}
      unit={unit}
      min={min}
      max={max}
      latest={latest.value}
      plotPoints={plotPoints}
    />
  );
}

interface BodyProps {
  title: string;
  color: string;
  unit: string;
  min: number;
  max: number;
  latest: number;
  plotPoints: ReturnType<typeof toPlotPoints>;
}

function HistoryLineChartBody({
  title,
  color,
  unit,
  min,
  max,
  latest,
  plotPoints,
}: BodyProps) {
  const { svgRef, hover, handlePointerMove, handlePointerLeave } = useHistoryChartHover(plotPoints);

  return (
    <Box p="sm" style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 8 }}>
      <HistoryChartHeader title={title} latest={latest} min={min} max={max} unit={unit} />
      <HistoryChartCanvas
        plotPoints={plotPoints}
        color={color}
        unit={unit}
        hover={hover}
        svgRef={svgRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </Box>
  );
}
