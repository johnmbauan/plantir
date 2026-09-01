const CHANNEL_FILTER = `
  AND (
    ns.telegram_chat_id <> ''
    OR ns.browser_notifications_enabled = true
    OR ns.email_notifications_enabled = true
  )
  AND EXTRACT(HOUR FROM NOW() AT TIME ZONE ns.notification_timezone)::smallint = ns.notification_hour
`;

export const WATERING_QUERY = `
  SELECT
    ns.user_id AS "userId",
    ns.telegram_chat_id AS "chatId",
    ns.browser_notifications_enabled AS "browserEnabled",
    ns.email_notifications_enabled AS "emailEnabled",
    u.email AS "email",
    p.id AS "plantId",
    p.name AS "plantName",
    p."imageUrl" AS "imageUrl",
    p.is_outdoor AS "isOutdoor",
    p.pot_depth_class AS "potDepthClass",
    hsc."minHumidityThreshold" AS "minHumidityThreshold",
    ns.weather_lat AS "weatherLat",
    ns.weather_lng AS "weatherLng",
    ns.locale AS "locale",
    ns.notification_timezone AS "notificationTimezone",
    hm."humidityPercentage" AS "humidity"
  FROM (
    SELECT DISTINCT ON (hm."deviceId")
      hm."deviceId",
      hm."humidityPercentage"
    FROM humidity_measurements hm
    WHERE hm."createdAt" >= NOW() - INTERVAL '24 hours'
    ORDER BY hm."deviceId", hm."createdAt" DESC
  ) hm
  JOIN devices d ON d.id = hm."deviceId"
  JOIN plants p ON p.id = d."plantId"
  JOIN humidity_sensors_config hsc ON hsc."deviceId" = d.id
  JOIN notification_settings ns ON ns.user_id = d.user_id
  JOIN auth.users u ON u.id = ns.user_id
  WHERE hm."humidityPercentage" <= hsc."minHumidityThreshold"
  ${CHANNEL_FILTER}
`;

export const OFFLINE_QUERY = `
  SELECT
    ns.user_id AS "userId",
    ns.telegram_chat_id AS "chatId",
    ns.browser_notifications_enabled AS "browserEnabled",
    ns.email_notifications_enabled AS "emailEnabled",
    u.email AS "email",
    p.id AS "plantId",
    p.name AS "plantName",
    MAX(hm."createdAt") AS "lastSeenAt",
    ns.notification_timezone AS "notificationTimezone",
    ns.locale AS "locale"
  FROM devices d
  JOIN plants p ON p.id = d."plantId"
  JOIN humidity_sensors_config hsc ON hsc."deviceId" = d.id
  JOIN notification_settings ns ON ns.user_id = d.user_id
  JOIN auth.users u ON u.id = ns.user_id
  LEFT JOIN humidity_measurements hm ON hm."deviceId" = d.id
  WHERE true
  GROUP BY d.id, p.id, p.name, hsc."sleepDurationSeconds", ns.user_id, ns.telegram_chat_id,
    ns.browser_notifications_enabled, ns.email_notifications_enabled, u.email,
    ns.notification_timezone, ns.notification_hour, ns.locale
  HAVING (
    MAX(hm."createdAt") IS NULL
    OR MAX(hm."createdAt") < NOW() - (hsc."sleepDurationSeconds" * 2 * INTERVAL '1 second')
  )
  ${CHANNEL_FILTER}
`;
