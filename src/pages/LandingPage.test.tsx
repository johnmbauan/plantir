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
          name: "Know when they need you.",
        }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Dashboard page")).not.toBeInTheDocument();
    });
  });

  it("renders the marketing page for visitors", async () => {
    renderLanding();

    expect(
      await screen.findByRole("heading", {
        name: "Know when they need you.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "See how the soil feels" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Alerts that wait for the rain" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A garden that grows with you" })).toBeInTheDocument();
    expect(screen.getByText("Keep caring for your plants to grow your garden.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "How Plantir cares with you" })).toBeInTheDocument();
    expect(screen.getByText("Ficus")).toBeInTheDocument();
    expect(screen.getByText("Basil")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
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
      name: "Know when they need you.",
    });

    await user.click(screen.getByRole("radio", { name: "Italiano" }));

    expect(
      await screen.findByRole("heading", {
        name: "Saprai quando hanno bisogno di te.",
      }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(GUEST_LOCALE_STORAGE_KEY)).toBe("it");

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(
      await screen.findByRole("heading", {
        name: "Know when they need you.",
      }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(GUEST_LOCALE_STORAGE_KEY)).toBe("en");
  });
});
