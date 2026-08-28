import i18n from "@/i18n";
import {
  isAchievementPayload,
  isOfflinePayload,
  isWateringPayload,
  type AppNotification,
} from "@/services/notificationService";
import { achievementCopy } from "@/utils/achievementDisplay";

function dateLocale(language: string): string {
  return language.startsWith("it") ? "it-IT" : "en-US";
}

export function formatNotificationCopy(
  notification: AppNotification,
): { title: string; body: string } {
  const t = i18n.t.bind(i18n);
  const language = i18n.language;

  if (notification.type === "watering" && isWateringPayload(notification.payload)) {
    const { plantName, humidity, rain_forecasted } = notification.payload;
    const humidityLine = t("notifications.alerts.wateringBody", { humidity });
    return {
      title: t("notifications.alerts.wateringTitle", { plantName }),
      body: rain_forecasted
        ? `${humidityLine}\n${t("notifications.rainExpected")}`
        : humidityLine,
    };
  }

  if (notification.type === "offline" && isOfflinePayload(notification.payload)) {
    const { plants, notificationTimezone } = notification.payload;
    const lines = plants.map((plant) => {
      const lastSeen = plant.lastSeenAt
        ? t("notifications.alerts.lastReading", {
            time: new Date(plant.lastSeenAt).toLocaleString(
              dateLocale(language),
              notificationTimezone ? { timeZone: notificationTimezone } : undefined,
            ),
          })
        : t("notifications.alerts.neverSeen");
      return `• ${plant.plantName} (${lastSeen})`;
    });
    const title = plants.length === 1
      ? t("notifications.alerts.offlineTitleSingle", { plantName: plants[0].plantName })
      : t("notifications.alerts.offlineTitleMulti", { count: plants.length });
    return {
      title,
      body: `${t("notifications.alerts.offlineBodyIntro")}\n\n${lines.join("\n")}`,
    };
  }

  if (notification.type === "achievement" && isAchievementPayload(notification.payload)) {
    const copy = achievementCopy(notification.payload.achievementKey, {
      name: notification.title,
      description: notification.body,
    });
    return { title: copy.name, body: copy.description };
  }

  return { title: notification.title, body: notification.body };
}

