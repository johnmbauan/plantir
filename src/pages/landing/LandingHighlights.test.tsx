import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LandingHighlights from "./LandingHighlights";

describe("LandingHighlights", () => {
  it("renders the three benefits", () => {
    renderWithProviders(<LandingHighlights />);

    expect(screen.getByRole("region", { name: "Why Plantir" })).toBeInTheDocument();
    expect(screen.getByText("Why it helps")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Three things that change how you care for them." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stop guessing when to water" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The probe reads the soil, so you water only when the plant actually needs it — not when the surface looks dry.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No hub. Just your Wi-Fi." })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Each sensor connects on its own. One plant or a whole windowsill. It keeps working when you're not in the room — and when you're not at home.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Indoors, balcony, or garden" })).toBeInTheDocument();
    expect(
      screen.getByText("Use it in the house or outside. When rain is coming, outdoor plants can wait."),
    ).toBeInTheDocument();
  });
});
