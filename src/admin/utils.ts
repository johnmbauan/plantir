export function humidityColor(pct: number | null): string {
  if (pct === null) return "dimmed";
  if (pct >= 50) return "green";
  if (pct >= 25) return "yellow";
  return "red";
}

export function batteryColor(pct: number | null): string {
  if (pct === null) return "dimmed";
  if (pct >= 50) return "green";
  if (pct >= 20) return "yellow";
  return "red";
}

export const LOG_LEVEL_COLOR: Record<string, string> = {
  error: "red",
  warning: "yellow",
  info: "blue",
};
