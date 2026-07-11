export function batteryMantineColor(percent: number | null): string {
  if (percent === null) return "dimmed";
  if (percent < 15) return "red";
  if (percent < 30) return "orange";
  return "green";
}

export function batteryCssColor(percent: number | null): string | undefined {
  const color = batteryMantineColor(percent);
  if (color === "red") return "var(--mantine-color-red-6)";
  if (color === "orange") return "var(--mantine-color-orange-6)";
  return undefined;
}

export function humidityMantineColor(percent: number | null): string {
  if (percent === null) return "dimmed";
  if (percent >= 50) return "green";
  if (percent >= 25) return "yellow";
  return "red";
}
