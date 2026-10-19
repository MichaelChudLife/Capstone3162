import { MAX_AMOUNT_CENTS } from "./money";
import {
  ACCESS_ROLES,
  PRIORITY_ORDER,
  STATUS_ORDER,
  type BudgetItemInput,
  type EventInput,
  type FieldErrors,
  type InviteInput,
  type SignupInput,
  type TaskInput,
} from "./types";

export const LIMITS = {
  eventTitle: 100,
  eventDescription: 1000,
  eventLocation: 120,
  taskTitle: 120,
  taskDescription: 2000,
  budgetDescription: 120,
  email: 254,
  position: 60,
  memberName: 80,
  passwordMin: 10,
  passwordMax: 128,
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

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT_CENTS;
}

export function validateBudgetItemInput(
  raw: BudgetItemInput,
): Validation<BudgetItemInput, keyof BudgetItemInput> {
  const errors: FieldErrors<keyof BudgetItemInput> = {};
  const description = (raw.description ?? "").trim();

  if (!description) errors.description = "Describe what the cost is for.";
  else if (description.length > LIMITS.budgetDescription) {
    errors.description = `Keep the description under ${LIMITS.budgetDescription} characters.`;
  }

  if (!isAmount(raw.expectedCents)) errors.expectedCents = "Enter the expected cost as an AUD amount, e.g. 250.00.";

  const actualCents = raw.actualCents ?? null;
  if (actualCents !== null && !isAmount(actualCents)) {
    errors.actualCents = "Enter the actual spend as an AUD amount, e.g. 250.00.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return { ok: true, value: { description, expectedCents: raw.expectedCents, actualCents } };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normaliseEmail(email: string): string {
  return (email ?? "").trim().toLowerCase();
}

export function validateInviteInput(
  raw: InviteInput,
  context: { takenEmails: string[] },
): Validation<InviteInput, keyof InviteInput> {
  const errors: FieldErrors<keyof InviteInput> = {};
  const email = normaliseEmail(raw.email);
  const position = (raw.position ?? "").trim();

  if (!email) errors.email = "Enter the new member's email.";
  else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) errors.email = "That email address isn't valid.";
  else if (context.takenEmails.map(normaliseEmail).includes(email)) {
    errors.email = "This email already has an account or an open invite.";
  }

  if (!ACCESS_ROLES.includes(raw.accessRole)) errors.accessRole = "Choose an access role.";

  if (position.length > LIMITS.position) errors.position = `Keep the position under ${LIMITS.position} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return { ok: true, value: { email, accessRole: raw.accessRole, position } };
}

export function validateSignupInput(raw: SignupInput, context: { email: string }): Validation<SignupInput, keyof SignupInput> {
  const errors: FieldErrors<keyof SignupInput> = {};
  const name = (raw.name ?? "").trim().replace(/\s+/g, " ");
  const password = raw.password ?? "";

  if (name.length < 2) errors.name = "Enter your full name.";
  else if (name.length > LIMITS.memberName) errors.name = `Keep your name under ${LIMITS.memberName} characters.`;

  if (password.length < LIMITS.passwordMin) errors.password = `Use at least ${LIMITS.passwordMin} characters.`;
  else if (password.length > LIMITS.passwordMax) errors.password = `Use at most ${LIMITS.passwordMax} characters.`;
  else if (password.toLowerCase() === normaliseEmail(context.email)) errors.password = "Don't use your email as your password.";

  if (!errors.password && raw.confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return { ok: true, value: { name, password, confirmPassword: password } };
}
