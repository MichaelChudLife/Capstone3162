"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/lib/data";
import { createSession, destroySession } from "@/lib/auth";
import { ok, refused } from "@/lib/action-result";
import type { ActionResult } from "@/lib/types";

export async function loginAction(email: string, password: string): Promise<ActionResult<null>> {
  const member = authenticate(email, password);
  if (!member) {
    return refused("Invalid email or password.");
  }
  await createSession(member.id);
  return ok(null);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
