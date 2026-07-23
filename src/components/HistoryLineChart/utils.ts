import type { MeasurementPoint } from "@/types";
import type { ChartPadding, PlotPoint } from "./types";

export const CHART_WIDTH = 540;
export const CHART_HEIGHT = 150;
export const PADDING: ChartPadding = { top: 14, right: 14, bottom: 28, left: 14 };

export function formatValue(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}

export function formatAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatHoverDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

export function toPlotPoints(points: MeasurementPoint[], min: number, range: number): PlotPoint[] {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  return points.map((point, index) => ({
    x: PADDING.left + (index / Math.max(points.length - 1, 1)) * plotWidth,
    y: PADDING.top + (1 - (point.value - min) / range) * plotHeight,
    value: point.value,
    createdAt: point.createdAt,
  }));
}

export function axisLabelIndices(length: number): number[] {
  if (length <= 1) return [0];
  if (length === 2) return [0, 1];
  return [0, Math.floor((length - 1) / 2), length - 1];
}

export function nearestIndex(plotPoints: PlotPoint[], x: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < plotPoints.length; i++) {
    const dist = Math.abs(plotPoints[i].x - x);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function clientXToChartX(
  clientX: number,
  svg: SVGSVGElement | null,
  chartWidth: number = CHART_WIDTH,
): number {
  if (!svg) return 0;
  const rect = svg.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * chartWidth;
}
