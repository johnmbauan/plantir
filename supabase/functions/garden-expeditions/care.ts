import type { SupabaseClient } from "@supabase/supabase-js";
import { CARE_BOND_POINTS, MILESTONE_BOND_POINTS, gardenTierFromCount } from "./catalog.ts";
import { applyBondGrants, type BondGrant } from "./bonds.ts";

interface CareCandidate {
  achievementKey: string;
  reasonCode: string;
  subjectId: string;
}

export async function grantCareBonds(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: unlocks } = await admin
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  const unlocked = new Set((unlocks ?? []).map((row) => String(row.achievement_key)));
  if (unlocked.size === 0) return;

  const [
    { data: plants },
    { data: devices },
    { data: profile },
    { data: watering },
    { data: offline },
    { data: progress },
    { data: sanctuary },
  ] = await Promise.all([
    admin.from("plants").select('id, "imageUrl", species_id').eq("user_id", userId),
    admin
      .from("devices")
      .select("id, plantId, humidity_sensors_config(calibrated_at)")
      .eq("user_id", userId),
    admin.from("profiles").select("nickname, avatar_url").eq("user_id", userId).maybeSingle(),
    admin
      .from("notifications")
      .select("id, created_at, resolved_at")
      .eq("user_id", userId)
      .eq("type", "watering")
      .not("resolved_at", "is", null)
      .limit(50),
    admin
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "offline")
      .not("resolved_at", "is", null)
      .limit(20),
    admin.from("user_garden_progress").select("client_events, healthy_streak_days").eq("user_id", userId).maybeSingle(),
    admin.from("user_sanctuary").select("last_celebrated_tier").eq("user_id", userId).maybeSingle(),
  ]);

  const candidates: CareCandidate[] = [];
  const events = (progress?.client_events ?? {}) as Record<string, boolean>;

  for (const plant of plants ?? []) {
    if (unlocked.has("hello_my_name_is")) {
      candidates.push({ achievementKey: "hello_my_name_is", reasonCode: "care_plant", subjectId: String(plant.id) });
    }
    if (unlocked.has("latin_name_dropper") && plant.species_id) {
      candidates.push({ achievementKey: "latin_name_dropper", reasonCode: "care_species", subjectId: String(plant.id) });
    }
    if (unlocked.has("influencer_garden") && plant.imageUrl) {
      candidates.push({ achievementKey: "influencer_garden", reasonCode: "care_photo", subjectId: String(plant.id) });
    }
  }

  for (const device of devices ?? []) {
    if (unlocked.has("stalking_fern_legally")) {
      candidates.push({ achievementKey: "stalking_fern_legally", reasonCode: "care_device", subjectId: String(device.id) });
    }
    if (unlocked.has("matchmaker_of_moisture") && device.plantId) {
      candidates.push({ achievementKey: "matchmaker_of_moisture", reasonCode: "care_link", subjectId: String(device.id) });
    }
    const config = Array.isArray(device.humidity_sensors_config)
      ? device.humidity_sensors_config[0]
      : device.humidity_sensors_config;
    if (unlocked.has("dirt_whisperer_initiate") && config?.calibrated_at) {
      candidates.push({
        achievementKey: "dirt_whisperer_initiate",
        reasonCode: "care_calibration",
        subjectId: String(device.id),
      });
    }
  }

  for (const note of watering ?? []) {
    if (!note.resolved_at) continue;
    const waitMs = new Date(note.resolved_at).getTime() - new Date(note.created_at).getTime();
    if (waitMs <= 48 * 60 * 60 * 1000 && unlocked.has("hydration_hero")) {
      candidates.push({ achievementKey: "hydration_hero", reasonCode: "care_watering", subjectId: String(note.id) });
    }
    if (waitMs >= 3 * 24 * 60 * 60 * 1000 && unlocked.has("the_comeback_kid")) {
      candidates.push({ achievementKey: "the_comeback_kid", reasonCode: "care_comeback", subjectId: String(note.id) });
    }
  }

  for (const note of offline ?? []) {
    if (unlocked.has("back_from_the_mulch")) {
      candidates.push({ achievementKey: "back_from_the_mulch", reasonCode: "care_offline", subjectId: String(note.id) });
    }
  }

  const oneTime: Array<[string, string, keyof typeof events | string]> = [
    ["plant_texted_back", "care_notifications", "notification_settings_saved"],
    ["cloud_oracle", "care_weather", "weather_city_set"],
    ["inbox_compost", "care_inbox", "inbox_cleared"],
    ["time_traveler", "care_history", "viewed_30d_history"],
    ["midnight_mulcher", "care_history", "alert_hour_visit"],
  ];
  for (const [key, reason, eventKey] of oneTime) {
    if (unlocked.has(key) && events[eventKey]) {
      candidates.push({ achievementKey: key, reasonCode: reason, subjectId: "once" });
    }
  }

  if (unlocked.has("face_of_the_garden") && profile?.nickname && profile.avatar_url) {
    candidates.push({ achievementKey: "face_of_the_garden", reasonCode: "care_profile", subjectId: "once" });
  }

  const streak = Number(progress?.healthy_streak_days ?? 0);
  if (streak >= 7 && unlocked.has("seven_days_without_drama")) {
    candidates.push({
      achievementKey: "seven_days_without_drama",
      reasonCode: "care_healthy",
      subjectId: `streak-${streak}`,
    });
  }
  if (streak >= 30 && unlocked.has("photosynthesis_stan")) {
    candidates.push({
      achievementKey: "photosynthesis_stan",
      reasonCode: "care_healthy",
      subjectId: `streak-${streak}`,
    });
  }
  if (unlocked.has("all_green_no_envy") && streak >= 1) {
    candidates.push({ achievementKey: "all_green_no_envy", reasonCode: "care_healthy", subjectId: "healthy-once" });
  }

  const grants: BondGrant[] = candidates.map((candidate) => ({
    achievementKey: candidate.achievementKey,
    points: CARE_BOND_POINTS,
    source: "care",
    reasonCode: candidate.reasonCode,
    subjectId: candidate.subjectId,
  }));

  const currentTier = gardenTierFromCount(unlocked.size);
  const lastTier = sanctuary?.last_celebrated_tier ?? 0;
  if (currentTier > lastTier) {
    for (const key of unlocked) {
      grants.push({
        achievementKey: key,
        points: MILESTONE_BOND_POINTS,
        source: "milestone",
        reasonCode: "milestone",
        subjectId: `tier-${currentTier}`,
      });
    }
    await admin.from("user_sanctuary").upsert({
      user_id: userId,
      last_celebrated_tier: currentTier,
      updated_at: new Date().toISOString(),
    });
  }

  await applyBondGrants(admin, userId, grants);
}
