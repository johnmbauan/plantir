import "@/test/mocks/supabase";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import { buildSession } from "@/test/builders/session";
import { mockSession, mockOnAuthStateChange, resetSupabaseMocks } from "@/test/mocks/supabase";
import { GUEST_LOCALE_STORAGE_KEY } from "@/i18n/guestLocale";
import i18n from "@/i18n";
import LandingPage from "./LandingPage";

function renderLanding(route = "/") {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<div>Dashboard page</div>} />
      <Route path="/set-password" element={<div>Set password page</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { route },
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSession(null);
    localStorage.removeItem(GUEST_LOCALE_STORAGE_KEY);
    void i18n.changeLanguage("en");
  });

  it("renders nothing while the session is loading", async () => {
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    renderLanding();

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Care for them, without guessing.",
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Dashboard page")).not.toBeInTheDocument();
    });
  });

  it("renders the marketing page for visitors", async () => {
    renderLanding();

    expect(
      await screen.findByRole("heading", {
        name: "Care for them, without guessing.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stop guessing. A sensor in the soil reads moisture on its own Wi-Fi — no extra hub, no standing next to the plant. You get a nudge when it's time to water, even when you're away.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Three things that change how you care for them." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stop guessing when to water" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No hub. Just your Wi-Fi." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Indoors, balcony, or garden" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Someone at home can water for you." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Register, in the pot, done." })).toBeInTheDocument();
    expect(screen.getByText("Rechargeable. A few charges a year is enough.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "If you want a sensor, write to us." })).toBeInTheDocument();
    const photo = screen.getByRole("img", {
      name: "Example photo: a Plantir sensor in a houseplant pot",
    });
    expect(photo).toHaveAttribute("src", "/landing/sensor.jpg");
    expect(screen.getByRole("region", { name: "Why Plantir" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Alerts for the household" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "How to get started" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Register the sensor in the Plantir web app" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Put it in the pot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Get the nudge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "Write to us" })).not.toBeInTheDocument();
    const writeLinks = screen.getAllByRole("link", { name: "Want one? Write to us" });
    expect(writeLinks).toHaveLength(2);
    expect(writeLinks[0]).toHaveAttribute(
      "href",
      "mailto:ciao@plantir.green?subject=I'd%20like%20a%20Plantir",
    );
    expect(screen.getAllByRole("link", { name: "ciao@plantir.green" })).toHaveLength(2);
  });

  it("redirects signed-in users to the dashboard", async () => {
    mockSession(buildSession());
    renderLanding();

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("redirects invited users to set-password", async () => {
    mockSession(
      buildSession({
        user: {
          id: "user-1",
          email: "invited@example.com",
          user_metadata: { needs_password_setup: true },
        },
      }),
    );
    renderLanding();

    expect(await screen.findByText("Set password page")).toBeInTheDocument();
  });

  it("switches language and remembers the guest choice", async () => {
    const user = userEvent.setup();
    renderLanding();

    await screen.findByRole("heading", {
      name: "Care for them, without guessing.",
    });

    await user.click(screen.getByRole("radio", { name: "Italiano" }));

    expect(
      await screen.findByRole("heading", {
        name: "Te ne prendi cura, senza indovinare come e quando.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Un sensore nella terra misura l'umidità, senza una centralina, senza stare accanto alla pianta; serve solo il Wi-Fi. Ti avvisa quando è ora di annaffiare, anche se sei fuori casa.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ne vuoi uno? Scrivici" })).toHaveLength(2);
    expect(localStorage.getItem(GUEST_LOCALE_STORAGE_KEY)).toBe("it");

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(
      await screen.findByRole("heading", {
        name: "Care for them, without guessing.",
      }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(GUEST_LOCALE_STORAGE_KEY)).toBe("en");
  });
});
