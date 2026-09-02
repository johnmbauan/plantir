import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LandingNav from "./LandingNav";

describe("LandingNav", () => {
  it("renders home, language toggle, and sign-in", () => {
    renderWithProviders(<LandingNav />);

    expect(screen.getByRole("link", { name: "Plantir home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Write to us" })).not.toBeInTheDocument();
  });
});
