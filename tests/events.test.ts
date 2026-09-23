import { beforeEach, describe, expect, it } from "vitest";
import { eventInput, freshWorkspace, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-001 · F_REQ-1.1 Committee Director creates an event", () => {
  it("adds the event to the club event list immediately", async () => {
    ws.actAs("Committee Director");
    const result = await ws.events.createEventAction(eventInput({ title: "  Careers Panel  " }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const listed = ws.data.getEvents().find((e) => e.id === result.data.id);
    expect(listed).toMatchObject({ title: "Careers Panel", description: "Alumni panel on graduate roles." });
  });

  it("permits an event with no tasks", async () => {
    const result = await ws.events.createEventAction(eventInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ws.data.getTasksForEvent(result.data.id)).toEqual([]);
  });

  it("rejects an event without a title or date", async () => {
    const before = ws.data.getEvents().length;
    const result = await ws.events.createEventAction(eventInput({ title: "   ", date: "" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toMatchObject({ title: expect.any(String), date: expect.any(String) });
    expect(ws.data.getEvents()).toHaveLength(before);
  });

  it("returns 'You do not have access' for a Committee Member", async () => {
    ws.actAs("Committee Member");
    const before = ws.data.getEvents().length;
    const result = await ws.events.createEventAction(eventInput());

    expect(result).toEqual({ ok: false, message: "You do not have access to create events." });
    expect(ws.data.getEvents()).toHaveLength(before);
  });

  it("lets a director edit an existing event", async () => {
    const result = await ws.events.updateEventAction("e2", eventInput({ title: "Welcome BBQ (rain venue)" }));

    expect(result.ok).toBe(true);
    expect(ws.data.getEventById("e2")?.title).toBe("Welcome BBQ (rain venue)");
  });
});

describe("TC-002 · F_REQ-1.2 Event decomposed into sub-tasks", () => {
  it("nests sub-tasks under their parent event", async () => {
    const created = await ws.events.createEventAction(eventInput());
    if (!created.ok) throw new Error(created.message);
    const eventId = created.data.id;

    await ws.tasks.createTaskAction(taskInput({ title: "Book the room", eventId }));
    await ws.tasks.createTaskAction(taskInput({ title: "Invite alumni", eventId, priority: "HIGH" }));

    const subTasks = ws.data.getTasksForEvent(eventId);
    expect(subTasks.map((t) => t.title).sort()).toEqual(["Book the room", "Invite alumni"]);
    expect(subTasks.every((t) => t.eventId === eventId)).toBe(true);
  });

  it("orders sub-tasks by deadline, then priority", () => {
    const subTasks = ws.data.getTasksForEvent("e1");
    for (let i = 1; i < subTasks.length; i += 1) {
      expect(ws.data.compareByDeadlineThenPriority(subTasks[i - 1], subTasks[i])).toBeLessThanOrEqual(0);
    }
  });

  it("refuses to delete an event with sub-tasks until removal is confirmed", async () => {
    const subTaskCount = ws.data.getTasksForEvent("e1").length;
    expect(subTaskCount).toBeGreaterThan(0);

    const result = await ws.events.deleteEventAction("e1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain(`${subTaskCount} sub-tasks`);
    expect(ws.data.getEventById("e1")).toBeDefined();
    expect(ws.data.getTasksForEvent("e1")).toHaveLength(subTaskCount);
  });

  it("removes the event and only its sub-tasks once confirmed", async () => {
    const subTaskIds = ws.data.getTasksForEvent("e1").map((t) => t.id);
    const otherTaskIds = ws.data.getTasks().filter((t) => t.eventId !== "e1").map((t) => t.id);

    const result = await ws.events.deleteEventAction("e1", { confirmSubtaskRemoval: true });

    expect(result).toEqual({ ok: true, data: { removedTaskCount: subTaskIds.length } });
    expect(ws.data.getEventById("e1")).toBeUndefined();
    expect(ws.data.getTasks().map((t) => t.id).sort()).toEqual(otherTaskIds.sort());
  });

  it("deletes an event with no sub-tasks without extra confirmation", async () => {
    const created = await ws.events.createEventAction(eventInput());
    if (!created.ok) throw new Error(created.message);

    const result = await ws.events.deleteEventAction(created.data.id);

    expect(result).toEqual({ ok: true, data: { removedTaskCount: 0 } });
  });

  it("returns 'You do not have access' when a Committee Member deletes an event", async () => {
    ws.actAs("Committee Member");
    const result = await ws.events.deleteEventAction("e2", { confirmSubtaskRemoval: true });

    expect(result).toEqual({ ok: false, message: "You do not have access to delete events." });
    expect(ws.data.getEventById("e2")).toBeDefined();
  });
});
