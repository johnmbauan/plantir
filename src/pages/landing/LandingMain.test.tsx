import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { CONTACT_EMAIL, contactMailto } from "@/constants/contact";
import LandingMain from "./LandingMain";

const MAILTO = contactMailto("I'd like a Plantir");

describe("LandingMain", () => {
  it("renders the hero, marketing sections, and footer", () => {
    renderWithProviders(<LandingMain />);

    expect(screen.getByRole("heading", { name: "Care for them, without guessing." })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stop guessing. A sensor in the soil reads moisture on its own Wi-Fi — no extra hub, no standing next to the plant. You get a nudge when it's time to water, even when you're away.",
      ),
    ).toBeInTheDocument();

    const writeLinks = screen.getAllByRole("link", { name: "Want one? Write to us" });
    expect(writeLinks).toHaveLength(2);
    expect(writeLinks[0]).toHaveAttribute("href", MAILTO);
    expect(writeLinks[1]).toHaveAttribute("href", MAILTO);

    const emailLinks = screen.getAllByRole("link", { name: CONTACT_EMAIL });
    expect(emailLinks).toHaveLength(2);
    expect(emailLinks[0]).toHaveAttribute("href", MAILTO);

    expect(screen.getByRole("region", { name: "Why Plantir" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Alerts for the household" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "How to get started" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Email ciao@plantir.green" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("brand-logo-mark")).toHaveLength(2);
  });
});
