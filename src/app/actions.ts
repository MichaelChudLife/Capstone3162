"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getTaskById, hasPermission, canUpdateTask, setTaskStatus, updateMemberAccessRole, bumpWorkspaceVersion } from "@/lib/data";
import { currentActor, syncCurrentUserFromSession } from "@/lib/auth";
import { denied, invalid, missing, ok } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import { ACCESS_ROLES, STATUS_ORDER, type AccessRole, type ActionResult, type TaskStatus } from "@/lib/types";

export async function moveTaskAction(id: string, status: TaskStatus): Promise<ActionResult<{ changed: boolean }>> {
  const actor = await currentActor();
  if (!STATUS_ORDER.includes(status)) return invalid({ status: "Choose Not started, In progress or Completed." });
  const task = getTaskById(id);
  if (!task) return missing("task");
  if (!canUpdateTask(task, actor)) return denied("update this task");
  const change = setTaskStatus(id, status, actor.id);
  if (change) revalidateWorkspace();
  return ok({ changed: Boolean(change) });
}

export async function updateMemberRoleAction(memberId: string, accessRole: AccessRole) {
  await syncCurrentUserFromSession();
  if (!ACCESS_ROLES.includes(accessRole) || !hasPermission("manage_access") || (getCurrentUser().id === memberId && accessRole !== "IT Director")) {
    throw new Error("Only the IT Director can manage access roles.");
  }
  updateMemberAccessRole(memberId, accessRole);
  bumpWorkspaceVersion();
  revalidatePath("/members");
}
