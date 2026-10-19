"use server";

import { acceptInvite, findInviteByTokenHash } from "@/lib/data";
import { inviteProblem } from "@/lib/invites";
import { createSession } from "@/lib/auth";
import { hashInviteToken } from "@/lib/invite-token";
import { hashPassword } from "@/lib/password";
import { validateSignupInput } from "@/lib/validation";
import { invalid, ok, refused } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, SignupInput } from "@/lib/types";

export async function acceptInviteAction(token: string, input: SignupInput): Promise<ActionResult<{ memberId: string }>> {
  const invite = findInviteByTokenHash(hashInviteToken(token));
  const problem = inviteProblem(invite);
  if (problem || !invite) return refused(problem ?? "This invite link isn't valid.");
  const result = validateSignupInput(input, { email: invite.email });
  if (!result.ok) return invalid(result.errors);
  const member = acceptInvite(invite.id, { name: result.value.name, passwordHash: hashPassword(result.value.password) });
  if (!member) return refused("This invite can no longer be used.");
  await createSession(member.id);
  revalidateWorkspace();
  return ok({ memberId: member.id });
}
