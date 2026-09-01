import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { CONTACT_EMAIL, contactMailto } from "@/constants/contact";
import LandingContact from "./LandingContact";

const MAILTO = contactMailto("I'd like a Plantir");

describe("LandingContact", () => {
  it("points visitors to the ciao mailbox", () => {
    renderWithProviders(<LandingContact />);

    expect(
      screen.getByRole("region", { name: "Email ciao@plantir.green" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Get in touch")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "If you want a sensor, write to us." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No form — just an email. Tell us about your plants."),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Want one? Write to us" })).toHaveAttribute(
      "href",
      MAILTO,
    );
    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute("href", MAILTO);
  });
});
