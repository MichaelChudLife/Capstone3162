export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type AccessRole =
  | "IT Director"
  | "Committee Director"
  | "Events Director"
  | "Marketing Director"
  | "Finance Director"
  | "Committee Member";

export type Permission = "manage_access" | "manage_tasks" | "manage_events" | "view_workspace";

export const ACCESS_ROLES: AccessRole[] = [
  "IT Director",
  "Committee Director",
  "Events Director",
  "Marketing Director",
  "Finance Director",
  "Committee Member",
];

export const ROLE_PERMISSIONS: Record<AccessRole, Permission[]> = {
  "IT Director": ["manage_access", "manage_tasks", "manage_events", "view_workspace"],
  "Committee Director": ["manage_tasks", "manage_events", "view_workspace"],
  "Events Director": ["manage_events", "view_workspace"],
  "Marketing Director": ["view_workspace"],
  "Finance Director": ["view_workspace"],
  "Committee Member": ["view_workspace"],
};

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  accessRole: AccessRole;
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
  assigneeId: string | null;
  eventId: string | null;
  createdAt: string;
}

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
