import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-006 · F_REQ-5 Committee Director has full event/task privileges", () => {
  it("can manage both events and tasks", () => {
    ws.actAs("Committee Director");
    const director = ws.data.getCurrentUser();

    expect(ws.data.hasPermission("manage_events", director)).toBe(true);
    expect(ws.data.hasPermission("manage_tasks", director)).toBe(true);
  });
});

describe("TC-005 · F_REQ-5 Committee Member can only update self-assigned tasks", () => {
  it("cannot manage events or tasks broadly", () => {
    ws.actAs("Committee Member");
    const member = ws.data.getCurrentUser();

    expect(ws.data.hasPermission("manage_events", member)).toBe(false);
    expect(ws.data.hasPermission("manage_tasks", member)).toBe(false);
    expect(ws.data.hasPermission("view_workspace", member)).toBe(true);
  });

  it("can update the status of a task assigned to them", async () => {
    ws.actAs("Committee Member");
    const task = ws.data.getTaskById("t5")!; // seeded assigned to m1, the fixed test identity
    expect(task.assigneeIds).toContain(ws.data.currentUserId);
    expect(ws.data.canUpdateTask(task)).toBe(true);

    await ws.app.moveTaskAction("t5", "DONE");

    expect(ws.data.getTaskById("t5")?.status).toBe("DONE");
  });

  it("cannot update the status of a task assigned to someone else", async () => {
    ws.actAs("Committee Member");
    const task = ws.data.getTaskById("t3")!; // seeded assigned to m2, not the current user
    expect(task.assigneeIds).not.toContain(ws.data.currentUserId);
    expect(ws.data.canUpdateTask(task)).toBe(false);

    await expect(ws.app.moveTaskAction("t3", "DONE")).rejects.toThrow();
    expect(ws.data.getTaskById("t3")?.status).not.toBe("DONE");
  });

  it("cannot fully edit even their own assigned task", async () => {
    ws.actAs("Committee Member");
    const result = await ws.tasks.updateTaskAction("t5", taskInput());

    expect(result).toEqual({ ok: false, message: "You do not have access to edit tasks." });
  });

  it("cannot create or delete events", async () => {
    ws.actAs("Committee Member");
    const before = ws.data.getEvents().length;
    const result = await ws.events.createEventAction({
      title: "Unauthorized Event",
      description: "",
      date: new Date(Date.now() + 86400000).toISOString(),
      location: "",
    });

    expect(result).toEqual({ ok: false, message: "You do not have access to create events." });
    expect(ws.data.getEvents()).toHaveLength(before);
  });
});
