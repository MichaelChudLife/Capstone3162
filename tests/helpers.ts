import { vi } from "vitest";
import type { AccessRole, BudgetItemInput, EventInput, TaskInput } from "@/lib/types";

export async function freshWorkspace() {
  vi.resetModules();
  const data = await import("@/lib/data");
  const events = await import("@/app/events/actions");
  const tasks = await import("@/app/tasks/actions");
  const budget = await import("@/app/events/budget-actions");
  const board = await import("@/app/actions");
  const actAs = (role: AccessRole) => data.updateMemberAccessRole(data.currentUserId, role);
  return { data, events, tasks, budget, board, actAs };
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

export function eventInput(overrides: Partial<EventInput> = {}): EventInput {
  return {
    title: "Careers Panel",
    description: "Alumni panel on graduate roles.",
    date: hoursFromNow(24 * 14),
    location: "Monash LTB",
    ...overrides,
  };
}

export function taskInput(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    title: "Book the room",
    description: "Reserve a room for 60 people.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: hoursFromNow(72),
    assigneeIds: ["m2"],
    eventId: null,
    ...overrides,
  };
}

export function budgetItemInput(overrides: Partial<BudgetItemInput> = {}): BudgetItemInput {
  return {
    label: "Photography",
    expectedCost: 150,
    actualCost: 0,
    ...overrides,
  };
}
