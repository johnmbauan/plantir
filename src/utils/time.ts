type TFunc = (key: string, opts?: Record<string, unknown>) => string;

export function relativeTime(isoString: string | null, t: TFunc): string | null {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hoursAgo", { count: hrs });
  return t("time.daysAgo", { count: Math.floor(hrs / 24) });
}

export function formatInterval(seconds: number, t: TFunc): string {
  if (seconds < 60) return t("time.seconds", { count: seconds });
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return secs > 0
      ? t("time.minutesAndSeconds", { minutes: mins, seconds: secs })
      : t("time.minutes", { count: mins });
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0
    ? t("time.hoursAndMinutes", { hours: hrs, minutes: remMins })
    : t("time.hours", { count: hrs });
}

export const INTERVAL_PRESET_SECONDS = [3600, 14400, 28800, 43200, 86400] as const;

export function getIntervalPresetOptions(t: TFunc): { value: string; label: string }[] {
  return [
    ...INTERVAL_PRESET_SECONDS.map((s) => ({ value: String(s), label: formatInterval(s, t) })),
    { value: "custom", label: t("time.customInterval") },
  ];
}

export function isIntervalPreset(seconds: number): boolean {
  return (INTERVAL_PRESET_SECONDS as readonly number[]).includes(seconds);
}

export function intervalPresetSelectValue(seconds: number): string {
  return isIntervalPreset(seconds) ? String(seconds) : "custom";
}
