// Pure badge-eligibility computation — reads from the DB, never writes.
// All functions here are deterministic given their inputs and a point in time.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BATTERY_LOW_PERCENT,
  BATTERY_RECHARGED_PERCENT,
  OFFLINE_SLEEP_MULTIPLIER,
  type DeviceRow,
  type GardenProgress,
} from "./achievementTypes.ts";

/**
 * Extracts the humidity sensor config from a device row.
 * Supabase may return the joined config as an object or a single-element array
 * depending on query shape; this normalises both to a single config or null.
 */
function getDeviceHumidityConfig(d: DeviceRow) {
  const cfg = d.humidity_sensors_config;
  if (!cfg) return null;
  return Array.isArray(cfg) ? cfg[0] ?? null : cfg;
}

/**
 * Returns true if a plant is considered healthy at the given point in time.
 * A plant is healthy when it has a recent measurement (within 2× the device sleep cycle)
 * and its humidity is at or above the configured threshold.
 */
function isPlantHealthy(args: {
  humidityPercent: number | null;
  measuredAt: string | null;
  threshold: number;
  sleepDurationSeconds: number;
  nowMs: number;
}): boolean {
  if (args.humidityPercent == null || args.measuredAt == null) return false;
  const ageMs = args.nowMs - new Date(args.measuredAt).getTime();
  if (ageMs > args.sleepDurationSeconds * OFFLINE_SLEEP_MULTIPLIER * 1000) return false;
  if (args.humidityPercent < args.threshold) return false;
  return true;
}

/**
 * Queries all relevant user data and returns the set of badge keys the user
 * currently qualifies for, regardless of whether they are already earned.
 * The caller is responsible for diffing against already-earned keys.
 *
 * Most data is fetched in parallel; battery history and per-plant humidity
 * checks are fetched sequentially after (they depend on the device list).
 */
