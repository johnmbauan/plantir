import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LandingHousehold from "./LandingHousehold";

describe("LandingHousehold", () => {
  it("renders the household alert story", () => {
    renderWithProviders(<LandingHousehold />);

    expect(screen.getByRole("region", { name: "Alerts for the household" })).toBeInTheDocument();
    expect(screen.getByText("When you're away")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Someone at home can water for you." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Alerts can land in a household Telegram group — the chat you already use. Pothos is thirsty; whoever is home picks up the watering can.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Pothos needs water.")).toBeInTheDocument();
  });
});
