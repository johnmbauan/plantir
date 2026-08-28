export type Locale = "it" | "en";

export function resolveLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "it";
}

const BCP47: Record<Locale, string> = { it: "it-IT", en: "en-US" };

const STRINGS = {
  en: {
    wateringTelegram:
      "⚠️ Warning! Plant {{plantName}} needs water! Humidity reading: {{humidity}}%",
    wateringTitle: "{{plantName}} needs water",
    wateringBody: "Humidity reading: {{humidity}}%",
    rainTodayTomorrow: "Rain is expected today and tomorrow — watering may not be needed.",
    rainToday: "Rain is expected today — watering may not be needed.",
    rainTomorrow: "Rain is expected tomorrow — watering may not be needed.",
    offlineTelegramIntro:
      "🔴 Warning! The devices for the following plants haven't sent data in too long (possible low battery or malfunction):",
    neverSeen: "never seen",
    lastReading: "last reading {{time}}",
    plantLine: "• {{plantName}} ({{lastSeen}})",
    offlineTitleSingle: "{{plantName}} is offline",
    offlineTitleMulti: "{{count}} devices offline",
    offlineBodyIntro: "The following plants haven't sent data in too long:",
  },
  it: {
    wateringTelegram:
      "⚠️ Attenzione! La pianta {{plantName}} ha bisogno di acqua! Umidità: {{humidity}}%",
    wateringTitle: "{{plantName}} ha bisogno di acqua",
    wateringBody: "Umidità: {{humidity}}%",
    rainTodayTomorrow:
      "È prevista pioggia oggi e domani — l'annaffiatura potrebbe non essere necessaria.",
    rainToday: "È prevista pioggia oggi — l'annaffiatura potrebbe non essere necessaria.",
    rainTomorrow: "È prevista pioggia domani — l'annaffiatura potrebbe non essere necessaria.",
    offlineTelegramIntro:
      "🔴 Attenzione! I sensori delle seguenti piante non inviano dati da troppo tempo (possibile batteria scarica o malfunzionamento):",
    neverSeen: "mai rilevato",
    lastReading: "ultima lettura {{time}}",
    plantLine: "• {{plantName}} ({{lastSeen}})",
    offlineTitleSingle: "{{plantName}} è offline",
    offlineTitleMulti: "{{count}} sensori offline",
    offlineBodyIntro: "Le seguenti piante non inviano dati da troppo tempo:",
  },
} as const;

type AlertKey = keyof typeof STRINGS.en;

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function alertText(
  locale: Locale,
  key: AlertKey,
  vars: Record<string, string | number> = {},
): string {
  return fill(STRINGS[locale][key], vars);
}

export function formatLastSeen(
  locale: Locale,
  lastSeenAt: string | null,
  timeZone: string,
): string {
  if (!lastSeenAt) return alertText(locale, "neverSeen");
  const time = new Date(lastSeenAt).toLocaleString(BCP47[locale], { timeZone });
  return alertText(locale, "lastReading", { time });
}

export function wateringTelegramCaption(
  locale: Locale,
  plantName: string,
  humidity: number,
  rainNote: string,
): string {
  const caption = alertText(locale, "wateringTelegram", { plantName, humidity });
  return rainNote ? `${caption}\n\n🌧️ ${rainNote}` : caption;
}

export function wateringInAppCopy(
  locale: Locale,
  plantName: string,
  humidity: number,
  rainNote: string,
): { title: string; body: string } {
  const title = alertText(locale, "wateringTitle", { plantName });
  const humidityLine = alertText(locale, "wateringBody", { humidity });
  return {
    title,
    body: rainNote ? `${humidityLine}\n${rainNote}` : humidityLine,
  };
}

export function offlinePlantLine(
  locale: Locale,
  plantName: string,
  lastSeenAt: string | null,
  timeZone: string,
): string {
  return alertText(locale, "plantLine", {
    plantName,
    lastSeen: formatLastSeen(locale, lastSeenAt, timeZone),
  });
}

export function offlineTelegramText(locale: Locale, lines: string[]): string {
  return `${alertText(locale, "offlineTelegramIntro")}\n\n${lines.join("\n")}`;
}

export function offlineInAppCopy(
  locale: Locale,
  plantNames: string[],
  lines: string[],
): { title: string; body: string } {
  const title = plantNames.length === 1
    ? alertText(locale, "offlineTitleSingle", { plantName: plantNames[0] })
    : alertText(locale, "offlineTitleMulti", { count: plantNames.length });
  return {
    title,
    body: `${alertText(locale, "offlineBodyIntro")}\n\n${lines.join("\n")}`,
  };
}
