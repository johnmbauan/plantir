import type { PlotPoint } from "./types";
import { CHART_HEIGHT, PADDING } from "./utils";

interface Props {
  point: PlotPoint;
  color: string;
}

export default function HistoryChartHoverMarker({ point, color }: Props) {
  return (
    <>
      <line
        data-testid="hover-guide"
        x1={point.x}
        y1={PADDING.top}
        x2={point.x}
        y2={CHART_HEIGHT - PADDING.bottom}
        stroke="var(--mantine-color-gray-5)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <circle
        data-testid="hover-marker"
        cx={point.x}
        cy={point.y}
        r="5"
        fill={color}
        stroke="var(--mantine-color-body)"
        strokeWidth="2"
      />
    </>
  );
}
