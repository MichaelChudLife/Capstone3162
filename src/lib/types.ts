export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type AccessRole =
  | "IT Director"
  | "Committee Director"
  | "Events Director"
  | "Marketing Director"
  | "Finance Director"
  | "Committee Member";

export type Permission =
  | "manage_access"
  | "manage_tasks"
  | "manage_events"
  | "manage_budget"
  | "view_workspace"
  | "update_own_tasks";

export const ACCESS_ROLES: AccessRole[] = [
  "IT Director",
  "Committee Director",
  "Events Director",
  "Marketing Director",
  "Finance Director",
  "Committee Member",
];

export const ROLE_PERMISSIONS: Record<AccessRole, Permission[]> = {
  "IT Director": ["manage_access", "manage_tasks", "manage_events", "manage_budget", "view_workspace"],
  "Committee Director": ["manage_tasks", "manage_events", "manage_budget", "view_workspace"],
  "Events Director": ["manage_events", "manage_budget", "view_workspace"],
  "Marketing Director": ["view_workspace"],
  "Finance Director": ["manage_budget", "view_workspace"],
  "Committee Member": ["view_workspace", "update_own_tasks"],
};

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  accessRole: AccessRole;
  email: string;
}

export interface CcaEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assigneeIds: string[];
  eventId: string | null;
  createdAt: string;
}

// Money is stored as integer cents (AUD) so totals and variance never pick up
// floating-point drift. `actualCents` is null until spend has been recorded.
export interface BudgetItem {
  id: string;
  eventId: string;
  description: string;
  expectedCents: number;
  actualCents: number | null;
  createdAt: string;
}

export interface EventInput {
  title: string;
  description: string;
  date: string;
  location: string;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assigneeIds: string[];
  eventId: string | null;
}

export interface BudgetItemInput {
  description: string;
  expectedCents: number;
  actualCents: number | null;
}

export interface StatusChange {
  id: string;
  taskId: string;
  from: TaskStatus;
  to: TaskStatus;
  actorId: string | null;
  at: string;
}

export type ReminderKind = "due_soon" | "overdue";

export interface TaskReminder {
  id: string;
  taskId: string;
  memberId: string;
  kind: ReminderKind;
  dueDate: string;
  firedAt: string;
  readAt: string | null;
}

export interface Invite {
  id: string;
  email: string;
  accessRole: AccessRole;
  position: string;
  tokenHash: string;
  invitedById: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedMemberId: string | null;
  revokedAt: string | null;
}

export interface InviteInput {
  email: string;
  accessRole: AccessRole;
  position: string;
}

export interface SignupInput {
  name: string;
  password: string;
  confirmPassword: string;
}

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; message: string; errors?: FieldErrors };

export const PRIORITY_ORDER: Priority[] = ["HIGH", "MEDIUM", "LOW"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Completed",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
