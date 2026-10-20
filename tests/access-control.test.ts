import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-006 · F_REQ-5 Committee Director has full event/task privileges", () => {
  it("can manage both events and tasks", async () => {
    await ws.actAs("Committee Director");
    const director = await ws.user();

    expect(ws.data.hasPermission("manage_events", director)).toBe(true);
    expect(ws.data.hasPermission("manage_tasks", director)).toBe(true);
  });
});

describe("TC-005 · F_REQ-5 Committee Member can only update self-assigned tasks", () => {
  it("cannot manage events or tasks broadly", async () => {
    await ws.actAs("Committee Member");
    const member = await ws.user();

    expect(ws.data.hasPermission("manage_events", member)).toBe(false);
    expect(ws.data.hasPermission("manage_tasks", member)).toBe(false);
    expect(ws.data.hasPermission("view_workspace", member)).toBe(true);
  });

  it("can update the status of a task assigned to them", async () => {
    await ws.actAs("Committee Member");
    const task = (await ws.data.getTaskById("t5"))!; // seeded assigned to m1, the signed-in test member
    expect(task.assigneeIds).toContain(ws.me);
    expect(ws.data.canUpdateTask(task, await ws.user())).toBe(true);

    await ws.app.moveTaskAction("t5", "DONE");

    expect((await ws.data.getTaskById("t5"))?.status).toBe("DONE");
  });

  it("assignees without update_own_tasks can still move their assigned task", async () => {
    ws.signInAs("m2");
    (await ws.data.updateMemberAccessRole("m2", "Events Director"));
    const task = (await ws.data.getTaskById("t3"))!;
    expect(task.assigneeIds).toContain("m2");
    expect(ws.data.hasPermission("update_own_tasks", await ws.user())).toBe(false);
    expect(ws.data.canUpdateTask(task, await ws.user())).toBe(true);

    await ws.app.moveTaskAction("t3", "IN_PROGRESS");

    expect((await ws.data.getTaskById("t3"))?.status).toBe("IN_PROGRESS");
  });

  it("cannot update the status of a task assigned to someone else", async () => {
    await ws.actAs("Committee Member");
    const task = (await ws.data.getTaskById("t3"))!; // seeded assigned to m2, not the current user
    expect(task.assigneeIds).not.toContain(ws.me);
    expect(ws.data.canUpdateTask(task, await ws.user())).toBe(false);

    await expect(ws.app.moveTaskAction("t3", "DONE")).resolves.toEqual({
      ok: false,
      message: "You do not have access to update this task.",
    });
    expect((await ws.data.getTaskById("t3"))?.status).not.toBe("DONE");
  });

  it("cannot fully edit even their own assigned task", async () => {
    await ws.actAs("Committee Member");
    const result = await ws.tasks.updateTaskAction("t5", taskInput());

    expect(result).toEqual({ ok: false, message: "You do not have access to edit tasks." });
  });

  it("cannot create or delete events", async () => {
    await ws.actAs("Committee Member");
    const before = (await ws.data.getEvents()).length;
    const result = await ws.events.createEventAction({
      title: "Unauthorized Event",
      description: "",
      date: new Date(Date.now() + 86400000).toISOString(),
      location: "",
    });

    expect(result).toEqual({ ok: false, message: "You do not have access to create events." });
    expect(await ws.data.getEvents()).toHaveLength(before);
  });
});
