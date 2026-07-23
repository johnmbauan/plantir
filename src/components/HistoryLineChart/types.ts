import type { MeasurementPoint } from "@/types";

export interface HistoryLineChartProps {
  title: string;
  points: MeasurementPoint[];
  color: string;
  unit: string;
}

export interface PlotPoint {
  x: number;
  y: number;
  value: number;
  createdAt: string;
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
