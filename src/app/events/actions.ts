"use server";

import { createEvent, deleteEvent, getEventById, getTasksForEvent, hasPermission, updateEvent } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { validateEventInput } from "@/lib/validation";
import { denied, invalid, missing, ok, refused, signedOut } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, EventInput } from "@/lib/types";

export async function createEventAction(input: EventInput): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_events", actor)) return denied("create events");
  const result = validateEventInput(input);
  if (!result.ok) return invalid(result.errors);
  const event = await createEvent(result.value);
  await revalidateWorkspace();
  return ok({ id: event.id });
}

export async function updateEventAction(id: string, input: EventInput): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_events", actor)) return denied("edit events");
  if (!(await getEventById(id))) return missing("event");
  const result = validateEventInput(input);
  if (!result.ok) return invalid(result.errors);
  await updateEvent(id, result.value);
  await revalidateWorkspace();
  return ok({ id });
}

export async function deleteEventAction(
  id: string,
  options: { confirmSubtaskRemoval?: boolean } = {},
): Promise<ActionResult<{ removedTaskCount: number }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_events", actor)) return denied("delete events");
  if (!(await getEventById(id))) return missing("event");
  const subTaskCount = (await getTasksForEvent(id)).length;
  if (subTaskCount > 0 && !options.confirmSubtaskRemoval) {
    return refused(
      `This event has ${subTaskCount} sub-task${subTaskCount === 1 ? "" : "s"}. Confirm to delete ${subTaskCount === 1 ? "it" : "them"} with the event.`,
    );
  }
  const removed = await deleteEvent(id);
  await revalidateWorkspace();
  return ok({ removedTaskCount: removed?.removedTaskIds.length ?? 0 });
}