export async function computeEligibleBadgeKeys(
  admin: SupabaseClient,
  userId: string,
  progress: GardenProgress,
): Promise<string[]> {
  const keys: string[] = [];
  const nowMs = Date.now();

  const [
    { data: plants, error: plantsError },
    { data: devices, error: devicesError },
    { data: profile, error: profileError },
    { data: wateringNotifs, error: wateringError },
    { data: offlineResolved, error: offlineError },
  ] = await Promise.all([
    admin.from("plants").select("id, imageUrl, species_id").eq("user_id", userId),
    admin
      .from("devices")
      .select(
        "id, plantId, humidity_sensors_config(calibrated_at, minHumidityThreshold, sleepDurationSeconds)",
      )
      .eq("user_id", userId),
    admin.from("profiles").select("nickname, avatar_url").eq("user_id", userId).maybeSingle(),
    admin
      .from("notifications")
      .select("created_at, resolved_at")
      .eq("user_id", userId)
      .eq("type", "watering")
      .not("resolved_at", "is", null)
      .limit(100),
    admin
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "offline")
      .not("resolved_at", "is", null)
      .limit(1),
  ]);

  if (plantsError) throw plantsError;
  if (devicesError) throw devicesError;
  if (profileError) throw profileError;
  if (wateringError) throw wateringError;
  if (offlineError) throw offlineError;

  const plantRows = plants ?? [];
  const deviceRows = (devices ?? []) as DeviceRow[];

  const hasPlant = plantRows.length > 0;
  const hasDevice = deviceRows.length > 0;
  const hasLink = deviceRows.some((d) => d.plantId != null);
  const hasCalibrated = deviceRows.some((d) => getDeviceHumidityConfig(d)?.calibrated_at != null);

  if (hasPlant) keys.push("hello_my_name_is");
  if (hasDevice) keys.push("stalking_fern_legally");
  if (hasLink) keys.push("matchmaker_of_moisture");
  if (hasCalibrated) keys.push("dirt_whisperer_initiate");

  if (hasPlant && hasLink && hasCalibrated) {
    keys.push("fully_rooted_not_emotionally");
  }

  const hydrationOk = (wateringNotifs ?? []).some((n) => {
    if (!n.resolved_at || !n.created_at) return false;
    const diff = new Date(n.resolved_at).getTime() - new Date(n.created_at).getTime();
    return diff >= 0 && diff <= 48 * 60 * 60 * 1000;
  });
  if (hydrationOk) keys.push("hydration_hero");

  if ((offlineResolved ?? []).length > 0) keys.push("back_from_the_mulch");

  const deviceIds = deviceRows.map((d) => d.id);
  if (deviceIds.length > 0) {
    const { data: batteryRows, error: batteryError } = await admin
      .from("battery_measurements")
      .select("deviceId, batteryPercent, createdAt")
      .in("deviceId", deviceIds)
      .order("createdAt", { ascending: true });
    if (batteryError) throw batteryError;

    const byDevice = new Map<number, Array<{ pct: number }>>();
    for (const row of batteryRows ?? []) {
      const id = Number(row.deviceId);
      const list = byDevice.get(id) ?? [];
      list.push({ pct: Number(row.batteryPercent) });
      byDevice.set(id, list);
    }

    let batteryOk = false;
    for (const samples of byDevice.values()) {
      let sawLow = false;
      for (const s of samples) {
        if (s.pct <= BATTERY_LOW_PERCENT) sawLow = true;
        if (sawLow && s.pct > BATTERY_RECHARGED_PERCENT) {
          batteryOk = true;
          break;
        }
      }
      if (batteryOk) break;
    }
    if (batteryOk) keys.push("juice_box_refiller");
  }

  const monitored = deviceRows.filter((d) => d.plantId != null);
  const monitoredPlantIds = [...new Set(monitored.map((d) => d.plantId!))];
  if (monitoredPlantIds.length >= 2) {
    let allHealthy = true;
    for (const plantId of monitoredPlantIds) {
      const device = monitored.find((d) => d.plantId === plantId)!;
      const cfg = getDeviceHumidityConfig(device);
      if (!cfg) {
        allHealthy = false;
        break;
      }
      const { data: latestHum, error: humError } = await admin
        .from("humidity_measurements")
        .select("humidityPercentage, createdAt")
        .eq("deviceId", device.id)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (humError) throw humError;

      if (
        !isPlantHealthy({
          humidityPercent: latestHum?.humidityPercentage ?? null,
          measuredAt: latestHum?.createdAt ?? null,
          threshold: cfg.minHumidityThreshold,
          sleepDurationSeconds: cfg.sleepDurationSeconds,
          nowMs,
        })
      ) {
        allHealthy = false;
        break;
      }
    }
    if (allHealthy) keys.push("all_green_no_envy");
  }

  if (plantRows.length >= 4) keys.push("accidental_collector");
  if (plantRows.some((p) => p.species_id != null)) keys.push("latin_name_dropper");
  if (plantRows.filter((p) => p.imageUrl != null).length >= 3) keys.push("influencer_garden");

  const events = progress.client_events ?? {};
  if (events.notification_settings_saved === true) keys.push("plant_texted_back");
  if (events.weather_city_set === true) keys.push("cloud_oracle");

  if (
    profile &&
    String(profile.nickname ?? "").trim() !== "" &&
    profile.avatar_url != null
  ) {
    keys.push("face_of_the_garden");
  }

  if ((progress.healthy_streak_days ?? 0) >= 7) keys.push("seven_days_without_drama");
  if ((progress.healthy_streak_days ?? 0) >= 30) keys.push("photosynthesis_stan");
  if (events.viewed_30d_history === true) keys.push("time_traveler");
  if (events.alert_hour_visit === true) keys.push("midnight_mulcher");
  if (events.inbox_cleared === true) keys.push("inbox_compost");

  const comebackOk = (wateringNotifs ?? []).some((n) => {
    if (!n.resolved_at || !n.created_at) return false;
    const diff = new Date(n.resolved_at).getTime() - new Date(n.created_at).getTime();
    return diff >= 3 * 24 * 60 * 60 * 1000;
  });
  if (comebackOk) keys.push("the_comeback_kid");

  return [...new Set(keys)];
}

/**
 * Checks whether every plant that has a linked device is currently healthy.
 * Fetches the latest humidity measurement for each monitored device sequentially
 * and short-circuits on the first unhealthy plant.
 * Returns the count of monitored plants alongside the result so the cron job
 * can skip users with no monitored plants without a separate query.
 */
export async function checkAllMonitoredPlantsHealthy(
  admin: SupabaseClient,
  userId: string,
): Promise<{ monitored: number; allHealthy: boolean }> {
  const { data: devices, error } = await admin
    .from("devices")
    .select("id, plantId, humidity_sensors_config(minHumidityThreshold, sleepDurationSeconds)")
    .eq("user_id", userId)
    .not("plantId", "is", null);
  if (error) throw error;

  const rows = (devices ?? []) as DeviceRow[];
  const monitored = rows.filter((d) => d.plantId != null);
  if (monitored.length === 0) return { monitored: 0, allHealthy: false };

  const nowMs = Date.now();
  for (const d of monitored) {
    const cfg = getDeviceHumidityConfig(d);
    if (!cfg) return { monitored: monitored.length, allHealthy: false };

    const { data: latest, error: humError } = await admin
      .from("humidity_measurements")
      .select("humidityPercentage, createdAt")
      .eq("deviceId", d.id)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (humError) throw humError;

    if (
      !isPlantHealthy({
        humidityPercent: latest?.humidityPercentage ?? null,
        measuredAt: latest?.createdAt ?? null,
        threshold: cfg.minHumidityThreshold,
        sleepDurationSeconds: cfg.sleepDurationSeconds,
        nowMs,
      })
    ) {
      return { monitored: monitored.length, allHealthy: false };
    }
  }

  return { monitored: monitored.length, allHealthy: true };
}
