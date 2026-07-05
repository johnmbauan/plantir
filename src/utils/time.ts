export function relativeTime(isoString: string | null): string | null {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}min` : `${hrs}h`;
}

export const INTERVAL_PRESET_SECONDS = [3600, 14400, 28800, 43200, 86400] as const;

export const INTERVAL_PRESET_OPTIONS: { value: string; label: string }[] = [
  ...INTERVAL_PRESET_SECONDS.map((s) => ({ value: String(s), label: formatInterval(s) })),
  { value: "custom", label: "Custom…" },
];

export function isIntervalPreset(seconds: number): boolean {
  return (INTERVAL_PRESET_SECONDS as readonly number[]).includes(seconds);
}

export function intervalPresetSelectValue(seconds: number): string {
  return isIntervalPreset(seconds) ? String(seconds) : "custom";
}
