import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { assertSpyCalls, returnsNext, stub } from "jsr:@std/testing/mock";
import { fetchRainForecast, loadRainForecastsByCoords, rainNoteText } from "../../telegram-notifier/weather.ts";
import type { WateringRow } from "../../telegram-notifier/types.ts";
import { json, routedFetch } from "../utils/supabase_env.ts";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function meteoResponse(codes: number[]) {
  return json({ daily: { weather_code: codes } });
}

function makeWateringRow(overrides: Partial<WateringRow> = {}): WateringRow {
  return {
    userId: "u1",
    chatId: "",
    browserEnabled: false,
    plantId: 1,
    plantName: "Fern",
    imageUrl: null,
    humidity: 20,
    isOutdoor: true,
    weatherLat: 48.8,
    weatherLng: 2.3,
    locale: "en",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fetchRainForecast
// ---------------------------------------------------------------------------

describe("fetchRainForecast", () => {
  describe("non-rain weather codes", () => {
    it("returns false for both days with clear-sky codes (0, 1)", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => meteoResponse([0, 1]),
      }));
      assertEquals(await fetchRainForecast(48, 16), {
        isRainForcastedForToday: false,
        isRainForcastedForTomorrow: false,
      });
    });
  });

  describe("rain weather codes", () => {
    it("detects drizzle (code 51) as rain today", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => meteoResponse([51, 0]),
      }));
      const result = await fetchRainForecast(48, 16);
      assertEquals(result.isRainForcastedForToday, true);
      assertEquals(result.isRainForcastedForTomorrow, false);
    });

    it("detects rain showers (code 80) as rain tomorrow", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => meteoResponse([0, 80]),
      }));
      const result = await fetchRainForecast(48, 16);
      assertEquals(result.isRainForcastedForToday, false);
      assertEquals(result.isRainForcastedForTomorrow, true);
    });

    it("detects thunderstorm (code 95) for both days", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => meteoResponse([95, 99]),
      }));
      assertEquals(await fetchRainForecast(48, 16), {
        isRainForcastedForToday: true,
        isRainForcastedForTomorrow: true,
      });
    });

    it("detects heavy rain (code 67) at the upper boundary", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => meteoResponse([67, 0]),
      }));
      assertEquals((await fetchRainForecast(48, 16)).isRainForcastedForToday, true);
    });

    it("treats code 83 (not in rain range) as non-rain", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => meteoResponse([83, 0]),
      }));
      assertEquals((await fetchRainForecast(48, 16)).isRainForcastedForToday, false);
    });
  });

  describe("error and edge cases", () => {
    it("returns false for both days when the API returns a non-ok status", async () => {
      using _fetch = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response("Server Error", { status: 500 })),
      );
      assertEquals(await fetchRainForecast(48, 16), {
        isRainForcastedForToday: false,
        isRainForcastedForTomorrow: false,
      });
    });

    it("returns false when the response is missing the daily field", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => json({}),
      }));
      assertEquals(await fetchRainForecast(48, 16), {
        isRainForcastedForToday: false,
        isRainForcastedForTomorrow: false,
      });
    });

    it("returns false when weather_code array is empty", async () => {
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => json({ daily: { weather_code: [] } }),
      }));
      assertEquals(await fetchRainForecast(48, 16), {
        isRainForcastedForToday: false,
        isRainForcastedForTomorrow: false,
      });
    });

    it("sends the correct URL with latitude, longitude, and 2 forecast days", async () => {
      using fetchStub = stub(globalThis, "fetch", async () =>
        json({ daily: { weather_code: [0, 0] } })
      );
      await fetchRainForecast(52.5, 13.4);
      assertSpyCalls(fetchStub, 1);
      assertEquals(
        String(fetchStub.calls[0].args[0]),
        "https://api.open-meteo.com/v1/forecast?latitude=52.5&longitude=13.4&daily=weather_code&forecast_days=2&timezone=auto",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// rainNoteText
// ---------------------------------------------------------------------------

describe("rainNoteText", () => {
  it("returns the today+tomorrow message when both flags are true", () => {
    assertEquals(
      rainNoteText({ isRainForcastedForToday: true, isRainForcastedForTomorrow: true }, "en"),
      "Rain is expected today and tomorrow — watering may not be needed.",
    );
  });

  it("returns the today-only message when only today is true", () => {
    assertEquals(
      rainNoteText({ isRainForcastedForToday: true, isRainForcastedForTomorrow: false }, "en"),
      "Rain is expected today — watering may not be needed.",
    );
  });

  it("returns the tomorrow-only message when only tomorrow is true", () => {
    assertEquals(
      rainNoteText({ isRainForcastedForToday: false, isRainForcastedForTomorrow: true }, "en"),
      "Rain is expected tomorrow — watering may not be needed.",
    );
  });
});

// ---------------------------------------------------------------------------
// loadRainForecastsByCoords
// ---------------------------------------------------------------------------

describe("loadRainForecastsByCoords", () => {
  it("returns an empty map for an empty row list", async () => {
    const result = await loadRainForecastsByCoords([]);
    assertEquals(result.size, 0);
  });

  it("skips indoor plants and makes no fetch calls", async () => {
    using fetchStub = stub(globalThis, "fetch", async () => meteoResponse([0, 0]));
    const result = await loadRainForecastsByCoords([makeWateringRow({ isOutdoor: false })]);
    assertEquals(result.size, 0);
    assertSpyCalls(fetchStub, 0);
  });

  it("skips outdoor plants with null coordinates", async () => {
    using fetchStub = stub(globalThis, "fetch", async () => meteoResponse([0, 0]));
    const result = await loadRainForecastsByCoords([
      makeWateringRow({ weatherLat: null, weatherLng: null }),
    ]);
    assertEquals(result.size, 0);
    assertSpyCalls(fetchStub, 0);
  });

  it("fetches and caches a forecast keyed by 'lat,lng'", async () => {
    using _fetch = stub(globalThis, "fetch", routedFetch({
      "open-meteo.com": () => meteoResponse([51, 0]),
    }));
    const result = await loadRainForecastsByCoords([makeWateringRow()]);
    assertEquals(result.size, 1);
    assertEquals(result.get("48.8,2.3")?.isRainForcastedForToday, true);
  });

  it("makes only one fetch for two rows with identical coordinates", async () => {
    using fetchStub = stub(globalThis, "fetch", async () => meteoResponse([0, 0]));
    await loadRainForecastsByCoords([
      makeWateringRow({ plantId: 1 }),
      makeWateringRow({ plantId: 2 }),
    ]);
    assertSpyCalls(fetchStub, 1);
  });

  it("makes separate fetches for two rows with different coordinates", async () => {
    using fetchStub = stub(globalThis, "fetch", async () => meteoResponse([0, 0]));
    await loadRainForecastsByCoords([
      makeWateringRow({ plantId: 1, weatherLat: 48.8, weatherLng: 2.3 }),
      makeWateringRow({ plantId: 2, weatherLat: 52.5, weatherLng: 13.4 }),
    ]);
    assertSpyCalls(fetchStub, 2);
  });

  it("still returns results from successful fetches when one location fails", async () => {
    using fetchStub = stub(
      globalThis,
      "fetch",
      returnsNext([
        Promise.resolve(meteoResponse([80, 0])),
        Promise.resolve(new Response("error", { status: 500 })),
      ]),
    );
    const result = await loadRainForecastsByCoords([
      makeWateringRow({ plantId: 1, weatherLat: 48.8, weatherLng: 2.3 }),
      makeWateringRow({ plantId: 2, weatherLat: 52.5, weatherLng: 13.4 }),
    ]);
    assertSpyCalls(fetchStub, 2);
    // First location succeeded, second returned a fallback (false/false) and was cached
    assertEquals(result.get("48.8,2.3")?.isRainForcastedForToday, true);
    assertEquals(result.get("52.5,13.4")?.isRainForcastedForToday, false);
  });
});
