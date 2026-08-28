/**
 * Integration tests for the translate-species-care edge function.
 *
 * Strategy: intercept Deno.serve, stub Deno.env.get, then mock globalThis.fetch
 * per test to cover Supabase auth, species lookup, translation cache, Azure
 * Translator, and upsert.
 */

import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { assertSpyCalls, stub } from "jsr:@std/testing/mock";
import {
  authFail,
  authOk,
  interceptServe,
  json,
  routedFetch,
  stubEnv,
  TEST_AUTH_HEADER,
  TEST_ENV,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

const AZURE_API_KEY = "test-azure-key";
const AZURE_REGION = "westeurope";

const SPECIES_ROW = {
  id: 42,
  soil: "well-draining potting mix",
  sunlight: "bright indirect light",
  watering: "water when the top inch is dry",
  fertilization: "monthly in spring and summer",
  pruning: "trim yellowing leaves",
};

const CACHED_TRANSLATION = {
  soil: "terriccio ben drenante",
  sunlight: "luce indiretta brillante",
  watering: "annaffiare quando il primo centimetro è asciutto",
  fertilization: "mensile in primavera e estate",
  pruning: "tagliare le foglie ingiallite",
};

const AZURE_TRANSLATIONS = [
  "terriccio ben drenante",
  "luce indiretta brillante",
  "annaffiare quando il primo centimetro è asciutto",
  "mensile in primavera e estate",
  "tagliare le foglie ingiallite",
];

function azureResponse(texts: string[]): Response {
  return json(texts.map((text) => ({ translations: [{ text, to: "it" }] })));
}

function translateRequest(
  body: Record<string, unknown> = { sourceSpeciesId: "monstera-deliciosa", locale: "it" },
): Request {
  return new Request("https://edge.fn/translate-species-care", {
    method: "POST",
    headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function restError(message: string, status = 500): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let handler: EdgeHandler;
let restoreEnv: () => void;
const testEnv: Record<string, string | undefined> = {
  ...TEST_ENV,
  AZURE_TRANSLATOR_API_KEY: AZURE_API_KEY,
  AZURE_TRANSLATOR_REGION: AZURE_REGION,
};

beforeAll(async () => {
  restoreEnv = stubEnv(testEnv);
  const intercept = interceptServe();
  await import("../../translate-species-care/index.ts");
  intercept.restore();
  handler = intercept.getHandler();
});

afterAll(() => restoreEnv());

describe("method handling", () => {
  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await handler(
      new Request("https://edge.fn/translate-species-care", { method: "OPTIONS" }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  });

  it("GET returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/translate-species-care", { method: "GET" }),
    );
    assertEquals(res.status, 405);
    assertEquals((await res.json()).error, "Method not allowed");
  });

  it("PUT returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/translate-species-care", { method: "PUT" }),
    );
    assertEquals(res.status, 405);
  });
});

describe("environment", () => {
  it("returns 500 when a Supabase environment variable is missing", async () => {
    const saved = testEnv.SUPABASE_URL;
    testEnv.SUPABASE_URL = undefined;
    try {
      const res = await handler(translateRequest());
      assertEquals(res.status, 500);
      assertEquals((await res.json()).error, "Missing Supabase environment variables");
    } finally {
      testEnv.SUPABASE_URL = saved;
    }
  });

  it("returns 500 when Azure Translator credentials are missing", async () => {
    const saved = testEnv.AZURE_TRANSLATOR_API_KEY;
    testEnv.AZURE_TRANSLATOR_API_KEY = undefined;
    try {
      const res = await handler(translateRequest());
      assertEquals(res.status, 500);
      assertEquals((await res.json()).error, "Azure Translator credentials not configured");
    } finally {
      testEnv.AZURE_TRANSLATOR_API_KEY = saved;
    }
  });
});

describe("authentication", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await handler(
      new Request("https://edge.fn/translate-species-care", { method: "POST" }),
    );
    assertEquals(res.status, 401);
    assertEquals((await res.json()).error, "Unauthorized");
  });

  it("returns 401 when the Supabase auth token is rejected", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authFail() }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 401);
    assertEquals((await res.json()).error, "Unauthorized");
  });
});

