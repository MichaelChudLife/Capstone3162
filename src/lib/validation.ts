import {
  PRIORITY_ORDER,
  STATUS_ORDER,
  type EventInput,
  type FieldErrors,
  type TaskInput,
} from "./types";

export const LIMITS = {
  eventTitle: 100,
  eventDescription: 1000,
  eventLocation: 120,
  taskTitle: 120,
  taskDescription: 2000,
} as const;

export type Validation<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors<K> };

function isValidDate(value: string): boolean {
  return value.trim() !== "" && !Number.isNaN(new Date(value).getTime());
}

export function validateEventInput(raw: EventInput): Validation<EventInput, keyof EventInput> {
  const errors: FieldErrors<keyof EventInput> = {};
  const title = (raw.title ?? "").trim();
  const description = (raw.description ?? "").trim();
  const location = (raw.location ?? "").trim();
  const date = raw.date ?? "";

  if (!title) errors.title = "Give the event a title.";
  else if (title.length > LIMITS.eventTitle) errors.title = `Keep the title under ${LIMITS.eventTitle} characters.`;

  if (description.length > LIMITS.eventDescription) {
    errors.description = `Keep the description under ${LIMITS.eventDescription} characters.`;
  }

  if (location.length > LIMITS.eventLocation) {
    errors.location = `Keep the location under ${LIMITS.eventLocation} characters.`;
  }

  if (!date) errors.date = "Pick a date for the event.";
  else if (!isValidDate(date)) errors.date = "That date isn't valid.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { title, description, location, date: new Date(date).toISOString() },
  };
}

export interface TaskValidationContext {
  now?: Date;
  memberIds: string[];
  eventIds: string[];
  previousDueDate?: string | null;
}

export function validateTaskInput(
  raw: TaskInput,
  context: TaskValidationContext,
): Validation<TaskInput, keyof TaskInput> {
  const errors: FieldErrors<keyof TaskInput> = {};
  const now = context.now ?? new Date();
  const title = (raw.title ?? "").trim();
  const description = (raw.description ?? "").trim();

  if (!title) errors.title = "Give the task a title.";
  else if (title.length > LIMITS.taskTitle) errors.title = `Keep the title under ${LIMITS.taskTitle} characters.`;

  if (description.length > LIMITS.taskDescription) {
    errors.description = `Keep the description under ${LIMITS.taskDescription} characters.`;
  }

  if (!PRIORITY_ORDER.includes(raw.priority)) errors.priority = "Choose a priority level.";
  if (!STATUS_ORDER.includes(raw.status)) errors.status = "Choose a status.";

  let dueDate: string | null = null;
  if (raw.dueDate) {
    if (!isValidDate(raw.dueDate)) {
      errors.dueDate = "That deadline isn't a valid date.";
    } else {
      dueDate = new Date(raw.dueDate).toISOString();
      const unchanged = context.previousDueDate != null && dueDate === new Date(context.previousDueDate).toISOString();
      if (!unchanged && new Date(dueDate).getTime() < now.getTime()) {
        errors.dueDate = "Deadline cannot be in the past.";
      }
    }
  }

  const assigneeIds = [...new Set(raw.assigneeIds ?? [])];
  const unknownMember = assigneeIds.find((id) => !context.memberIds.includes(id));
  if (unknownMember) errors.assigneeIds = "One of the selected members no longer exists.";

  const eventId = raw.eventId || null;
  if (eventId && !context.eventIds.includes(eventId)) errors.eventId = "That event no longer exists.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title,
      description,
      status: raw.status,
      priority: raw.priority,
      dueDate,
      assigneeIds,
      eventId,
    },
  };
}
