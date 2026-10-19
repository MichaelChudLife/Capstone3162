"use server";

import { createInvite, getInviteById, getMembers, getOpenInvites, hasPermission, inviteState, renewInvite, revokeInvite } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { generateInviteToken, invitePath } from "@/lib/invite-token";
import { validateInviteInput } from "@/lib/validation";
import { denied, invalid, missing, ok, refused } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, InviteInput } from "@/lib/types";

interface InviteLink {
  inviteId: string;
  email: string;
  path: string;
  expiresAt: string;
}

export async function createInviteAction(input: InviteInput): Promise<ActionResult<InviteLink>> {
  const actor = await currentActor();
  if (!hasPermission("manage_access", actor)) return denied("invite members");
  const takenEmails = [
    ...getMembers().map((m) => m.email),
    ...getOpenInvites()
      .filter((i) => inviteState(i) === "pending")
      .map((i) => i.email),
  ];
  const result = validateInviteInput(input, { takenEmails });
  if (!result.ok) return invalid(result.errors);
  const { token, tokenHash } = generateInviteToken();
  const invite = createInvite(result.value, tokenHash, actor.id);
  revalidateWorkspace();
  return ok({ inviteId: invite.id, email: invite.email, path: invitePath(token), expiresAt: invite.expiresAt });
}

export async function renewInviteAction(id: string): Promise<ActionResult<InviteLink>> {
  const actor = await currentActor();
  if (!hasPermission("manage_access", actor)) return denied("manage invites");
  const existing = getInviteById(id);
  if (!existing) return missing("invite");
  const state = inviteState(existing);
  if (state === "accepted" || state === "revoked") return refused(`This invite was already ${state}.`);
  const { token, tokenHash } = generateInviteToken();
  const invite = renewInvite(id, tokenHash)!;
  revalidateWorkspace();
  return ok({ inviteId: invite.id, email: invite.email, path: invitePath(token), expiresAt: invite.expiresAt });
}

export async function revokeInviteAction(id: string): Promise<ActionResult<null>> {
  const actor = await currentActor();
  if (!hasPermission("manage_access", actor)) return denied("manage invites");
  if (!revokeInvite(id)) return missing("invite");
  revalidateWorkspace();
  return ok(null);
}
