import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LandingDevicePhoto from "./LandingDevicePhoto";

describe("LandingDevicePhoto", () => {
  it("renders the example sensor photo", () => {
    renderWithProviders(<LandingDevicePhoto />);

    const photo = screen.getByRole("img", {
      name: "Example photo: a Plantir sensor in a houseplant pot",
    });
    expect(photo).toHaveAttribute("src", "/landing/sensor.jpg");
    expect(photo).toHaveAttribute("width", "1200");
    expect(photo).toHaveAttribute("height", "800");
    expect(screen.getByText("Pothos needs water")).toBeInTheDocument();
  });
});
