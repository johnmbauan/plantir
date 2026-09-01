import { describe, it, expect } from "vitest";
import { CONTACT_EMAIL, contactMailto } from "./contact";

describe("contact", () => {
  it("uses the public ciao mailbox", () => {
    expect(CONTACT_EMAIL).toBe("ciao@plantir.green");
  });

  it("builds a mailto link with an encoded subject", () => {
    expect(contactMailto("I'd like a Plantir")).toBe(
      "mailto:ciao@plantir.green?subject=I'd%20like%20a%20Plantir",
    );
    expect(contactMailto("Vorrei un Plantir")).toBe(
      "mailto:ciao@plantir.green?subject=Vorrei%20un%20Plantir",
    );
  });
});
