import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-005 · F_REQ-2 Members update progress on their assigned tasks", () => {
  it("moves an own task through Not started, In progress and Completed", async () => {
    await ws.actAs("Committee Member");
    expect((await ws.data.getTaskById("t5"))?.status).toBe("TODO");

    for (const status of ["IN_PROGRESS", "DONE", "TODO"] as const) {
      const result = await ws.app.moveTaskAction("t5", status);
      expect(result).toEqual({ ok: true, data: { changed: true } });
      expect((await ws.data.getTaskById("t5"))?.status).toBe(status);
    }
  });

  it("logs each change with a timestamp and the acting user", async () => {
    await ws.actAs("Committee Member");
    const before = Date.now();

    await ws.app.moveTaskAction("t5", "IN_PROGRESS");
    await ws.app.moveTaskAction("t5", "DONE");

    const history = await ws.data.getStatusHistory("t5");
    expect(history.map((c) => [c.from, c.to])).toEqual([
      ["IN_PROGRESS", "DONE"],
      ["TODO", "IN_PROGRESS"],
    ]);
    for (const change of history) {
      expect(change.actorId).toBe(ws.me);
      const at = new Date(change.at).getTime();
      expect(at).toBeGreaterThanOrEqual(before);
      expect(at).toBeLessThanOrEqual(Date.now());
    }
  });

  it("does not log a move to the status the task already has", async () => {
    const before = (await ws.data.getStatusHistory("t5")).length;
    const version = await ws.data.getWorkspaceVersion();

    const result = await ws.app.moveTaskAction("t5", "TODO");

    expect(result).toEqual({ ok: true, data: { changed: false } });
    expect(await ws.data.getStatusHistory("t5")).toHaveLength(before);
    expect(await ws.data.getWorkspaceVersion()).toBe(version);
  });

  it("refuses a member moving someone else's task and logs nothing", async () => {
    await ws.actAs("Committee Member");
    const version = await ws.data.getWorkspaceVersion();

    const result = await ws.app.moveTaskAction("t3", "DONE");

    expect(result).toEqual({ ok: false, message: "You do not have access to update this task." });
    expect((await ws.data.getTaskById("t3"))?.status).toBe("TODO");
    expect(await ws.data.getStatusHistory("t3")).toEqual([]);
    expect(await ws.data.getWorkspaceVersion()).toBe(version);
  });

  it("lets a director move any task and records the director as the actor", async () => {
    await ws.actAs("Committee Director");

    await ws.app.moveTaskAction("t3", "IN_PROGRESS");

    const [latest] = await ws.data.getStatusHistory("t3");
    expect(latest).toMatchObject({ from: "TODO", to: "IN_PROGRESS", actorId: ws.me });
  });

  it("logs a status change made through the task edit form", async () => {
    const task = (await ws.data.getTaskById("t4"))!;
    await ws.tasks.updateTaskAction(
      "t4",
      taskInput({ title: task.title, dueDate: task.dueDate, assigneeIds: task.assigneeIds, status: "DONE" }),
    );

    const [latest] = await ws.data.getStatusHistory("t4");
    expect(latest).toMatchObject({ from: "TODO", to: "DONE", actorId: ws.me });
  });

  it("bumps the workspace version so other open pages refresh without a reload", async () => {
    const version = await ws.data.getWorkspaceVersion();

    await ws.app.moveTaskAction("t5", "IN_PROGRESS");

    expect(await ws.data.getWorkspaceVersion()).toBeGreaterThan(version);
  });

  it("rejects an unknown status", async () => {
    const result = await ws.app.moveTaskAction("t5", "ARCHIVED" as never);

    expect(result.ok).toBe(false);
    expect((await ws.data.getTaskById("t5"))?.status).toBe("TODO");
  });

  it("removes a task's history when its event is deleted", async () => {
    await ws.app.moveTaskAction("t11", "DONE");
    expect(await ws.data.getStatusHistory("t11")).not.toEqual([]);

    await ws.events.deleteEventAction("e1", { confirmSubtaskRemoval: true });

    expect(await ws.db.taskStatusChange.count({ where: { taskId: "t11" } })).toBe(0);
  });
});
