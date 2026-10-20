"use server";

import { revalidatePath } from "next/cache";
import { getTaskById, hasPermission, canUpdateTask, setTaskStatus, updateMemberAccessRole, bumpWorkspaceVersion } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { denied, invalid, missing, ok, signedOut } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import { ACCESS_ROLES, STATUS_ORDER, type AccessRole, type ActionResult, type TaskStatus } from "@/lib/types";

export async function moveTaskAction(id: string, status: TaskStatus): Promise<ActionResult<{ changed: boolean }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!STATUS_ORDER.includes(status)) return invalid({ status: "Choose Not started, In progress or Completed." });
  const task = await getTaskById(id);
  if (!task) return missing("task");
  if (!canUpdateTask(task, actor)) return denied("update this task");
  const change = await setTaskStatus(id, status, actor.id);
  if (change) await revalidateWorkspace();
  return ok({ changed: Boolean(change) });
}

export async function updateMemberRoleAction(memberId: string, accessRole: AccessRole) {
  const actor = await currentActor();
  if (!actor || !ACCESS_ROLES.includes(accessRole) || !hasPermission("manage_access", actor) || (actor.id === memberId && accessRole !== "IT Director")) {
    throw new Error("Only the IT Director can manage access roles.");
  }
  await updateMemberAccessRole(memberId, accessRole);
  await bumpWorkspaceVersion();
  revalidatePath("/members");
}
