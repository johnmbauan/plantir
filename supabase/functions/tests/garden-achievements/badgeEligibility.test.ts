import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { assert, assertEquals, assertRejects } from "jsr:@std/assert";
import {
  checkAllMonitoredPlantsHealthy,
  computeEligibleBadgeKeys,
} from "../../garden-achievements/badgeEligibility.ts";
import type { GardenProgress } from "../../garden-achievements/achievementTypes.ts";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

/**
 * Returns a thenable query builder that resolves to `{ data, error }`.
 * Every fluent method (select, eq, not, limit, order, in) returns the same
 * builder so arbitrary chains can be awaited directly or via `.maybeSingle()`.
 */
function makeBuilder(data: unknown, error: unknown = null) {
  const p = Promise.resolve({ data, error });
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    not: () => b,
    limit: () => b,
    order: () => b,
    in: () => b,
    maybeSingle: () => p,
    then: (
      onfulfilled: (v: unknown) => unknown,
      onrejected?: (v: unknown) => unknown,
    ) => p.then(onfulfilled, onrejected),
    catch: (onrejected: (v: unknown) => unknown) => p.catch(onrejected),
  };
  return b;
}

type TableSpec = { data: unknown; error?: unknown };

/**
 * Creates a minimal Supabase-compatible client backed by a plain table map.
 *
 * Keys are either a bare table name ("plants") that matches every call to that
 * table, or a call-scoped key ("notifications:1", "notifications:2") that
 * matches only the N-th call. Call-scoped keys take precedence.
 * Falls back to `{ data: [], error: null }` when no key matches.
 */
