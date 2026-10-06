import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import MissionHelpButton from "./MissionHelpButton";

describe("MissionHelpButton", () => {
  it("exposes the help label and calls onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<MissionHelpButton onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "How expeditions work" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