describe("input validation", () => {
  it("returns 400 when the request body is not valid JSON", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/translate-species-care", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER },
        body: "not-json",
      }),
    );
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "Invalid JSON body");
  });

  it("returns 400 when sourceSpeciesId is missing", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(translateRequest({ locale: "it" }));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "sourceSpeciesId is required");
  });

  it("returns 400 when sourceSpeciesId is blank", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(translateRequest({ sourceSpeciesId: "   ", locale: "it" }));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "sourceSpeciesId is required");
  });

  it("returns 400 when locale is missing", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(translateRequest({ sourceSpeciesId: "monstera-deliciosa" }));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "locale is required");
  });

  it("returns 400 when locale is blank", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(translateRequest({ sourceSpeciesId: "monstera-deliciosa", locale: "  " }));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "locale is required");
  });
});

describe("species lookup", () => {
  it("returns 404 when the species does not exist", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species": () => json(null),
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 404);
    assertEquals((await res.json()).error, "Species not found");
  });

  it("returns 500 when the species lookup fails", async () => {
    using errorStub = stub(console, "error", () => {});
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species": () => restError("relation does not exist"),
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "Failed to look up species");
    assertSpyCalls(errorStub, 1);
    assertStringIncludes(String(errorStub.calls[0].args[0]), "species lookup error");
  });
});

describe("cached translation", () => {
  it("returns the cached row without calling Azure Translator", async () => {
    using fetchStub = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method !== "GET") {
            return restError("unexpected write on cache hit");
          }
          return json(CACHED_TRANSLATION);
        },
        "/rest/v1/plant_species": () => json(SPECIES_ROW),
        "microsofttranslator": () => {
          throw new Error("Azure Translator should not be called when a cache hit exists");
        },
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals((await res.json()).translation, CACHED_TRANSLATION);
    for (const call of fetchStub.calls) {
      const url = String(call.args[0]);
      assertEquals(url.includes("microsofttranslator"), false);
    }
  });
});

describe("successful translation", () => {
  it("translates all care fields, upserts the row, and returns it", async () => {
    using fetchStub = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return json(CACHED_TRANSLATION);
        },
        "/rest/v1/plant_species": () => json(SPECIES_ROW),
        "microsofttranslator": async (req) => {
          assertEquals(req.method, "POST");
          assertEquals(
            req.url,
            "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=it&from=en",
          );
          assertEquals(req.headers.get("Ocp-Apim-Subscription-Key"), AZURE_API_KEY);
          assertEquals(req.headers.get("Ocp-Apim-Subscription-Region"), AZURE_REGION);
          assertEquals(await req.json(), [
            { Text: SPECIES_ROW.soil },
            { Text: SPECIES_ROW.sunlight },
            { Text: SPECIES_ROW.watering },
            { Text: SPECIES_ROW.fertilization },
            { Text: SPECIES_ROW.pruning },
          ]);
          return azureResponse(AZURE_TRANSLATIONS);
        },
      }),
    );

    const res = await handler(translateRequest());
    assertEquals(res.status, 200);
    assertEquals((await res.json()).translation, CACHED_TRANSLATION);

    const translatorCalls = fetchStub.calls.filter((call) =>
      String(call.args[0]).includes("microsofttranslator")
    );
    assertEquals(translatorCalls.length, 1);
  });

  it("trims sourceSpeciesId before looking up the species", async () => {
    using fetchStub = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return json(CACHED_TRANSLATION);
        },
        "/rest/v1/plant_species": (req) => {
          assertStringIncludes(req.url, "sourceSpeciesId=eq.monstera-deliciosa");
          return json(SPECIES_ROW);
        },
        "microsofttranslator": () => azureResponse(AZURE_TRANSLATIONS),
      }),
    );

    const res = await handler(
      translateRequest({ sourceSpeciesId: "  monstera-deliciosa  ", locale: "it" }),
    );
    assertEquals(res.status, 200);
    assertEquals(fetchStub.calls.some((call) => String(call.args[0]).includes("/rest/v1/plant_species?")), true);
  });

  it("sends only non-null care fields to Azure and stores null for the rest", async () => {
    const partialSpecies = {
      id: 7,
      soil: "chunky mix",
      sunlight: null,
      watering: "weekly",
      fertilization: null,
      pruning: null,
    };
    const upserted = {
      soil: "miscela grossolana",
      sunlight: null,
      watering: "settimanale",
      fertilization: null,
      pruning: null,
    };

    using fetchStub = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return json(upserted);
        },
        "/rest/v1/plant_species": () => json(partialSpecies),
        "microsofttranslator": async (req) => {
          assertEquals(await req.json(), [
            { Text: "chunky mix" },
            { Text: "weekly" },
          ]);
          return azureResponse(["miscela grossolana", "settimanale"]);
        },
      }),
    );

    const res = await handler(translateRequest());
    assertEquals(res.status, 200);
    assertEquals((await res.json()).translation, upserted);
    assertEquals(
      fetchStub.calls.filter((call) => String(call.args[0]).includes("microsofttranslator")).length,
      1,
    );
  });

  it("skips Azure when every care field is empty and still upserts nulls", async () => {
    const emptySpecies = {
      id: 9,
      soil: null,
      sunlight: null,
      watering: null,
      fertilization: null,
      pruning: null,
    };
    const upserted = {
      soil: null,
      sunlight: null,
      watering: null,
      fertilization: null,
      pruning: null,
    };

    using fetchStub = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return json(upserted);
        },
        "/rest/v1/plant_species": () => json(emptySpecies),
        "microsofttranslator": () => {
          throw new Error("Azure Translator should not be called when there is nothing to translate");
        },
      }),
    );

    const res = await handler(translateRequest());
    assertEquals(res.status, 200);
    assertEquals((await res.json()).translation, upserted);
    for (const call of fetchStub.calls) {
      assertEquals(String(call.args[0]).includes("microsofttranslator"), false);
    }
  });

  it("stores an empty string when Azure omits a translation text", async () => {
    const upserted = {
      soil: "",
      sunlight: null,
      watering: null,
      fertilization: null,
      pruning: null,
    };

    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return json(upserted);
        },
        "/rest/v1/plant_species": () =>
          json({
            id: 3,
            soil: "mix",
            sunlight: null,
            watering: null,
            fertilization: null,
            pruning: null,
          }),
        "microsofttranslator": () => json([{ translations: [] }]),
      }),
    );

    const res = await handler(translateRequest());
    assertEquals(res.status, 200);
    assertEquals((await res.json()).translation.soil, "");
  });
});

