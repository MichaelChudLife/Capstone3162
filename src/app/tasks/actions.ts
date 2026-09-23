"use server";

import { createTask, getEvents, getMembers, getTaskById, hasPermission, updateTask } from "@/lib/data";
import { syncCurrentUserFromSession } from "@/lib/auth";
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

export async function createTaskAction(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  await syncCurrentUserFromSession();
  if (!hasPermission("manage_tasks")) return denied("create tasks");
  const result = validateTaskInput(input, validationContext());
  if (!result.ok) return invalid(result.errors);
  const task = createTask(result.value);
  revalidateWorkspace();
  return ok({ id: task.id });
}

export async function updateTaskAction(id: string, input: TaskInput): Promise<ActionResult<{ id: string }>> {
  await syncCurrentUserFromSession();
  if (!hasPermission("manage_tasks")) return denied("edit tasks");
  const existing = getTaskById(id);
  if (!existing) return missing("task");
  const result = validateTaskInput(input, validationContext(existing.dueDate));
  if (!result.ok) return invalid(result.errors);
  updateTask(id, result.value);
  revalidateWorkspace();
  return ok({ id });
}
