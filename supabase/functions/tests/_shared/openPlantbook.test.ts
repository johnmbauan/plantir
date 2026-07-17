import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { assertSpyCalls, returnsNext, stub } from "jsr:@std/testing/mock";
import type { Stub } from "jsr:@std/testing/mock";
import {
  fetchOpenPlantbookJson,
  openPlantbookHeaders,
  OPEN_PLANTBOOK_BASE_URL,
  OPEN_PLANTBOOK_SOURCE,
} from "../../_shared/openPlantbook.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("OPEN_PLANTBOOK_BASE_URL", () => {
  it("points to the v1 API", () => {
    assertEquals(OPEN_PLANTBOOK_BASE_URL, "https://open.plantbook.io/api/v1");
  });
});

describe("OPEN_PLANTBOOK_SOURCE", () => {
  it("is 'openplantbook'", () => {
    assertEquals(OPEN_PLANTBOOK_SOURCE, "openplantbook");
  });
});

// ---------------------------------------------------------------------------
// openPlantbookHeaders
// ---------------------------------------------------------------------------

describe("openPlantbookHeaders", () => {
  it("sets Accept: application/json", () => {
    assertEquals(
      (openPlantbookHeaders("key") as Record<string, string>)["Accept"],
      "application/json",
    );
  });

  it("sets Authorization using the Token scheme", () => {
    assertEquals(
      (openPlantbookHeaders("secret") as Record<string, string>)["Authorization"],
      "Token secret",
    );
  });

  it("sets the apikey header", () => {
    assertEquals((openPlantbookHeaders("secret") as Record<string, string>)["apikey"], "secret");
  });

  it("sets the x-api-key header", () => {
    assertEquals(
      (openPlantbookHeaders("secret") as Record<string, string>)["x-api-key"],
      "secret",
    );
  });

  it("uses the same key value across all auth headers", () => {
    const key = "my-api-key-123";
    const h = openPlantbookHeaders(key) as Record<string, string>;
    assertEquals(h["Authorization"], `Token ${key}`);
    assertEquals(h["apikey"], key);
    assertEquals(h["x-api-key"], key);
  });
});

// ---------------------------------------------------------------------------
// fetchOpenPlantbookJson
// ---------------------------------------------------------------------------

describe("fetchOpenPlantbookJson", () => {
  let fetchStub: Stub;

  afterEach(() => {
    fetchStub?.restore();
  });

  describe("successful responses", () => {
    it("returns the parsed JSON body on a 200 response", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          Promise.resolve(new Response(JSON.stringify({ pid: "monstera" }), { status: 200 })),
        ]),
      );

      const result = await fetchOpenPlantbookJson("https://example.com", 5_000, "key");
      assertEquals(result, { pid: "monstera" });
      assertSpyCalls(fetchStub, 1);
    });

    it("passes the api key in the Authorization header", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          Promise.resolve(new Response(JSON.stringify({}), { status: 200 })),
        ]),
      );

      await fetchOpenPlantbookJson("https://example.com", 5_000, "my-secret");
      const capturedInit = fetchStub.calls[0].args[1] as RequestInit;
      assertEquals(
        (capturedInit.headers as Record<string, string>)["Authorization"],
        "Token my-secret",
      );
    });
  });

  describe("error responses", () => {
    it("throws a descriptive error for a 404", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([Promise.resolve(new Response("Not found", { status: 404 }))]),
      );

      await assertRejects(
        () => fetchOpenPlantbookJson("https://example.com", 5_000, "key"),
        Error,
        "OpenPlantbook request failed (404)",
      );
      assertSpyCalls(fetchStub, 1);
    });

    it("throws a descriptive error for a 401", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([Promise.resolve(new Response("Unauthorized", { status: 401 }))]),
      );

      await assertRejects(
        () => fetchOpenPlantbookJson("https://example.com", 5_000, "key"),
        Error,
        "OpenPlantbook request failed (401)",
      );
    });

    it("throws when the response body is not valid JSON", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([Promise.resolve(new Response("not-json", { status: 200 }))]),
      );

      await assertRejects(
        () => fetchOpenPlantbookJson("https://example.com", 5_000, "key"),
        Error,
        "OpenPlantbook returned invalid JSON",
      );
    });
  });

  describe("retry logic", () => {
    it("retries once on 429 and succeeds on the second attempt", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          Promise.resolve(new Response("Too many requests", { status: 429 })),
          Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
        ]),
      );

      const result = await fetchOpenPlantbookJson("https://example.com", 5_000, "key");
      assertEquals(result, { ok: true });
      assertSpyCalls(fetchStub, 2);
    });

    it("retries once on 500 and succeeds on the second attempt", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          Promise.resolve(new Response("Internal Server Error", { status: 500 })),
          Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
        ]),
      );

      const result = await fetchOpenPlantbookJson("https://example.com", 5_000, "key");
      assertEquals(result, { ok: true });
      assertSpyCalls(fetchStub, 2);
    });

    it("retries once on 503 and throws when the retry also fails", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          Promise.resolve(new Response("Service unavailable", { status: 503 })),
          Promise.resolve(new Response("Service unavailable", { status: 503 })),
        ]),
      );

      await assertRejects(
        () => fetchOpenPlantbookJson("https://example.com", 5_000, "key"),
        Error,
        "OpenPlantbook request failed (503)",
      );
      assertSpyCalls(fetchStub, 2);
    });

    it("does not retry on 400 (client error)", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([Promise.resolve(new Response("Bad request", { status: 400 }))]),
      );

      await assertRejects(
        () => fetchOpenPlantbookJson("https://example.com", 5_000, "key"),
        Error,
        "OpenPlantbook request failed (400)",
      );
      assertSpyCalls(fetchStub, 1);
    });

    it("does not retry on 401 (client error)", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([Promise.resolve(new Response("Unauthorized", { status: 401 }))]),
      );

      await assertRejects(
        () => fetchOpenPlantbookJson("https://example.com", 5_000, "key"),
        Error,
      );
      assertSpyCalls(fetchStub, 1);
    });
  });
});
