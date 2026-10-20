"use server";

import { createInvite, getInviteById, getMembers, getOpenInvites, hasPermission, inviteState, renewInvite, revokeInvite } from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { generateInviteToken, invitePath } from "@/lib/invite-token";
import { validateInviteInput } from "@/lib/validation";
import { denied, invalid, missing, ok, refused, signedOut } from "@/lib/action-result";
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
  if (!actor) return signedOut();
  if (!hasPermission("manage_access", actor)) return denied("invite members");
  const [members, openInvites] = await Promise.all([getMembers(), getOpenInvites()]);
  const takenEmails = [
    ...members.map((m) => m.email),
    ...openInvites.filter((i) => inviteState(i) === "pending").map((i) => i.email),
  ];
  const result = validateInviteInput(input, { takenEmails });
  if (!result.ok) return invalid(result.errors);
  const { token, tokenHash } = generateInviteToken();
  const invite = await createInvite(result.value, tokenHash, actor.id);
  await revalidateWorkspace();
  return ok({ inviteId: invite.id, email: invite.email, path: invitePath(token), expiresAt: invite.expiresAt });
}

export async function renewInviteAction(id: string): Promise<ActionResult<InviteLink>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_access", actor)) return denied("manage invites");
  const existing = await getInviteById(id);
  if (!existing) return missing("invite");
  const state = inviteState(existing);
  if (state === "accepted" || state === "revoked") return refused(`This invite was already ${state}.`);
  const { token, tokenHash } = generateInviteToken();
  const invite = await renewInvite(id, tokenHash);
  if (!invite) return refused("This invite can no longer be renewed.");
  await revalidateWorkspace();
  return ok({ inviteId: invite.id, email: invite.email, path: invitePath(token), expiresAt: invite.expiresAt });
}

export async function revokeInviteAction(id: string): Promise<ActionResult<null>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_access", actor)) return denied("manage invites");
  if (!(await revokeInvite(id))) return missing("invite");
  await revalidateWorkspace();
  return ok(null);
}
