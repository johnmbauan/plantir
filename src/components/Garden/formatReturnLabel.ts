function sameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function formatReturnLabel(
  iso: string,
  locale: string,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(date, today)) return t("garden.returnsToday", { time });
  if (sameDay(date, tomorrow)) return t("garden.returnsTomorrow", { time });
  return t("garden.returnsAt", {
    time: date.toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  });
}
