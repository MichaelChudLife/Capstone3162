"use server";

import { addTaskComment, getTaskById, hasPermission } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { validateCommentInput } from "@/lib/validation";
import { denied, invalid, missing, ok, signedOut } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, CommentInput } from "@/lib/types";

export async function addCommentAction(taskId: string, input: CommentInput): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("view_workspace", actor)) return denied("comment on tasks");
  if (!(await getTaskById(taskId))) return missing("task");
  const result = validateCommentInput(input);
  if (!result.ok) return invalid(result.errors);
  const comment = await addTaskComment(taskId, actor.id, result.value.body);
  await revalidateWorkspace();
  return ok({ id: comment.id });
}
