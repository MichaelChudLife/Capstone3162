import type { AccessRole as DbAccessRole, ReminderKind as DbReminderKind } from "@/generated/prisma/enums";
import type { AccessRole, ReminderKind } from "./types";

export const ROLE_TO_DB: Record<AccessRole, DbAccessRole> = {
  "IT Director": "IT_DIRECTOR",
  "Committee Director": "COMMITTEE_DIRECTOR",
  "Events Director": "EVENTS_DIRECTOR",
  "Marketing Director": "MARKETING_DIRECTOR",
  "Finance Director": "FINANCE_DIRECTOR",
  "Committee Member": "COMMITTEE_MEMBER",
};

export const ROLE_FROM_DB = Object.fromEntries(
  Object.entries(ROLE_TO_DB).map(([role, dbRole]) => [dbRole, role]),
) as Record<DbAccessRole, AccessRole>;

export const KIND_TO_DB: Record<ReminderKind, DbReminderKind> = {
  due_soon: "DUE_SOON",
  overdue: "OVERDUE",
};

export const KIND_FROM_DB: Record<DbReminderKind, ReminderKind> = {
  DUE_SOON: "due_soon",
  OVERDUE: "overdue",
};
