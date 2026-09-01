import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { emailSubject } from "../../alert-notifier/i18n.ts";
import { buildDigestEmail } from "../../alert-notifier/emailTemplate.ts";

describe("emailSubject", () => {
  it("uses the plant name for a single watering alert", () => {
    assertEquals(emailSubject("en", ["Basil"], []), "Basil needs water");
  });

  it("counts plants when several need water", () => {
    assertEquals(emailSubject("en", ["Basil", "Fern"], []), "2 plants need water");
  });

  it("uses the plant name for a single offline sensor", () => {
    assertEquals(emailSubject("en", [], ["Monstera"]), "Monstera is offline");
  });

  it("counts sensors when several are offline", () => {
    assertEquals(emailSubject("en", [], ["Monstera", "Fern"]), "2 sensors offline");
  });

  it("joins watering and offline sections with a middle dot", () => {
    assertEquals(
      emailSubject("en", ["Basil"], ["Monstera"]),
      "Basil needs water · Monstera is offline",
    );
  });

  it("uses Italian copy", () => {
    assertEquals(emailSubject("it", ["Basil"], []), "Basil ha bisogno di acqua");
    assertEquals(emailSubject("it", ["Basil", "Fern"], []), "2 piante hanno bisogno di acqua");
    assertEquals(emailSubject("it", [], ["Monstera"]), "Monstera è offline");
    assertEquals(emailSubject("it", [], ["Monstera", "Fern"]), "2 sensori offline");
  });
});

describe("buildDigestEmail", () => {
  it("renders a watering-only digest in English", () => {
    const email = buildDigestEmail({
      locale: "en",
      timezone: "UTC",
      appOrigin: "https://plantir.green",
      watering: [{ plantName: "Basil", humidity: 18, rainNote: "" }],
      offline: [],
    });

    assertEquals(email.subject, "Basil needs water");
    assertEquals(
      email.text,
      [
        "Hi,",
        "",
        "Here's today's plant status:",
        "",
        "These plants need water",
        "• Basil — Humidity reading: 18%",
        "",
        "Open dashboard: https://plantir.green/dashboard",
        "Manage email alerts in Settings: https://plantir.green/settings",
        "",
        "Plantir — home plant caring",
      ].join("\n"),
    );
    assertEquals(email.html.includes('lang="en"'), true);
    assertEquals(email.html.includes("Basil"), true);
    assertEquals(email.html.includes("Humidity reading: 18%"), true);
    assertEquals(email.html.includes("These sensors are offline"), false);
    assertEquals(email.html.includes("https://plantir.green/dashboard"), true);
    assertEquals(email.html.includes("https://plantir.green/settings"), true);
    assertEquals(email.html.includes("https://plantir.green/logo.png"), true);
  });

  it("includes rain notes and last-seen times when both sections are present", () => {
    const email = buildDigestEmail({
      locale: "en",
      timezone: "UTC",
      appOrigin: "https://plantir.green",
      watering: [{
        plantName: "Basil",
        humidity: 12,
        rainNote: "Rain is expected today — watering may not be needed.",
      }],
      offline: [{ plantName: "Monstera", lastSeenAt: null }],
    });

    assertEquals(email.subject, "Basil needs water · Monstera is offline");
    assertEquals(
      email.text.includes(
        "• Basil — Humidity reading: 12% — Rain is expected today — watering may not be needed.",
      ),
      true,
    );
    assertEquals(email.text.includes("These sensors are offline"), true);
    assertEquals(email.text.includes("• Monstera (never seen)"), true);
  });

  it("escapes HTML in plant names", () => {
    const email = buildDigestEmail({
      locale: "en",
      timezone: "UTC",
      appOrigin: "https://plantir.green",
      watering: [{ plantName: "A <b>B</b> & C", humidity: 10, rainNote: "" }],
      offline: [],
    });

    assertEquals(email.html.includes("A &lt;b&gt;B&lt;/b&gt; &amp; C"), true);
    assertEquals(email.html.includes("A <b>B</b>"), false);
    assertEquals(email.text.includes("A <b>B</b> & C"), true);
  });

  it("renders an Italian offline-only digest", () => {
    const email = buildDigestEmail({
      locale: "it",
      timezone: "UTC",
      appOrigin: "https://plantir.green",
      watering: [],
      offline: [{ plantName: "Monstera", lastSeenAt: null }],
    });

    assertEquals(email.subject, "Monstera è offline");
    assertEquals(email.html.includes('lang="it"'), true);
    assertEquals(email.text.includes("Ciao,"), true);
    assertEquals(email.text.includes("Questi sensori sono offline"), true);
    assertEquals(email.text.includes("• Monstera (mai rilevato)"), true);
    assertEquals(email.html.includes("Queste piante hanno bisogno di acqua"), false);
  });
});
