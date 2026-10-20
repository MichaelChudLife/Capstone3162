import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import UserMenu, { type AccountSummary } from "@/components/UserMenu";

const logoutAction = vi.fn();

vi.mock("@/app/login/actions", () => ({ logoutAction: () => logoutAction() }));
vi.mock("next/link", () => ({
  default: ({ href, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

const user: AccountSummary = {
  name: "Test Member",
  initials: "TM",
  color: "#0ea5e9",
  email: "newmember@cca.org.au",
  role: "General Member",
  accessRole: "Committee Member",
};

function trigger() {
  return screen.getByRole("button", { name: "Account menu for Test Member" });
}

beforeEach(() => {
  logoutAction.mockReset();
});

afterEach(cleanup);

describe("F_REQ-8 · account menu", () => {
  it("shows your name on a closed account button", () => {
    render(<UserMenu user={user} />);

    expect(trigger()).toHaveProperty("textContent", "TMTest Member");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("newmember@cca.org.au")).toBeNull();
  });

  it("opens with your details and the standard account options", () => {
    render(<UserMenu user={user} />);

    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("newmember@cca.org.au")).toBeTruthy();
    expect(screen.getByText("Committee Member")).toBeTruthy();
    expect(screen.getByText("General Member")).toBeTruthy();
    expect(screen.getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["My tasks", "/"],
      ["My reminders", "/reminders"],
      ["Team members", "/members"],
    ]);
    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });

  it("closes on Escape and hands focus back to the button", () => {
    render(<UserMenu user={user} />);
    fireEvent.click(trigger());

    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes once an option is chosen", () => {
    render(<UserMenu user={user} />);
    fireEvent.click(trigger());

    fireEvent.click(screen.getByRole("link", { name: "My reminders" }));

    expect(screen.queryByRole("link", { name: "My reminders" })).toBeNull();
  });

  it("logs you out and shows progress while it happens", async () => {
    logoutAction.mockReturnValue(new Promise(() => {}));
    render(<UserMenu user={user} />);
    fireEvent.click(trigger());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    });

    expect(logoutAction).toHaveBeenCalledTimes(1);
    const button = screen.getByRole("button", { name: "Logging out…" });
    expect(button).toHaveProperty("disabled", true);
  });

  it("shows only the avatar in the sidebar and opens the same options", () => {
    render(<UserMenu user={user} placement="sidebar" />);

    expect(trigger()).toHaveProperty("textContent", "TM");
    expect(trigger().getAttribute("title")).toBe("Test Member · Committee Member");

    fireEvent.click(trigger());

    expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  });
});
