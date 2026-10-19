import { beforeEach, describe, expect, it } from "vitest";
import { reminderKindFor, reminderLabel } from "@/lib/reminder-rules";
import { freshWorkspace, hoursFromNow, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

const HOUR = 3600000;
const NOW = new Date("2026-10-20T09:00:00.000Z");
const at = (hours: number) => new Date(NOW.getTime() + hours * HOUR).toISOString();
const later = (hours: number) => new Date(Date.now() + hours * HOUR);

beforeEach(async () => {
  ws = await freshWorkspace();
});

async function createTask(overrides: Parameters<typeof taskInput>[0]) {
  const result = await ws.tasks.createTaskAction(taskInput(overrides));
  if (!result.ok) throw new Error(result.message);
  return result.data.id;
}

function remindersFor(memberId: string, now: Date, taskId: string) {
  return ws.data.getRemindersForMember(memberId, now).filter((r) => r.task.id === taskId);
}

describe("TC-006 · F_REQ-3 48-hour and overdue rule", () => {
  it.each([
    [49, null],
    [48.01, null],
    [48, "due_soon"],
    [20, "due_soon"],
    [0.02, "due_soon"],
    [0, "overdue"],
    [-3, "overdue"],
  ])("a deadline %s hours away is %s", (hours, expected) => {
    expect(reminderKindFor({ status: "TODO", dueDate: at(hours as number) }, NOW)).toBe(expected);
  });

  it("never reminds about completed tasks or tasks without a deadline", () => {
    expect(reminderKindFor({ status: "DONE", dueDate: at(-5) }, NOW)).toBeNull();
    expect(reminderKindFor({ status: "IN_PROGRESS", dueDate: null }, NOW)).toBeNull();
  });

  it("labels the time left or overdue", () => {
    expect(reminderLabel(at(20), NOW)).toBe("Due in 20 hours");
    expect(reminderLabel(at(0.5), NOW)).toBe("Due in 30 minutes");
    expect(reminderLabel(at(-3), NOW)).toBe("Overdue by 3 hours");
    expect(reminderLabel(at(-72), NOW)).toBe("Overdue by 3 days");
  });
});

describe("TC-006 · F_REQ-3 In-app reminders fire for assigned members", () => {
  it("fires one reminder per assignee when a deadline is within 48 hours", async () => {
    const id = await createTask({ dueDate: hoursFromNow(20), assigneeIds: ["m2", "m3"] });
    const now = new Date();

    expect(remindersFor("m2", now, id).map((r) => r.reminder.kind)).toEqual(["due_soon"]);
    expect(remindersFor("m3", now, id).map((r) => r.reminder.kind)).toEqual(["due_soon"]);
    expect(remindersFor("m4", now, id)).toEqual([]);
  });

  it("fires each reminder only once", async () => {
    const id = await createTask({ dueDate: hoursFromNow(20), assigneeIds: ["m2"] });

    ws.data.syncReminders(new Date());
    const fired = ws.data.syncReminders(new Date());

    expect(fired).toBe(0);
    expect(ws.data.taskReminders.filter((r) => r.taskId === id)).toHaveLength(1);
  });

  it("stays quiet until the 48-hour mark, then fires", async () => {
    const id = await createTask({ dueDate: hoursFromNow(72), assigneeIds: ["m2"] });

    expect(remindersFor("m2", new Date(), id)).toEqual([]);
    expect(remindersFor("m2", later(25), id).map((r) => r.reminder.kind)).toEqual(["due_soon"]);
  });

  it("fires again when the deadline passes, replacing the 48-hour reminder", async () => {
    const id = await createTask({ dueDate: hoursFromNow(20), assigneeIds: ["m2"] });
    ws.data.syncReminders(new Date());

    const overdue = remindersFor("m2", later(21), id);

    expect(overdue.map((r) => r.reminder.kind)).toEqual(["overdue"]);
    expect(ws.data.taskReminders.filter((r) => r.taskId === id).map((r) => r.kind)).toEqual(["due_soon", "overdue"]);
  });

  it("sends nothing for an unassigned task", async () => {
    const id = await createTask({ dueDate: hoursFromNow(5), assigneeIds: [] });

    ws.data.syncReminders(new Date());

    expect(ws.data.taskReminders.some((r) => r.taskId === id)).toBe(false);
  });

  it("clears reminders once the task is completed", async () => {
    const id = await createTask({ dueDate: hoursFromNow(10), assigneeIds: [ws.data.currentUserId] });
    expect(remindersFor(ws.data.currentUserId, new Date(), id)).toHaveLength(1);

    await ws.app.moveTaskAction(id, "DONE");

    expect(remindersFor(ws.data.currentUserId, new Date(), id)).toEqual([]);
  });

  it("re-arms when the deadline is moved later", async () => {
    const id = await createTask({ dueDate: hoursFromNow(10), assigneeIds: ["m2"] });
    ws.data.syncReminders(new Date());

    await ws.tasks.updateTaskAction(id, taskInput({ dueDate: hoursFromNow(24 * 10), assigneeIds: ["m2"] }));

    expect(remindersFor("m2", new Date(), id)).toEqual([]);
    expect(remindersFor("m2", later(24 * 10 - 30), id).map((r) => r.reminder.kind)).toEqual(["due_soon"]);
  });

  it("shows members only their own reminders and lets them mark them read", async () => {
    const id = await createTask({ dueDate: hoursFromNow(8), assigneeIds: [ws.data.currentUserId] });
    const [mine] = remindersFor(ws.data.currentUserId, new Date(), id);

    expect(ws.data.markReminderRead(mine.reminder.id, "m3")).toBe(false);
    expect(mine.reminder.readAt).toBeNull();

    const result = await ws.reminders.markReminderReadAction(mine.reminder.id);

    expect(result.ok).toBe(true);
    expect(remindersFor(ws.data.currentUserId, new Date(), id)[0].reminder.readAt).not.toBeNull();
  });

  it("marks all of a member's reminders read and lists unread first", async () => {
    const me = ws.data.currentUserId;
    const unreadBefore = ws.data.getRemindersForMember(me).filter((r) => !r.reminder.readAt).length;
    expect(unreadBefore).toBeGreaterThan(0);

    const result = await ws.reminders.markAllRemindersReadAction();

    expect(result).toEqual({ ok: true, data: { count: unreadBefore } });
    expect(ws.data.getRemindersForMember(me).every((r) => r.reminder.readAt)).toBe(true);
  });

  it("limits the committee-wide list to directors; members only see their own tasks", () => {
    const sener = ws.data.getMemberById("m5")!;
    ws.actAs("Committee Director");
    const director = ws.data.getCurrentUser();

    const memberView = ws.data.getReminders(sener).map((r) => r.task.id);
    const directorView = ws.data.getReminders(director).map((r) => r.task.id);

    expect(memberView.every((id) => ws.data.getTaskById(id)!.assigneeIds.includes("m5"))).toBe(true);
    expect(directorView.length).toBeGreaterThan(memberView.length);
  });

  it("seeds a due-soon and an overdue reminder for the Committee Member demo account", () => {
    const kinds = ws.data.getRemindersForMember("m5").map((r) => [r.task.id, r.reminder.kind]);

    expect(kinds).toEqual(expect.arrayContaining([["t15", "due_soon"], ["t16", "overdue"]]));
  });

  it("tells open pages when the next reminder is due so they refresh on time", async () => {
    const now = new Date();
    ws.data.syncReminders(now);
    const next = ws.data.getNextReminderAt(now);
    expect(next).not.toBeNull();

    const fireAt = new Date(next!);
    expect(fireAt.getTime()).toBeGreaterThan(now.getTime());
    expect(ws.data.syncReminders(new Date(fireAt.getTime() - 1000))).toBe(0);
    expect(ws.data.syncReminders(fireAt)).toBeGreaterThan(0);
  });

  it("bumps the workspace version when a reminder fires so open pages update", async () => {
    await createTask({ dueDate: hoursFromNow(72), assigneeIds: ["m2"] });
    ws.data.syncReminders(new Date());
    const version = ws.data.getWorkspaceVersion();

    ws.data.syncReminders(later(25));

    expect(ws.data.getWorkspaceVersion()).toBeGreaterThan(version);
  });
});
