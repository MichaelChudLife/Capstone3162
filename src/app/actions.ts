"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getTaskById, hasPermission, canUpdateTask, setTaskStatus, updateMemberAccessRole } from "@/lib/data";
import { syncCurrentUserFromSession } from "@/lib/auth";
import { ACCESS_ROLES, type AccessRole, type TaskStatus } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/events");
  revalidatePath("/reminders");
}

export async function moveTaskAction(id: string, status: TaskStatus) {
  await syncCurrentUserFromSession();
  const task = getTaskById(id);
  if (!task || !canUpdateTask(task)) throw new Error("You do not have permission to update this task.");
  setTaskStatus(id, status);
  revalidateAll();
}

export async function updateMemberRoleAction(memberId: string, accessRole: AccessRole) {
  await syncCurrentUserFromSession();
  if (!ACCESS_ROLES.includes(accessRole) || !hasPermission("manage_access") || (getCurrentUser().id === memberId && accessRole !== "IT Director")) {
    throw new Error("Only the IT Director can manage access roles.");
  }
  updateMemberAccessRole(memberId, accessRole);
  revalidatePath("/members");
}
