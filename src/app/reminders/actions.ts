"use server";

import { markAllRemindersRead, markReminderRead } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { missing, ok, signedOut } from "@/lib/action-result";
import type { ActionResult } from "@/lib/types";

export async function markReminderReadAction(id: string): Promise<ActionResult<null>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!(await markReminderRead(id, actor.id))) return missing("reminder");
  return ok(null);
}

export async function markAllRemindersReadAction(): Promise<ActionResult<{ count: number }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  return ok({ count: await markAllRemindersRead(actor.id) });
}
