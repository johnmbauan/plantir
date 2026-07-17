import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { jsonResponse, optionsResponse } from "../../_shared/http.ts";

describe("jsonResponse", () => {
  describe("status code", () => {
    it("defaults to 200", () => {
      assertEquals(jsonResponse({ ok: true }, {}).status, 200);
    });

    it("uses the provided status code", () => {
      assertEquals(jsonResponse({}, {}, 201).status, 201);
      assertEquals(jsonResponse({}, {}, 400).status, 400);
      assertEquals(jsonResponse({}, {}, 500).status, 500);
    });
  });

  describe("Content-Type header", () => {
    it("is set to application/json", () => {
      assertEquals(jsonResponse({}, {}).headers.get("Content-Type"), "application/json");
    });

    it("can be overridden by a CORS header with the same name", () => {
      // corsOriginHeaders spreads after the default, so it wins
      const res = jsonResponse({}, { "Content-Type": "text/plain" });
      assertEquals(res.headers.get("Content-Type"), "text/plain");
    });
  });

  describe("body serialisation", () => {
    it("serialises an object to JSON", async () => {
      const body = { name: "monstera", count: 3, nested: { ok: true } };
      assertEquals(await jsonResponse(body, {}).json(), body);
    });

    it("serialises null", async () => {
      assertEquals(await jsonResponse(null, {}).json(), null);
    });

    it("serialises an array", async () => {
      assertEquals(await jsonResponse([1, 2, 3], {}).json(), [1, 2, 3]);
    });
  });

  describe("CORS headers", () => {
    it("includes a single CORS header", () => {
      const cors = { "Access-Control-Allow-Origin": "https://example.com" };
      assertEquals(
        jsonResponse({}, cors).headers.get("Access-Control-Allow-Origin"),
        "https://example.com",
      );
    });

    it("includes multiple CORS headers", () => {
      const cors = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Methods": "GET, POST",
      };
      const res = jsonResponse({}, cors);
      assertEquals(res.headers.get("Access-Control-Allow-Origin"), "https://example.com");
      assertEquals(res.headers.get("Access-Control-Allow-Methods"), "GET, POST");
    });
  });
});

describe("optionsResponse", () => {
  describe("status and body", () => {
    it("returns status 204", () => {
      const req = new Request("https://example.com", { method: "OPTIONS" });
      assertEquals(optionsResponse(req, {}).status, 204);
    });

    it("has an empty body", async () => {
      const req = new Request("https://example.com", { method: "OPTIONS" });
      assertEquals(await optionsResponse(req, {}).text(), "");
    });
  });

  describe("Access-Control-Allow-Headers", () => {
    it("echoes the Access-Control-Request-Headers from the request", () => {
      const req = new Request("https://example.com", {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Headers": "Content-Type, Authorization" },
      });
      assertEquals(
        optionsResponse(req, {}).headers.get("Access-Control-Allow-Headers"),
        "Content-Type, Authorization",
      );
    });

    it("falls back to an empty string when the request header is absent", () => {
      const req = new Request("https://example.com", { method: "OPTIONS" });
      assertEquals(optionsResponse(req, {}).headers.get("Access-Control-Allow-Headers"), "");
    });
  });

  describe("CORS origin headers", () => {
    it("includes the provided CORS headers in the response", () => {
      const req = new Request("https://example.com", { method: "OPTIONS" });
      const cors = {
        "Access-Control-Allow-Origin": "https://example.com",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      };
      const res = optionsResponse(req, cors);
      assertEquals(res.headers.get("Access-Control-Allow-Origin"), "https://example.com");
      assertEquals(res.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
    });
  });
});
