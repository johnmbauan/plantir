import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LandingSetup from "./LandingSetup";

describe("LandingSetup", () => {
  it("renders three numbered steps and the battery note", () => {
    renderWithProviders(<LandingSetup />);

    expect(screen.getByRole("region", { name: "How to get started" })).toBeInTheDocument();
    expect(screen.getByText("From box to reminder")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Register, in the pot, done." })).toBeInTheDocument();
    expect(screen.getByText("Three steps. Then it watches the soil for you.")).toBeInTheDocument();

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Register the sensor in the Plantir web app" })).toBeInTheDocument();
    expect(
      screen.getByText("Open Plantir and add the new sensor. It takes about three minutes."),
    ).toBeInTheDocument();

    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Put it in the pot" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Slide the probe in next to the plant, all the way into the soil.",
      ),
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
