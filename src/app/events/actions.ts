"use server";

import { createEvent, deleteEvent, getEventById, getTasksForEvent, hasPermission, updateEvent } from "@/lib/data";
import { validateEventInput } from "@/lib/validation";
import { denied, invalid, missing, ok, refused } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, EventInput } from "@/lib/types";

export async function createEventAction(input: EventInput): Promise<ActionResult<{ id: string }>> {
  if (!hasPermission("manage_events")) return denied("create events");
  const result = validateEventInput(input);
  if (!result.ok) return invalid(result.errors);
  const event = createEvent(result.value);
  revalidateWorkspace();
  return ok({ id: event.id });
}

export async function updateEventAction(id: string, input: EventInput): Promise<ActionResult<{ id: string }>> {
  if (!hasPermission("manage_events")) return denied("edit events");
  if (!getEventById(id)) return missing("event");
  const result = validateEventInput(input);
  if (!result.ok) return invalid(result.errors);
  updateEvent(id, result.value);
  revalidateWorkspace();
  return ok({ id });
}

export async function deleteEventAction(
  id: string,
  options: { confirmSubtaskRemoval?: boolean } = {},
): Promise<ActionResult<{ removedTaskCount: number }>> {
  if (!hasPermission("manage_events")) return denied("delete events");
  if (!getEventById(id)) return missing("event");
  const subTaskCount = getTasksForEvent(id).length;
  if (subTaskCount > 0 && !options.confirmSubtaskRemoval) {
    return refused(
      `This event has ${subTaskCount} sub-task${subTaskCount === 1 ? "" : "s"}. Confirm to delete ${subTaskCount === 1 ? "it" : "them"} with the event.`,
    );
  }
  const removed = deleteEvent(id);
  revalidateWorkspace();
  return ok({ removedTaskCount: removed?.removedTaskIds.length ?? 0 });
}
