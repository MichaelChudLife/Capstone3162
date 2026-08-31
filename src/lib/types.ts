export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
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
