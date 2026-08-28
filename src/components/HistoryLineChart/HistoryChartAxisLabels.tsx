import { useTranslation } from "react-i18next";
import type { PlotPoint } from "./types";
import { CHART_HEIGHT, formatAxisDate } from "./utils";

interface Props {
  plotPoints: PlotPoint[];
  indices: number[];
}

export default function HistoryChartAxisLabels({ plotPoints, indices }: Props) {
  const { i18n } = useTranslation();
  const lastIndex = plotPoints.length - 1;

  return (
    <>
      {indices.map((index) => {
        const plot = plotPoints[index];
        const textAnchor =
          index === 0 ? "start" : index === lastIndex ? "end" : "middle";
        return (
          <text
            key={`${plot.createdAt}-${index}`}
            data-testid="axis-label"
            x={plot.x}
            y={CHART_HEIGHT - 8}
            textAnchor={textAnchor}
            fontSize="11"
            fill="var(--mantine-color-dimmed)"
          >
            {formatAxisDate(plot.createdAt, i18n.language)}
          </text>
        );
      })}
    </>
  );
}
