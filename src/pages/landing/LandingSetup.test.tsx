import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LandingSetup from "./LandingSetup";

describe("LandingSetup", () => {
  it("renders three numbered steps and the battery note", () => {
    renderWithProviders(<LandingSetup />);

    expect(screen.getByRole("region", { name: "How to get started" })).toBeInTheDocument();
    expect(screen.getByText("From box to reminder")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In the pot, on the Wi-Fi, done." })).toBeInTheDocument();
    expect(screen.getByText("Three steps. Then it watches the soil for you.")).toBeInTheDocument();

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Put it in the pot" })).toBeInTheDocument();
    expect(
      screen.getByText("Slide the probe into the soil until the sensor sits in place."),
    ).toBeInTheDocument();

    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connect it to Wi-Fi" })).toBeInTheDocument();
    expect(
      screen.getByText("It joins your network on its own. No extra box to plug in."),
    ).toBeInTheDocument();

    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Get the nudge" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "When watering would help, you hear about it in the app, by email, or on Telegram.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Rechargeable. A few charges a year is enough.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
