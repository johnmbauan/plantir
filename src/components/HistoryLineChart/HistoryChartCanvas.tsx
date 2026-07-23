import { Box } from "@mantine/core";
import type { PointerEvent as ReactPointerEvent, Ref } from "react";
import type { PlotPoint } from "./types";
import { axisLabelIndices, CHART_HEIGHT, CHART_WIDTH, PADDING } from "./utils";
import HistoryChartAxisLabels from "./HistoryChartAxisLabels";
import HistoryChartHoverMarker from "./HistoryChartHoverMarker";
import HistoryChartTooltip from "./HistoryChartTooltip";

interface Props {
  plotPoints: PlotPoint[];
  color: string;
  unit: string;
  hover: PlotPoint | null;
  svgRef: Ref<SVGSVGElement>;
  onPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerLeave: () => void;
}

export default function HistoryChartCanvas({
  plotPoints,
  color,
  unit,
  hover,
  svgRef,
  onPointerMove,
  onPointerLeave,
}: Props) {
  const polyline = plotPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Box style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        data-testid="chart-svg"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ display: "block", touchAction: "none", cursor: "crosshair" }}
      >
        <line
          data-testid="baseline"
          x1={PADDING.left}
          y1={CHART_HEIGHT - PADDING.bottom}
          x2={CHART_WIDTH - PADDING.right}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="var(--mantine-color-gray-3)"
          strokeWidth="1"
        />

        <polyline
          data-testid="chart-line"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />

        <HistoryChartAxisLabels
          plotPoints={plotPoints}
          indices={axisLabelIndices(plotPoints.length)}
        />

        {hover && <HistoryChartHoverMarker point={hover} color={color} />}
      </svg>

      {hover && <HistoryChartTooltip point={hover} unit={unit} />}
    </Box>
  );
}
