import type { ReminderKind, Task } from "./types";

export const DUE_SOON_HOURS = 48;

const HOUR = 3600000;
const MINUTE = 60000;

export function reminderKindFor(task: Pick<Task, "status" | "dueDate">, now: Date): ReminderKind | null {
  if (task.status === "DONE" || !task.dueDate) return null;
  const msLeft = new Date(task.dueDate).getTime() - now.getTime();
  if (Number.isNaN(msLeft)) return null;
  if (msLeft <= 0) return "overdue";
  if (msLeft <= DUE_SOON_HOURS * HOUR) return "due_soon";
  return null;
}

function span(ms: number): string {
  if (ms < HOUR) {
    const minutes = Math.max(1, Math.round(ms / MINUTE));
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  if (ms < 48 * HOUR) {
    const hours = Math.round(ms / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const days = Math.round(ms / (24 * HOUR));
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function reminderLabel(dueDate: string, now: Date): string {
  const ms = new Date(dueDate).getTime() - now.getTime();
  return ms > 0 ? `Due in ${span(ms)}` : `Overdue by ${span(-ms)}`;
}

export const REMINDER_TITLE: Record<ReminderKind, string> = {
  due_soon: "Due within 48 hours",
  overdue: "Overdue",
};
