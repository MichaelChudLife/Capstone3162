import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace, hoursFromNow, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

async function createOk(overrides: Parameters<typeof taskInput>[0] = {}) {
  const result = await ws.tasks.createTaskAction(taskInput(overrides));
  if (!result.ok) throw new Error(result.message);
  return ws.data.getTaskById(result.data.id)!;
}

describe("TC-003 · F_REQ-1.3 Task assigned to one or more members", () => {
  it("stores every selected assignee on the task", async () => {
    const task = await createOk({ assigneeIds: ["m2", "m3", "m5"] });

    expect(task.assigneeIds).toEqual(["m2", "m3", "m5"]);
    expect(ws.data.getMembersByIds(task.assigneeIds).map((m) => m.name)).toEqual([
      "Yahya Al-Rawi",
      "Nathanael Khor",
      "Sener Sethi",
    ]);
  });

  it("permits an unassigned task", async () => {
    const task = await createOk({ assigneeIds: [] });

    expect(task.assigneeIds).toEqual([]);
  });

  it("collapses duplicate assignees", async () => {
    const task = await createOk({ assigneeIds: ["m2", "m2", "m4"] });

    expect(task.assigneeIds).toEqual(["m2", "m4"]);
  });

  it("rejects an assignee who is not a member", async () => {
    const result = await ws.tasks.createTaskAction(taskInput({ assigneeIds: ["m2", "ghost"] }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.assigneeIds).toBeDefined();
  });

  it("reassigns a task to a different set of members", async () => {
    const task = await createOk({ assigneeIds: ["m2"] });
    const result = await ws.tasks.updateTaskAction(task.id, taskInput({ assigneeIds: ["m1", "m4"] }));

    expect(result.ok).toBe(true);
    expect(ws.data.getTaskById(task.id)?.assigneeIds).toEqual(["m1", "m4"]);
  });
});

describe("TC-004 · F_REQ-1.4 Description, deadline and priority per task", () => {
  it("saves description, deadline, priority and status", async () => {
    const dueDate = hoursFromNow(48);
    const task = await createOk({ description: "Bring the banner.", dueDate, priority: "HIGH", status: "IN_PROGRESS" });

    expect(task).toMatchObject({ description: "Bring the banner.", dueDate, priority: "HIGH", status: "IN_PROGRESS" });
  });

  it("rejects a deadline in the past", async () => {
    const before = ws.data.getTasks().length;
    const result = await ws.tasks.createTaskAction(taskInput({ dueDate: hoursFromNow(-1) }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.dueDate).toBe("Deadline cannot be in the past.");
    expect(ws.data.getTasks()).toHaveLength(before);
  });

  it("permits a task with no deadline", async () => {
    const task = await createOk({ dueDate: null });

    expect(task.dueDate).toBeNull();
  });

  it("lets an overdue task be edited if its deadline is left unchanged", async () => {
    const overdue = ws.data.getTaskById("t1")!;
    expect(new Date(overdue.dueDate!).getTime()).toBeLessThan(Date.now());

    const result = await ws.tasks.updateTaskAction(
      "t1",
      taskInput({ title: overdue.title, dueDate: overdue.dueDate, priority: "LOW", assigneeIds: overdue.assigneeIds }),
    );

    expect(result.ok).toBe(true);
    expect(ws.data.getTaskById("t1")?.priority).toBe("LOW");
  });

  it("rejects moving an existing deadline into the past", async () => {
    const task = await createOk();
    const result = await ws.tasks.updateTaskAction(task.id, taskInput({ dueDate: hoursFromNow(-24) }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.dueDate).toBe("Deadline cannot be in the past.");
  });

  it("rejects a task without a title", async () => {
    const result = await ws.tasks.createTaskAction(taskInput({ title: "  " }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.title).toBeDefined();
  });

  it("returns 'You do not have access' when an Events Director edits a task", async () => {
    ws.actAs("Events Director");
    const result = await ws.tasks.updateTaskAction("t3", taskInput());

    expect(result).toEqual({ ok: false, message: "You do not have access to edit tasks." });
  });
});