function createClient(tables: Record<string, TableSpec>) {
  const counts: Record<string, number> = {};
  return {
    from(table: string) {
      counts[table] = (counts[table] ?? 0) + 1;
      const r =
        tables[`${table}:${counts[table]}`] ??
        tables[table] ??
        { data: [], error: null };
      return makeBuilder(r.data, r.error ?? null);
    },
  };
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE_PROGRESS: GardenProgress = {
  user_id: "user-1",
  last_dashboard_visit: null,
  last_all_healthy_date: null,
  healthy_streak_days: 0,
  client_events: {},
};

/**
 * Default empty state satisfying all 6 parallel queries in
 * computeEligibleBadgeKeys. Override individual keys per test.
 *
 * notifications:1 → watering query (first call)
 * notifications:2 → offline query  (second call, same Promise.all)
 */
const EMPTY_TABLES: Record<string, TableSpec> = {
  plants: { data: [] },
  devices: { data: [] },
  notification_settings: { data: null },
  profiles: { data: null },
  "notifications:1": { data: [] },
  "notifications:2": { data: [] },
  battery_measurements: { data: [] },
};

// ---------------------------------------------------------------------------
// checkAllMonitoredPlantsHealthy
// ---------------------------------------------------------------------------

describe("checkAllMonitoredPlantsHealthy", () => {
  describe("when there are no monitored devices", () => {
    it("returns monitored=0 and allHealthy=false", async () => {
      const client = createClient({ devices: { data: [] } });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 0, allHealthy: false },
      );
    });
  });

  describe("device configuration", () => {
    it("returns allHealthy=false when a device has no humidity config", async () => {
      const client = createClient({
        devices: { data: [{ id: 1, plantId: 10, humidity_sensors_config: null }] },
        humidity_measurements: { data: null },
      });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 1, allHealthy: false },
      );
    });

    it("normalises config returned as a single-element array", async () => {
      const recent = new Date(Date.now() - 60_000).toISOString();
      const client = createClient({
        devices: {
          data: [{
            id: 1,
            plantId: 10,
            humidity_sensors_config: [{ minHumidityThreshold: 40, sleepDurationSeconds: 3600 }],
          }],
        },
        humidity_measurements: { data: { humidityPercentage: 75, createdAt: recent } },
      });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 1, allHealthy: true },
      );
    });
  });

  describe("plant health evaluation", () => {
    let recent: string;

    beforeEach(() => {
      recent = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago
    });

    it("returns allHealthy=true for a fresh measurement above the threshold", async () => {
      const client = createClient({
        devices: {
          data: [{
            id: 1,
            plantId: 10,
            humidity_sensors_config: { minHumidityThreshold: 40, sleepDurationSeconds: 3600 },
          }],
        },
        humidity_measurements: { data: { humidityPercentage: 75, createdAt: recent } },
      });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 1, allHealthy: true },
      );
    });

    it("returns allHealthy=false when humidity is below the threshold", async () => {
      const client = createClient({
        devices: {
          data: [{
            id: 1,
            plantId: 10,
            humidity_sensors_config: { minHumidityThreshold: 80, sleepDurationSeconds: 3600 },
          }],
        },
        humidity_measurements: { data: { humidityPercentage: 50, createdAt: recent } },
      });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 1, allHealthy: false },
      );
    });

    it("returns allHealthy=false when the measurement is stale (> 2× sleep cycle)", async () => {
      // OFFLINE_SLEEP_MULTIPLIER=2, sleepDurationSeconds=3600 → max age 7200 s
      const stale = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 h ago
      const client = createClient({
        devices: {
          data: [{
            id: 1,
            plantId: 10,
            humidity_sensors_config: { minHumidityThreshold: 40, sleepDurationSeconds: 3600 },
          }],
        },
        humidity_measurements: { data: { humidityPercentage: 75, createdAt: stale } },
      });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 1, allHealthy: false },
      );
    });

    it("returns allHealthy=false when no measurement row exists", async () => {
      const client = createClient({
        devices: {
          data: [{
            id: 1,
            plantId: 10,
            humidity_sensors_config: { minHumidityThreshold: 40, sleepDurationSeconds: 3600 },
          }],
        },
        humidity_measurements: { data: null },
      });
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 1, allHealthy: false },
      );
    });
  });

  describe("multiple monitored plants", () => {
    it("returns allHealthy=true when every plant is healthy", async () => {
      const recent = new Date(Date.now() - 60_000).toISOString();
      let humCallCount = 0;
      const client = {
        from(table: string) {
          if (table === "devices") {
            return makeBuilder([
              { id: 1, plantId: 10, humidity_sensors_config: { minHumidityThreshold: 40, sleepDurationSeconds: 3600 } },
              { id: 2, plantId: 20, humidity_sensors_config: { minHumidityThreshold: 40, sleepDurationSeconds: 3600 } },
            ]);
          }
          humCallCount++;
          return makeBuilder({ humidityPercentage: 75, createdAt: recent });
        },
      };
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 2, allHealthy: true },
      );
      assertEquals(humCallCount, 2);
    });

    it("short-circuits after the first unhealthy plant", async () => {
      const recent = new Date(Date.now() - 60_000).toISOString();
      let humCallCount = 0;
      const client = {
        from(table: string) {
          if (table === "devices") {
            return makeBuilder([
              { id: 1, plantId: 10, humidity_sensors_config: { minHumidityThreshold: 90, sleepDurationSeconds: 3600 } },
              { id: 2, plantId: 20, humidity_sensors_config: { minHumidityThreshold: 40, sleepDurationSeconds: 3600 } },
            ]);
          }
          humCallCount++;
          return makeBuilder({ humidityPercentage: 50, createdAt: recent });
        },
      };
      assertEquals(
        await checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        { monitored: 2, allHealthy: false },
      );
      assertEquals(humCallCount, 1, "should stop querying after the first unhealthy plant");
    });
  });

  describe("error handling", () => {
    it("rethrows a DB error from the devices query", async () => {
      const client = createClient({
        devices: { data: null, error: new Error("connection refused") },
      });
      await assertRejects(
        () => checkAllMonitoredPlantsHealthy(client as any, "user-1"),
        Error,
        "connection refused",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// computeEligibleBadgeKeys
// ---------------------------------------------------------------------------

describe("computeEligibleBadgeKeys", () => {
  describe("baseline", () => {
    it("returns no badges when all data is empty", async () => {
      const client = createClient(EMPTY_TABLES);
      assertEquals(
        await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS),
        [],
      );
    });

    it("returns a deduplicated list of badge keys", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: { data: [{ id: 1, imageUrl: null, species_id: null }] },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assertEquals(keys, [...new Set(keys)]);
    });
  });

  describe("setup badges", () => {
    it("earns hello_my_name_is when the user has at least one plant", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: { data: [{ id: 1, imageUrl: null, species_id: null }] },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("hello_my_name_is"));
    });

    it("earns stalking_fern_legally when the user has at least one device", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        devices: { data: [{ id: 1, plantId: null, humidity_sensors_config: null }] },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("stalking_fern_legally"));
    });

    it("earns matchmaker_of_moisture when a device is linked to a plant", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        devices: { data: [{ id: 1, plantId: 10, humidity_sensors_config: null }] },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("matchmaker_of_moisture"));
    });

    it("earns dirt_whisperer_initiate when a device has been calibrated", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        devices: {
          data: [{
            id: 1,
            plantId: null,
            humidity_sensors_config: {
              calibrated_at: "2024-01-01T00:00:00Z",
              minHumidityThreshold: 40,
              sleepDurationSeconds: 3600,
            },
          }],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("dirt_whisperer_initiate"));
    });

    it("earns fully_rooted_not_emotionally with a plant, a linked & calibrated device", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: { data: [{ id: 1, imageUrl: null, species_id: null }] },
        devices: {
          data: [{
            id: 1,
            plantId: 1,
            humidity_sensors_config: {
              calibrated_at: "2024-01-01T00:00:00Z",
              minHumidityThreshold: 40,
              sleepDurationSeconds: 3600,
            },
          }],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("fully_rooted_not_emotionally"));
    });

    it("earns plant_texted_back when a Telegram chat ID is configured", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        notification_settings: {
          data: {
            telegram_chat_id: "12345",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("plant_texted_back"));
    });
  });

  describe("notification badges", () => {
    it("earns hydration_hero when a watering alert is resolved within 48 h", async () => {
      const now = Date.now();
      const client = createClient({
        ...EMPTY_TABLES,
        "notifications:1": {
          data: [{
            created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 h ago
            resolved_at: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // resolved 1 h ago → diff 1 h
          }],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("hydration_hero"));
    });

    it("earns the_comeback_kid when a watering alert is resolved after 3+ days", async () => {
      const now = Date.now();
      const client = createClient({
        ...EMPTY_TABLES,
        "notifications:1": {
          data: [{
            created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            resolved_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // resolved 1 day ago → diff 4 days
          }],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("the_comeback_kid"));
    });

    it("earns back_from_the_mulch when an offline alert has been resolved", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        "notifications:2": { data: [{ id: 99 }] },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("back_from_the_mulch"));
    });
  });

  describe("battery badge", () => {
    it("earns juice_box_refiller when a device battery recovers past 20% after dropping to ≤10%", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        devices: { data: [{ id: 1, plantId: null, humidity_sensors_config: null }] },
        battery_measurements: {
          data: [
            { deviceId: 1, batteryPercent: 8, createdAt: "2024-01-01T00:00:00Z" },  // ≤10 → low
            { deviceId: 1, batteryPercent: 25, createdAt: "2024-01-02T00:00:00Z" }, // >20 → recharged
          ],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("juice_box_refiller"));
    });

    it("does not earn juice_box_refiller when battery never recovers", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        devices: { data: [{ id: 1, plantId: null, humidity_sensors_config: null }] },
        battery_measurements: {
          data: [
            { deviceId: 1, batteryPercent: 8, createdAt: "2024-01-01T00:00:00Z" },
            { deviceId: 1, batteryPercent: 9, createdAt: "2024-01-02T00:00:00Z" },
          ],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(!keys.includes("juice_box_refiller"));
    });
  });

  describe("streak badges", () => {
    it("earns seven_days_without_drama after a 7-day healthy streak", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        healthy_streak_days: 7,
      });
      assert(keys.includes("seven_days_without_drama"));
    });

    it("earns both streak badges after a 30-day streak", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        healthy_streak_days: 30,
      });
      assert(keys.includes("seven_days_without_drama"));
      assert(keys.includes("photosynthesis_stan"));
    });

    it("does not earn any streak badge with a 6-day streak", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        healthy_streak_days: 6,
      });
      assert(!keys.includes("seven_days_without_drama"));
      assert(!keys.includes("photosynthesis_stan"));
    });
  });

  describe("client event badges", () => {
    it("earns cloud_oracle when weather_city_set is true", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        client_events: { weather_city_set: true },
      });
      assert(keys.includes("cloud_oracle"));
    });

    it("earns time_traveler when viewed_30d_history is true", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        client_events: { viewed_30d_history: true },
      });
      assert(keys.includes("time_traveler"));
    });

    it("earns midnight_mulcher when alert_hour_visit is true", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        client_events: { alert_hour_visit: true },
      });
      assert(keys.includes("midnight_mulcher"));
    });

    it("earns inbox_compost when inbox_cleared is true", async () => {
      const client = createClient(EMPTY_TABLES);
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", {
        ...BASE_PROGRESS,
        client_events: { inbox_cleared: true },
      });
      assert(keys.includes("inbox_compost"));
    });
  });

  describe("plant collection badges", () => {
    it("earns accidental_collector with 4 or more plants", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: {
          data: [
            { id: 1, imageUrl: null, species_id: null },
            { id: 2, imageUrl: null, species_id: null },
            { id: 3, imageUrl: null, species_id: null },
            { id: 4, imageUrl: null, species_id: null },
          ],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("accidental_collector"));
    });

    it("does not earn accidental_collector with exactly 3 plants", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: {
          data: [
            { id: 1, imageUrl: null, species_id: null },
            { id: 2, imageUrl: null, species_id: null },
            { id: 3, imageUrl: null, species_id: null },
          ],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(!keys.includes("accidental_collector"));
    });

    it("earns latin_name_dropper when any plant has a species linked", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: { data: [{ id: 1, imageUrl: null, species_id: "monstera-deliciosa" }] },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("latin_name_dropper"));
    });

    it("earns influencer_garden when 3 or more plants have photos", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: {
          data: [
            { id: 1, imageUrl: "img1.jpg", species_id: null },
            { id: 2, imageUrl: "img2.jpg", species_id: null },
            { id: 3, imageUrl: "img3.jpg", species_id: null },
          ],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("influencer_garden"));
    });

    it("does not earn influencer_garden with fewer than 3 photos", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: {
          data: [
            { id: 1, imageUrl: "img1.jpg", species_id: null },
            { id: 2, imageUrl: null, species_id: null },
          ],
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(!keys.includes("influencer_garden"));
    });
  });

  describe("profile badge", () => {
    it("earns face_of_the_garden when the user has a nickname and avatar", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        profiles: {
          data: { nickname: "Fernanda", avatar_url: "https://example.com/avatar.jpg" },
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(keys.includes("face_of_the_garden"));
    });

    it("does not earn face_of_the_garden with a blank nickname", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        profiles: {
          data: { nickname: "   ", avatar_url: "https://example.com/avatar.jpg" },
        },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(!keys.includes("face_of_the_garden"));
    });

    it("does not earn face_of_the_garden without an avatar", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        profiles: { data: { nickname: "Fernanda", avatar_url: null } },
      });
      const keys = await computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS);
      assert(!keys.includes("face_of_the_garden"));
    });
  });

  describe("error handling", () => {
    it("rethrows a DB error from any parallel query", async () => {
      const client = createClient({
        ...EMPTY_TABLES,
        plants: { data: null, error: new Error("plants table unavailable") },
      });
      await assertRejects(
        () => computeEligibleBadgeKeys(client as any, "user-1", BASE_PROGRESS),
        Error,
        "plants table unavailable",
      );
    });
  });
});