describe("translation and save errors", () => {
  it("returns 502 when Azure Translator returns a non-ok status", async () => {
    using errorStub = stub(console, "error", () => {});
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": () => json(null),
        "/rest/v1/plant_species": () => json(SPECIES_ROW),
        "microsofttranslator": () => new Response("quota exceeded", { status: 429 }),
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 502);
    assertEquals((await res.json()).error, "Translation failed");
    assertSpyCalls(errorStub, 1);
    assertStringIncludes(String(errorStub.calls[0].args[1]), "Azure Translator error 429");
  });

  it("returns 502 when the Azure request rejects", async () => {
    using errorStub = stub(console, "error", () => {});
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": () => json(null),
        "/rest/v1/plant_species": () => json(SPECIES_ROW),
        "microsofttranslator": () => Promise.reject("network down"),
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 502);
    assertEquals((await res.json()).error, "Translation failed");
    assertEquals(errorStub.calls[0].args[1], "network down");
  });

  it("returns 500 when the translation upsert fails", async () => {
    using errorStub = stub(console, "error", () => {});
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return restError("duplicate key", 409);
        },
        "/rest/v1/plant_species": () => json(SPECIES_ROW),
        "microsofttranslator": () => azureResponse(AZURE_TRANSLATIONS),
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "Failed to save translation");
    assertSpyCalls(errorStub, 1);
    assertStringIncludes(String(errorStub.calls[0].args[0]), "upsert error");
  });

  it("returns 500 when the upsert returns no row", async () => {
    using errorStub = stub(console, "error", () => {});
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/plant_species_translations": (req) => {
          if (req.method === "GET") return json(null);
          return json(null);
        },
        "/rest/v1/plant_species": () => json(SPECIES_ROW),
        "microsofttranslator": () => azureResponse(AZURE_TRANSLATIONS),
      }),
    );
    const res = await handler(translateRequest());
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "Failed to save translation");
    assertSpyCalls(errorStub, 1);
  });
});
