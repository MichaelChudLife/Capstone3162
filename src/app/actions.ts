"use server";

import { revalidatePath } from "next/cache";
import { createTask, getCurrentUser, hasPermission, setTaskStatus, updateMemberAccessRole, type NewTaskInput } from "@/lib/data";
import { ACCESS_ROLES, type AccessRole, type TaskStatus } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/events");
  revalidatePath("/reminders");
}

export async function createTaskAction(input: NewTaskInput) {
  if (!hasPermission("manage_tasks")) throw new Error("You do not have permission to create tasks.");
  createTask(input);
  revalidateAll();
}

export async function moveTaskAction(id: string, status: TaskStatus) {
  if (!hasPermission("manage_tasks")) throw new Error("You do not have permission to update tasks.");
  setTaskStatus(id, status);
  revalidateAll();
}

export async function updateMemberRoleAction(memberId: string, accessRole: AccessRole) {
  if (!ACCESS_ROLES.includes(accessRole) || !hasPermission("manage_access") || (getCurrentUser().id === memberId && accessRole !== "IT Director")) {
    throw new Error("Only the IT Director can manage access roles.");
  }
  updateMemberAccessRole(memberId, accessRole);
  revalidatePath("/members");
}
