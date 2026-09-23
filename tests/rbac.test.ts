import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-005 · F_REQ-2.1 Committee Member limited to self-assigned tasks", () => {
  it("lets a Committee Member move the status of a task assigned to them", async () => {
    ws.actAs("Committee Member");
    await ws.board.moveTaskAction("t6", "IN_PROGRESS");

    expect(ws.data.getTaskById("t6")?.status).toBe("IN_PROGRESS");
  });

  it("blocks a Committee Member from moving a task not assigned to them", async () => {
    ws.actAs("Committee Member");

    await expect(ws.board.moveTaskAction("t3", "IN_PROGRESS")).rejects.toThrow(
      "You do not have permission to update tasks.",
    );
    expect(ws.data.getTaskById("t3")?.status).toBe("TODO");
  });

  it("lets a Committee Member edit the details of a task assigned to them", async () => {
    ws.actAs("Committee Member");
    const existing = ws.data.getTaskById("t6")!;

    const result = await ws.tasks.updateTaskAction(
      "t6",
      taskInput({
        title: existing.title,
        description: "Updated agenda notes.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: existing.dueDate,
        assigneeIds: existing.assigneeIds,
        eventId: existing.eventId,
      }),
    );

    expect(result.ok).toBe(true);
    expect(ws.data.getTaskById("t6")).toMatchObject({ description: "Updated agenda notes.", priority: "HIGH" });
  });

  it("returns 'You do not have access' when a Committee Member edits a task they aren't assigned to", async () => {
    ws.actAs("Committee Member");

    const result = await ws.tasks.updateTaskAction("t3", taskInput());

    expect(result).toEqual({ ok: false, message: "You do not have access to edit tasks." });
  });

  it("blocks a Committee Member from reassigning a self-assigned task to other members", async () => {
    ws.actAs("Committee Member");
    const existing = ws.data.getTaskById("t6")!;

    const result = await ws.tasks.updateTaskAction(
      "t6",
      taskInput({ assigneeIds: ["m1", "m2"], eventId: existing.eventId, dueDate: existing.dueDate }),
    );

    expect(result.ok).toBe(false);
    expect(ws.data.getTaskById("t6")?.assigneeIds).toEqual(existing.assigneeIds);
  });

  it("blocks a Committee Member from moving a self-assigned task to a different event", async () => {
    ws.actAs("Committee Member");
    const existing = ws.data.getTaskById("t6")!;

    const result = await ws.tasks.updateTaskAction(
      "t6",
      taskInput({ assigneeIds: existing.assigneeIds, eventId: "e1", dueDate: existing.dueDate }),
    );

    expect(result.ok).toBe(false);
    expect(ws.data.getTaskById("t6")?.eventId).toBe(existing.eventId);
  });

  it("still denies task creation to a Committee Member", async () => {
    ws.actAs("Committee Member");

    const result = await ws.tasks.createTaskAction(taskInput());

    expect(result).toEqual({ ok: false, message: "You do not have access to create tasks." });
  });

  it("gives a Committee Director full create/edit/manage privileges over tasks assigned to others", async () => {
    ws.actAs("Committee Director");

    const result = await ws.tasks.updateTaskAction("t3", taskInput({ assigneeIds: ["m1", "m4"] }));

    expect(result.ok).toBe(true);
    expect(ws.data.getTaskById("t3")?.assigneeIds).toEqual(["m1", "m4"]);
  });
});
