"use server";

import { createTask, getEvents, getMembers, getTaskById, hasPermission, updateTask } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { validateTaskInput, type TaskValidationContext } from "@/lib/validation";
import { denied, invalid, missing, ok, signedOut } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, TaskInput } from "@/lib/types";

async function validationContext(previousDueDate?: string | null): Promise<TaskValidationContext> {
  const [members, events] = await Promise.all([getMembers(), getEvents()]);
  return {
    memberIds: members.map((m) => m.id),
    eventIds: events.map((e) => e.id),
    previousDueDate,
  };
}

export async function createTaskAction(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_tasks", actor)) return denied("create tasks");
  const result = validateTaskInput(input, await validationContext());
  if (!result.ok) return invalid(result.errors);
  const task = await createTask(result.value);
  await revalidateWorkspace();
  return ok({ id: task.id });
}

export async function updateTaskAction(id: string, input: TaskInput): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_tasks", actor)) return denied("edit tasks");
  const existing = await getTaskById(id);
  if (!existing) return missing("task");
  const result = validateTaskInput(input, await validationContext(existing.dueDate));
  if (!result.ok) return invalid(result.errors);
  await updateTask(id, result.value, actor.id);
  await revalidateWorkspace();
  return ok({ id });
}
