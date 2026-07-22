// Shared constants, types, and interfaces for the achievement system.
// Nothing in this file imports from other modules.

export const OFFLINE_SLEEP_MULTIPLIER = 2;
export const BATTERY_LOW_PERCENT = 10;
export const BATTERY_RECHARGED_PERCENT = 20;

/** Keys that the client is allowed to attest via `record_client_event`. */
export const ALLOWED_CLIENT_EVENTS = [
  "weather_city_set",
  "viewed_30d_history",
  "alert_hour_visit",
  "inbox_cleared",
  "notification_settings_saved",
] as const;

export type ClientEventKey = (typeof ALLOWED_CLIENT_EVENTS)[number];

/** Full definition of a badge as stored in `achievement_definitions`. */
export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  garden_element: string;
  sort_order: number;
  is_hidden: boolean;
}

/** Shape of a `user_garden_progress` row. */
export interface GardenProgress {
  user_id: string;
  last_dashboard_visit: string | null;
  last_all_healthy_date: string | null;
  healthy_streak_days: number;
  client_events: Record<string, unknown>;
}

/** Shape of a device row as returned by Supabase with the joined humidity config. */
export type DeviceRow = {
  id: number;
  plantId: number | null;
  humidity_sensors_config:
    | {
        calibrated_at?: string | null;
        minHumidityThreshold: number;
        sleepDurationSeconds: number;
      }
    | Array<{
        calibrated_at?: string | null;
        minHumidityThreshold: number;
        sleepDurationSeconds: number;
      }>
    | null;
};
