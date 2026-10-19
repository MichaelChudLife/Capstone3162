import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StatusControl from "@/components/StatusControl";

const refresh = vi.fn();
const moveTaskAction = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("@/app/actions", () => ({ moveTaskAction: (...args: unknown[]) => moveTaskAction(...args) }));

beforeEach(() => {
  refresh.mockReset();
  moveTaskAction.mockReset();
});

afterEach(cleanup);

function pressed() {
  return screen.getAllByRole("button").filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
}

describe("TC-005 · F_REQ-2 status control", () => {
  it("shows the three states with the current one selected", () => {
    render(<StatusControl taskId="t5" status="TODO" />);

    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Not started", "In progress", "Completed"]);
    expect(pressed()).toEqual(["Not started"]);
  });

  it("sends the move and refreshes once it succeeds", async () => {
    moveTaskAction.mockResolvedValue({ ok: true, data: { changed: true } });
    render(<StatusControl taskId="t5" status="TODO" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    });

    expect(moveTaskAction).toHaveBeenCalledWith("t5", "DONE");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the access-denied message and keeps the original status", async () => {
    moveTaskAction.mockResolvedValue({ ok: false, message: "You do not have access to update this task." });
    render(<StatusControl taskId="t3" status="TODO" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "In progress" }));
    });

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "You do not have access to update this task.");
    expect(pressed()).toEqual(["Not started"]);
    expect(refresh).not.toHaveBeenCalled();
  });
});
