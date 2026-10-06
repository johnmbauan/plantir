import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import MissionHelpModal from "./MissionHelpModal";

describe("MissionHelpModal", () => {
  it("walks through the introduction and starts the first mission", async () => {
    const onStartFirst = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <MissionHelpModal opened mode="intro" onClose={vi.fn()} onStartFirst={onStartFirst} />,
    );
    expect(screen.getByText("Send a team")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("One expedition at a time")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("The bond")).toBeInTheDocument();
    expect(screen.getByText("Each creature has a bond with you: a friendship with five levels. Tap the creature in the garden to open its card. The bond is at the top, under the name. It grows when they return from an expedition, and a little when you look after your plants. It does not drop if you stay away.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("The journal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send the first expedition" }));
    expect(onStartFirst).toHaveBeenCalled();
  });

  it("can skip the introduction", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <MissionHelpModal opened mode="intro" onClose={onClose} onStartFirst={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes help without starting a mission", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<MissionHelpModal opened mode="help" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(onClose).toHaveBeenCalled();
  });
});
