"use server";

import { canUpdateTask, createTask, getEvents, getMembers, getTaskById, hasPermission, updateTask } from "@/lib/data";
import { validateTaskInput, type TaskValidationContext } from "@/lib/validation";
import { denied, invalid, missing, ok } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, TaskInput } from "@/lib/types";

function validationContext(previousDueDate?: string | null): TaskValidationContext {
  return {
    memberIds: getMembers().map((m) => m.id),
    eventIds: getEvents().map((e) => e.id),
    previousDueDate,
  };
}

function sameMemberSet(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const id of setA) if (!setB.has(id)) return false;
  return true;
}

export async function createTaskAction(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  if (!hasPermission("manage_tasks")) return denied("create tasks");
  const result = validateTaskInput(input, validationContext());
  if (!result.ok) return invalid(result.errors);
  const task = createTask(result.value);
  revalidateWorkspace();
  return ok({ id: task.id });
}

export async function updateTaskAction(id: string, input: TaskInput): Promise<ActionResult<{ id: string }>> {
  const existing = getTaskById(id);
  if (!existing) return missing("task");
  if (!canUpdateTask(existing)) return denied("edit tasks");

  // Members without manage_tasks may only update tasks assigned to them, and
  // can't use that access to reassign the task or move it to another event.
  if (!hasPermission("manage_tasks")) {
    const sameAssignees = sameMemberSet(input.assigneeIds, existing.assigneeIds);
    const sameEvent = (input.eventId || null) === (existing.eventId ?? null);
    if (!sameAssignees || !sameEvent) return denied("reassign tasks or move them between events");
  }

  const result = validateTaskInput(input, validationContext(existing.dueDate));
  if (!result.ok) return invalid(result.errors);
  updateTask(id, result.value);
  revalidateWorkspace();
  return ok({ id });
}
