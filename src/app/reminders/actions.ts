"use server";

import { markAllRemindersRead, markReminderRead } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { missing, ok } from "@/lib/action-result";
import type { ActionResult } from "@/lib/types";

export async function markReminderReadAction(id: string): Promise<ActionResult<null>> {
  const actor = await currentActor();
  if (!markReminderRead(id, actor.id)) return missing("reminder");
  return ok(null);
}

export async function markAllRemindersReadAction(): Promise<ActionResult<{ count: number }>> {
  const actor = await currentActor();
  return ok({ count: markAllRemindersRead(actor.id) });
}
