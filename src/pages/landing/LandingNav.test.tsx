import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { contactMailto } from "@/constants/contact";
import LandingNav from "./LandingNav";

describe("LandingNav", () => {
  it("keeps sign-in secondary and write-to-us as the main action", () => {
    renderWithProviders(<LandingNav />);

    expect(screen.getByRole("link", { name: "Plantir home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Write to us" })).toHaveAttribute(
      "href",
      contactMailto("I'd like a Plantir"),
    );
    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument();
  });
});
